import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UserStore } from '../../src/auth/UserStore.js';
import { handleSendChat } from '../../src/lobby/chat.js';
import {
  createServerState,
  type Sendable,
  type ServerState,
} from '../../src/lobby/onlineRegistry.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py handle_send_chat (lines 1567-1580).
class FakeSocket implements Sendable {
  sent: unknown[] = [];
  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }
}

describe('handleSendChat', () => {
  let dir: string;
  let state: ServerState;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pm2-chat-'));
    state = createServerState(new UserStore(join(dir, 'users.json')));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('tells a partnerless sender they have no one to message', () => {
    const alice = new FakeSocket();
    state.online.set('alice', alice);
    handleSendChat(state, 'alice', 'hi');
    expect(alice.sent).toEqual([
      { type: 'system_message', message: '你还没有游戏伙伴，无法发送消息' },
    ]);
  });

  it('tells the sender when their partner is offline', () => {
    const alice = new FakeSocket();
    state.online.set('alice', alice);
    state.sessions.set('alice', SharedSession.createPair('alice', 'bob'));
    handleSendChat(state, 'alice', 'hi');
    expect(alice.sent).toEqual([{ type: 'system_message', message: '对方已离线，无法发送消息' }]);
  });

  it('drops a message that is empty after trimming, without notifying anyone', () => {
    const alice = new FakeSocket();
    const bob = new FakeSocket();
    state.online.set('alice', alice);
    state.online.set('bob', bob);
    const sess = SharedSession.createPair('alice', 'bob');
    state.sessions.set('alice', sess);
    handleSendChat(state, 'alice', '   ');
    expect(bob.sent).toEqual([]);
    expect(sess.chatHistory).toEqual([]);
  });

  it('trims, caps at 500 chars, records history, and forwards to the partner', () => {
    const alice = new FakeSocket();
    const bob = new FakeSocket();
    state.online.set('alice', alice);
    state.online.set('bob', bob);
    const sess = SharedSession.createPair('alice', 'bob');
    state.sessions.set('alice', sess);
    const long = '  ' + 'x'.repeat(600) + '  ';

    handleSendChat(state, 'alice', long);

    const expected = 'x'.repeat(500);
    expect(sess.chatHistory).toEqual([{ from: 'alice', message: expected }]);
    expect(bob.sent).toEqual([{ type: 'chat_message', from: 'alice', message: expected }]);
  });
});
