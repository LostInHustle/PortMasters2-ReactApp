import { describe, expect, it } from 'vitest';
import { buildSessionState } from '../../src/session/broadcastState.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py SharedSession.broadcast_state
// (lines 1450-1470): one state payload per recipient slot, "yours" vs "the other player's".
describe('buildSessionState', () => {
  it('puts the requested slot under yourGame/yourSlot and the other under otherGames/players', () => {
    const session = SharedSession.createPair('alice', 'bob');
    session.games[0]!.money = 42;
    session.games[1]!.money = 77;

    const forAlice = buildSessionState(session, 0, () => false);
    expect(forAlice.yourGame.money).toBe(42);
    expect(forAlice.otherGames['bob']!.money).toBe(77);
    expect(forAlice.yourSlot).toBe(1);
    expect(forAlice.players.map((p) => p.name)).toEqual(['alice', 'bob']);

    const forBob = buildSessionState(session, 1, () => false);
    expect(forBob.yourGame.money).toBe(77);
    expect(forBob.otherGames['alice']!.money).toBe(42);
    expect(forBob.yourSlot).toBe(2);
  });

  it('reports youReady/online/waitingForOther/tradeOrders/phaseReadyCount from session state', () => {
    const session = SharedSession.createPair('alice', 'bob');
    session.ready.add(0);
    session.createTradeOrder(0, [{ type: '麻布', quantity: 1 }], []);

    const isOnline = (username: string) => username === 'bob';
    const forAlice = buildSessionState(session, 0, isOnline);
    expect(forAlice.youReady).toBe(true);
    expect(forAlice.players.find((p) => p.name === 'bob')!.online).toBe(true);
    expect(forAlice.waitingForOther).toBe('已准备，等待对方点击继续...');
    expect(forAlice.tradeOrders).toHaveLength(1);
    expect(forAlice.phaseReadyCount).toBe(1);

    const forBob = buildSessionState(session, 1, isOnline);
    expect(forBob.youReady).toBe(false);
    expect(forBob.players.find((p) => p.name === 'alice')!.online).toBe(false);
  });
});
