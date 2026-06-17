import { describe, expect, it } from 'vitest';
import type { Sendable } from '../../src/lobby/onlineRegistry.js';
import { broadcastOnlineUsers, sendJson, sendToUser } from '../../src/ws/send.js';

// Expected behavior hand-derived from PortMasters2/server.py send_json/send_to_user/
// broadcast_online_users (lines 1480-1494).
class FakeSocket implements Sendable {
  sent: unknown[] = [];
  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }
}

describe('sendJson', () => {
  it('sends the JSON-serialized payload', () => {
    const ws = new FakeSocket();
    sendJson(ws, { type: 'ping', n: 1 });
    expect(ws.sent).toEqual([{ type: 'ping', n: 1 }]);
  });

  it('swallows a throwing send instead of propagating', () => {
    const ws: Sendable = {
      send: () => {
        throw new Error('socket closed');
      },
    };
    expect(() => sendJson(ws, { type: 'ping' })).not.toThrow();
  });
});

describe('sendToUser', () => {
  it('sends only when the username is online', () => {
    const ws = new FakeSocket();
    const state = { online: new Map([['alice', ws]]) };
    sendToUser(state, 'alice', { type: 'hi' });
    sendToUser(state, 'bob', { type: 'hi' });
    expect(ws.sent).toEqual([{ type: 'hi' }]);
  });
});

describe('broadcastOnlineUsers', () => {
  it('sends each online user the list of every other online user', () => {
    const alice = new FakeSocket();
    const bob = new FakeSocket();
    const carol = new FakeSocket();
    const state = {
      online: new Map<string, FakeSocket>([
        ['alice', alice],
        ['bob', bob],
        ['carol', carol],
      ]),
    };
    broadcastOnlineUsers(state);
    expect(alice.sent).toEqual([{ type: 'online_users_update', users: ['bob', 'carol'] }]);
    expect(bob.sent).toEqual([{ type: 'online_users_update', users: ['alice', 'carol'] }]);
    expect(carol.sent).toEqual([{ type: 'online_users_update', users: ['alice', 'bob'] }]);
  });
});
