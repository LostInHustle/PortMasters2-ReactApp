import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UserStore } from '../../src/auth/UserStore.js';
import {
  createServerState,
  type Sendable,
  type ServerState,
} from '../../src/lobby/onlineRegistry.js';
import { SharedSession } from '../../src/session/SharedSession.js';
import { handleDisconnect, processMessage } from '../../src/ws/connectionHandler.js';

// Expected behavior hand-derived from PortMasters2/server.py handler (lines 1736-1820).
class FakeSocket implements Sendable {
  sent: unknown[] = [];
  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }
}

describe('connectionHandler', () => {
  let dir: string;
  let state: ServerState;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pm2-connhandler-'));
    state = createServerState(new UserStore(join(dir, 'users.json')));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe('before login', () => {
    it('registers a new account, trimming the username', () => {
      const ws = new FakeSocket();
      const result = processMessage(state, ws, null, {
        action: 'register',
        username: '  alice  ',
        password: 'longenough',
      });
      expect(result).toBeNull();
      expect(ws.sent).toEqual([
        { type: 'register_result', success: true, message: '注册成功，请登录' },
      ]);
    });

    it('logs in successfully and claims the online slot', () => {
      const ws = new FakeSocket();
      state.users.register('alice', 'longenough');
      const result = processMessage(state, ws, null, {
        action: 'login',
        username: 'alice',
        password: 'longenough',
      });
      expect(result).toBe('alice');
      expect(state.online.get('alice')).toBe(ws);
      expect(ws.sent[0]).toEqual({
        type: 'login_result',
        success: true,
        username: 'alice',
        message: '登录成功',
      });
    });

    it('refuses a second login for an already-online account', () => {
      state.users.register('alice', 'longenough');
      const ws1 = new FakeSocket();
      processMessage(state, ws1, null, {
        action: 'login',
        username: 'alice',
        password: 'longenough',
      });

      const ws2 = new FakeSocket();
      const result = processMessage(state, ws2, null, {
        action: 'login',
        username: 'alice',
        password: 'longenough',
      });
      expect(result).toBeNull();
      expect(ws2.sent[0]).toMatchObject({ success: false, message: '该账号已在其他设备登录' });
      expect(state.online.get('alice')).toBe(ws1);
    });

    it('on login resumes an existing session: notifies the partner and pushes session state', () => {
      state.users.register('alice', 'longenough');
      const bobWs = new FakeSocket();
      state.online.set('bob', bobWs);
      const sess = SharedSession.createPair('alice', 'bob');
      state.sessions.set('alice', sess);
      state.sessions.set('bob', sess);

      const aliceWs = new FakeSocket();
      processMessage(state, aliceWs, null, {
        action: 'login',
        username: 'alice',
        password: 'longenough',
      });

      expect(aliceWs.sent).toContainEqual({ type: 'session_resumed' });
      expect(bobWs.sent).toContainEqual({
        type: 'partner_status',
        username: 'alice',
        online: true,
      });
      expect(aliceWs.sent.some((m) => (m as { type: string }).type === 'state')).toBe(true);
    });

    it('rejects any other action with "please log in first"', () => {
      const ws = new FakeSocket();
      const result = processMessage(state, ws, null, { action: 'get_online_users' });
      expect(result).toBeNull();
      expect(ws.sent).toEqual([{ type: 'error', message: '请先登录' }]);
    });
  });

  describe('after login', () => {
    it('returns the online users excluding the caller', () => {
      const ws = new FakeSocket();
      state.online.set('alice', ws);
      state.online.set('bob', new FakeSocket());
      processMessage(state, ws, 'alice', { action: 'get_online_users' });
      expect(ws.sent).toEqual([{ type: 'online_users', users: ['bob'] }]);
    });

    it('routes get_chat_history to this session, or an empty list with none', () => {
      const ws = new FakeSocket();
      state.online.set('alice', ws);
      processMessage(state, ws, 'alice', { action: 'get_chat_history' });
      expect(ws.sent).toEqual([{ type: 'chat_history', history: [] }]);

      ws.sent = [];
      const sess = SharedSession.createPair('alice', 'bob');
      sess.addChat('alice', 'hi');
      state.sessions.set('alice', sess);
      processMessage(state, ws, 'alice', { action: 'get_chat_history' });
      expect(ws.sent).toEqual([
        { type: 'chat_history', history: [{ from: 'alice', message: 'hi' }] },
      ]);
    });

    it('routes any unrecognized action to handleGameAction', () => {
      const aliceWs = new FakeSocket();
      const bobWs = new FakeSocket();
      state.online.set('alice', aliceWs);
      state.online.set('bob', bobWs);
      const sess = SharedSession.createPair('alice', 'bob');
      state.sessions.set('alice', sess);
      state.sessions.set('bob', sess);

      processMessage(state, aliceWs, 'alice', { action: 'join_game' });
      expect(aliceWs.sent.some((m) => (m as { type: string }).type === 'state')).toBe(true);
    });
  });

  describe('handleDisconnect', () => {
    it('does nothing for a not-logged-in or already-superseded connection', () => {
      const ws = new FakeSocket();
      expect(() => handleDisconnect(state, ws, null)).not.toThrow();

      state.online.set('alice', new FakeSocket()); // a *different* socket now owns this username
      expect(() => handleDisconnect(state, ws, 'alice')).not.toThrow();
      expect(state.online.has('alice')).toBe(true);
    });

    it('removes the user, cancels their pending invite, and notifies the invitee', () => {
      const aliceWs = new FakeSocket();
      const bobWs = new FakeSocket();
      state.online.set('alice', aliceWs);
      state.online.set('bob', bobWs);
      state.pendingInvites.set('alice', {
        to: 'bob',
        difficulty: 'easy',
        timer: setTimeout(() => {}, 0),
      });

      handleDisconnect(state, aliceWs, 'alice');

      expect(state.online.has('alice')).toBe(false);
      expect(state.pendingInvites.has('alice')).toBe(false);
      expect(bobWs.sent).toContainEqual({ type: 'invite_cancelled', from: 'alice' });
    });

    it('notifies an online partner and pushes session state, without dropping the session', () => {
      const aliceWs = new FakeSocket();
      const bobWs = new FakeSocket();
      state.online.set('alice', aliceWs);
      state.online.set('bob', bobWs);
      const sess = SharedSession.createPair('alice', 'bob');
      state.sessions.set('alice', sess);
      state.sessions.set('bob', sess);

      handleDisconnect(state, aliceWs, 'alice');

      expect(bobWs.sent).toContainEqual({
        type: 'partner_status',
        username: 'alice',
        online: false,
      });
      expect(bobWs.sent.some((m) => (m as { type: string }).type === 'state')).toBe(true);
      expect(state.sessions.has('bob')).toBe(true);
    });

    it('recycles the session once both players have gone offline', () => {
      const aliceWs = new FakeSocket();
      state.online.set('alice', aliceWs);
      const sess = SharedSession.createPair('alice', 'bob');
      state.sessions.set('alice', sess);
      state.sessions.set('bob', sess);

      handleDisconnect(state, aliceWs, 'alice');

      expect(state.sessions.has('alice')).toBe(false);
      expect(state.sessions.has('bob')).toBe(false);
    });
  });
});
