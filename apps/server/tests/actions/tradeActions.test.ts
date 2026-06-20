import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  handleAcceptTrade,
  handleCreateTradeOrder,
  handleRejectTrade,
  handleSetTradeReady,
} from '../../src/actions/tradeActions.js';
import { UserStore } from '../../src/auth/UserStore.js';
import {
  createServerState,
  type Sendable,
  type ServerState,
} from '../../src/lobby/onlineRegistry.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py handle_game_action's
// setTradeReady/createTradeOrder/acceptTrade/rejectTrade branches (lines 1632-1660).
class FakeSocket implements Sendable {
  sent: unknown[] = [];
  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }
}

describe('trade actions', () => {
  let dir: string;
  let state: ServerState;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pm2-tradeactions-'));
    state = createServerState(new UserStore(join(dir, 'users.json')));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('handleSetTradeReady returns false outside trade, true inside, and completes the gate', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 1;
    expect(handleSetTradeReady(sess, 0)).toBe(false);

    sess.games[0]!.phase = 'trade';
    sess.games[1]!.phase = 'trade';
    expect(handleSetTradeReady(sess, 0)).toBe(true);
    expect(sess.tradeReady).toEqual([true, false]);

    expect(handleSetTradeReady(sess, 1)).toBe(true);
    expect(sess.games[0]!.phase).toBe('worker_mgmt'); // gate completed -> advanced
  });

  it('handleCreateTradeOrder returns true within trade regardless of malformed items', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 'trade';
    sess.games[1]!.phase = 'trade';
    expect(
      handleCreateTradeOrder(sess, 0, { sell: [{ type: 'junk', quantity: -1 }], buy: [] }),
    ).toBe(true);
    expect(sess.tradeOrders).toHaveLength(0);

    expect(
      handleCreateTradeOrder(sess, 0, { sell: [{ type: '麻布', quantity: 1 }], buy: [] }),
    ).toBe(true);
    expect(sess.tradeOrders).toHaveLength(1);
  });

  it('handleAcceptTrade returns true within trade regardless of success', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 'trade';
    sess.games[1]!.phase = 'trade';
    expect(handleAcceptTrade(sess, 1, { orderId: 'nope' })).toBe(true);

    sess.createTradeOrder(0, [{ type: '麻布', quantity: 1 }], []);
    const order = sess.tradeOrders[0]!;
    expect(handleAcceptTrade(sess, 1, { orderId: order.id })).toBe(true);
    expect(sess.tradeOrders).toHaveLength(0);
  });

  it('handleRejectTrade notifies the seller only when they are not the rejecter', () => {
    const aliceWs = new FakeSocket();
    state.online.set('alice', aliceWs);
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 'trade';
    sess.games[1]!.phase = 'trade';
    sess.createTradeOrder(0, [{ type: '麻布', quantity: 1 }], []);
    const order = sess.tradeOrders[0]!;

    expect(handleRejectTrade(state, sess, 1, 'bob', { orderId: order.id })).toBe(true);
    expect(aliceWs.sent).toEqual([
      { type: 'system_message', message: '❌ 对方拒绝了你的互市提案（出 麻布×1 ⇄ 换 ）' },
    ]);
  });

  it('handleRejectTrade does not notify when the rejecter is the order owner', () => {
    const aliceWs = new FakeSocket();
    state.online.set('alice', aliceWs);
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 'trade';
    sess.games[1]!.phase = 'trade';
    sess.createTradeOrder(0, [{ type: '麻布', quantity: 1 }], []);
    const order = sess.tradeOrders[0]!;

    expect(handleRejectTrade(state, sess, 0, 'alice', { orderId: order.id })).toBe(true);
    expect(aliceWs.sent).toEqual([]);
  });
});
