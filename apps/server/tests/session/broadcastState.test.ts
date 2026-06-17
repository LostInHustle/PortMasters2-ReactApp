import { describe, expect, it } from 'vitest';
import { buildSessionState } from '../../src/session/broadcastState.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py SharedSession.broadcast_state
// (lines 1450-1470): one state payload per recipient slot, "yours" vs "the other player's".
describe('buildSessionState', () => {
  it('puts the requested slot under yourGame/yourSlot and the other under otherGame/partnerName', () => {
    const session = new SharedSession('alice', 'bob');
    session.games[0].money = 42;
    session.games[1].money = 77;

    const forAlice = buildSessionState(session, 0, () => false);
    expect(forAlice.yourGame.money).toBe(42);
    expect(forAlice.otherGame.money).toBe(77);
    expect(forAlice.yourSlot).toBe(1);
    expect(forAlice.partnerName).toBe('bob');

    const forBob = buildSessionState(session, 1, () => false);
    expect(forBob.yourGame.money).toBe(77);
    expect(forBob.otherGame.money).toBe(42);
    expect(forBob.yourSlot).toBe(2);
    expect(forBob.partnerName).toBe('alice');
  });

  it('reports youReady/partnerOnline/waitingForOther/tradeOrders/phaseReadyCount from session state', () => {
    const session = new SharedSession('alice', 'bob');
    session.ready.add(0);
    session.createTradeOrder(0, [{ type: '麻布', quantity: 1 }], []);

    const isOnline = (username: string) => username === 'bob';
    const forAlice = buildSessionState(session, 0, isOnline);
    expect(forAlice.youReady).toBe(true);
    expect(forAlice.partnerOnline).toBe(true);
    expect(forAlice.waitingForOther).toBe('已准备，等待对方点击继续...');
    expect(forAlice.tradeOrders).toHaveLength(1);
    expect(forAlice.phaseReadyCount).toBe(1);

    const forBob = buildSessionState(session, 1, isOnline);
    expect(forBob.youReady).toBe(false);
    expect(forBob.partnerOnline).toBe(false);
  });
});
