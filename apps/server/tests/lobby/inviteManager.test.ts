import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserStore } from '../../src/auth/UserStore.js';
import {
  createServerState,
  type Sendable,
  type ServerState,
} from '../../src/lobby/onlineRegistry.js';
import { handleRespondInvite, handleSendInvite } from '../../src/lobby/inviteManager.js';

// Expected behavior hand-derived from PortMasters2/server.py handle_send_invite/
// handle_respond_invite/invite_timeout_task (lines 1496-1564).
class FakeSocket implements Sendable {
  sent: unknown[] = [];
  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }
}

describe('inviteManager', () => {
  let dir: string;
  let state: ServerState;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pm2-invite-'));
    state = createServerState(new UserStore(join(dir, 'users.json')));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.useRealTimers();
  });

  function goOnline(username: string): FakeSocket {
    const ws = new FakeSocket();
    state.online.set(username, ws);
    return ws;
  }

  describe('handleSendInvite', () => {
    it('rejects an empty or self target', () => {
      const alice = goOnline('alice');
      handleSendInvite(state, 'alice', '');
      handleSendInvite(state, 'alice', 'alice');
      expect(alice.sent).toEqual([
        { type: 'invite_result', success: false, message: '无效的邀请对象' },
        { type: 'invite_result', success: false, message: '无效的邀请对象' },
      ]);
    });

    it('rejects when the sender is already in a session', () => {
      const alice = goOnline('alice');
      goOnline('bob');
      state.sessions.set('alice', {} as never);
      handleSendInvite(state, 'alice', 'bob');
      expect(alice.sent).toEqual([
        { type: 'invite_result', success: false, message: '你已在游戏会话中，无法发出邀请' },
      ]);
    });

    it('rejects a target that is not online, and one already in a session', () => {
      const alice = goOnline('alice');
      handleSendInvite(state, 'alice', 'ghost');
      expect(alice.sent).toEqual([
        { type: 'invite_result', success: false, message: 'ghost 不在线，无法邀请' },
      ]);

      goOnline('bob');
      state.sessions.set('bob', {} as never);
      handleSendInvite(state, 'alice', 'bob');
      expect(alice.sent[1]).toEqual({
        type: 'invite_result',
        success: false,
        message: 'bob 正在游戏中，无法邀请',
      });
    });

    it('succeeds, notifies the target, and rejects a second invite while one is pending', () => {
      const alice = goOnline('alice');
      const bob = goOnline('bob');
      handleSendInvite(state, 'alice', 'bob', 'hard');

      expect(bob.sent).toEqual([{ type: 'invite_received', from: 'alice', difficulty: 'hard' }]);
      expect(alice.sent).toEqual([
        {
          type: 'invite_result',
          success: true,
          message: '邀请已发送给 bob，等待回应（60 秒内有效）',
        },
      ]);
      expect(state.pendingInvites.get('alice')).toMatchObject({ to: 'bob', difficulty: 'hard' });

      goOnline('carol');
      handleSendInvite(state, 'alice', 'carol');
      expect(alice.sent[1]).toEqual({
        type: 'invite_result',
        success: false,
        message: '你已向 bob 发出邀请，请等待对方回应或超时',
      });
    });

    it('enforces the 60s cooldown once the prior invite is no longer pending', () => {
      const alice = goOnline('alice');
      goOnline('bob');
      goOnline('carol');
      handleSendInvite(state, 'alice', 'bob');
      // Simulate the invite having already resolved (responded to / expired) without advancing
      // wall-clock time, so lastInviteAt is still fresh.
      state.pendingInvites.delete('alice');
      alice.sent = [];

      handleSendInvite(state, 'alice', 'carol');
      expect(alice.sent).toHaveLength(1);
      const msg = alice.sent[0] as { message: string };
      expect(msg.message).toMatch(/^每分钟只能发出一次邀请，请 \d+ 秒后再试$/);
    });

    it('times out after 60s, notifying both sides and clearing the pending invite', () => {
      vi.useFakeTimers();
      const alice = goOnline('alice');
      const bob = goOnline('bob');
      handleSendInvite(state, 'alice', 'bob');
      alice.sent = [];
      bob.sent = [];

      vi.advanceTimersByTime(60_000);

      expect(alice.sent).toEqual([{ type: 'invite_timeout', to: 'bob' }]);
      expect(bob.sent).toEqual([{ type: 'invite_cancelled', from: 'alice' }]);
      expect(state.pendingInvites.has('alice')).toBe(false);
    });
  });

  describe('handleRespondInvite', () => {
    it('reports a stale/unknown invite', () => {
      const bob = goOnline('bob');
      handleRespondInvite(state, 'bob', 'alice', true);
      expect(bob.sent).toEqual([{ type: 'system_message', message: '该邀请已失效' }]);
    });

    it('notifies the sender on rejection and clears the pending invite', () => {
      const alice = goOnline('alice');
      goOnline('bob');
      handleSendInvite(state, 'alice', 'bob');
      alice.sent = [];

      handleRespondInvite(state, 'bob', 'alice', false);
      expect(alice.sent).toEqual([{ type: 'invite_rejected', from: 'bob' }]);
      expect(state.pendingInvites.has('alice')).toBe(false);
    });

    it('refuses to start a session if the sender has gone offline', () => {
      goOnline('alice');
      const bob = goOnline('bob');
      handleSendInvite(state, 'alice', 'bob');
      state.online.delete('alice');
      bob.sent = [];

      handleRespondInvite(state, 'bob', 'alice', true);
      expect(bob.sent).toEqual([{ type: 'system_message', message: '对方已离线，邀请失效' }]);
      expect(state.sessions.has('bob')).toBe(false);
    });

    it('accepts, builds a session for both players, and pushes state to both', () => {
      const alice = goOnline('alice');
      const bob = goOnline('bob');
      handleSendInvite(state, 'alice', 'bob', 'hard');
      alice.sent = [];
      bob.sent = [];

      handleRespondInvite(state, 'bob', 'alice', true);

      expect(alice.sent[0]).toEqual({
        type: 'invite_accepted',
        partner: 'bob',
        difficulty: 'hard',
      });
      expect(bob.sent[0]).toEqual({
        type: 'invite_accepted',
        partner: 'alice',
        difficulty: 'hard',
      });
      expect(state.sessions.get('alice')).toBe(state.sessions.get('bob'));
      expect(alice.sent.some((m) => (m as { type: string }).type === 'state')).toBe(true);
      expect(bob.sent.some((m) => (m as { type: string }).type === 'state')).toBe(true);
    });
  });
});
