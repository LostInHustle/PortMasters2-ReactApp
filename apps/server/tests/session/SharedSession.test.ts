import { MONSOON_TIER0 } from '@pm2/shared';
import { describe, expect, it } from 'vitest';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py SharedSession (lines 1208-1447).
describe('SharedSession constructor', () => {
  it('builds two fresh games at slots 1/2, sharing the agreed difficulty and an initial monsoon sync', () => {
    const session = SharedSession.createPair('alice', 'bob', 'hard');
    expect(session.players).toEqual(['alice', 'bob']);
    expect(session.difficulty).toBe('hard');
    expect(session.games[0]!.difficulty).toBe('hard');
    expect(session.games[1]!.difficulty).toBe('hard');
    expect(session.games[0]!.slot).toBe(1);
    expect(session.games[1]!.slot).toBe(2);
    expect(session.games[0]!.monsoonState).toEqual(MONSOON_TIER0[0]);
    expect(session.games[1]!.monsoonState).toEqual(MONSOON_TIER0[0]);
  });

  it('defaults to the easy difficulty when none is given', () => {
    const session = SharedSession.createPair('alice', 'bob');
    expect(session.difficulty).toBe('easy');
  });
});

describe('slotOf / otherPlayers', () => {
  it('resolves each player to their slot and to the other player', () => {
    const session = SharedSession.createPair('alice', 'bob');
    expect(session.slotOf('alice')).toBe(0);
    expect(session.slotOf('bob')).toBe(1);
    expect(session.otherPlayers('alice')).toEqual(['bob']);
    expect(session.otherPlayers('bob')).toEqual(['alice']);
  });
});

describe('advance', () => {
  it('drives the real phase state machine: round-1 phase 0 deals 4 boon choices and moves to phase 5', () => {
    const session = SharedSession.createPair('alice', 'bob');
    session.advance();
    expect(session.games[0]!.phase).toBe(5);
    expect(session.games[1]!.phase).toBe(5);
    expect(session.games[0]!.boonChoices).toHaveLength(4);
    expect(session.games[1]!.boonChoices).toHaveLength(4);
  });
});

describe('gateComplete / tradeGateComplete / phaseReadyCount', () => {
  it('is not complete until both slots are ready or finished', () => {
    const session = SharedSession.createPair('alice', 'bob');
    session.ready.add(0);
    expect(session.gateComplete()).toBe(false);
    expect(session.phaseReadyCount()).toBe(1);
    session.games[1]!.gameOver = true;
    expect(session.gateComplete()).toBe(true);
    expect(session.phaseReadyCount()).toBe(2);
  });

  it('reads the trade-ready flags instead of the continue gate while the active phase is trade', () => {
    const session = SharedSession.createPair('alice', 'bob');
    session.games[0]!.phase = 'trade';
    session.games[1]!.phase = 'trade';
    session.ready.add(0);
    session.ready.add(1);
    expect(session.phaseReadyCount()).toBe(0);
    session.tradeReady = [true, false];
    expect(session.tradeGateComplete()).toBe(false);
    expect(session.phaseReadyCount()).toBe(1);
  });
});

describe('completeTradeGate', () => {
  it('moves both games to worker_mgmt and clears trade/ready state', () => {
    const session = SharedSession.createPair('alice', 'bob');
    session.games[0]!.phase = 'trade';
    session.games[1]!.phase = 'trade';
    session.tradeReady = [true, true];
    session.createTradeOrder(0, [{ type: '麻布', quantity: 1 }], []);
    session.ready.add(0);
    session.completeTradeGate();
    expect(session.games[0]!.phase).toBe('worker_mgmt');
    expect(session.games[1]!.phase).toBe('worker_mgmt');
    expect(session.tradeReady).toEqual([false, false]);
    expect(session.tradeOrders).toEqual([]);
    expect(session.ready.size).toBe(0);
  });
});

describe('restart', () => {
  it('rebuilds both games on the original difficulty but keeps chat history', () => {
    const session = SharedSession.createPair('alice', 'bob', 'easy');
    session.addChat('alice', 'gg');
    session.games[0]!.money = 9999;
    session.ready.add(0);
    session.restart();
    expect(session.games[0]!.money).toBe(100);
    expect(session.games[0]!.difficulty).toBe('easy');
    expect(session.games[0]!.slot).toBe(1);
    expect(session.games[1]!.slot).toBe(2);
    expect(session.ready.size).toBe(0);
    expect(session.chatHistory).toEqual([{ from: 'alice', message: 'gg' }]);
  });
});

describe('waitingMessage', () => {
  it('prompts to ready up during trade when this player has not clicked ready', () => {
    const session = SharedSession.createPair('alice', 'bob');
    session.games[0]!.phase = 'trade';
    expect(session.waitingMessage(0)).toBe('请点击“准备就绪”以进入工匠管理');
  });

  it('says wait-for-partner during trade once this player is ready but the other is not', () => {
    const session = SharedSession.createPair('alice', 'bob');
    session.games[0]!.phase = 'trade';
    session.tradeReady = [true, false];
    expect(session.waitingMessage(0)).toBe('等待对方也点击准备就绪...');
  });

  it('returns null during trade once both players are ready', () => {
    const session = SharedSession.createPair('alice', 'bob');
    session.games[0]!.phase = 'trade';
    session.tradeReady = [true, true];
    expect(session.waitingMessage(0)).toBeNull();
  });

  it('prompts to wait outside of trade once this player has clicked continue', () => {
    const session = SharedSession.createPair('alice', 'bob');
    session.ready.add(0);
    expect(session.waitingMessage(0)).toBe('已准备，等待对方点击继续...');
  });

  it('returns null outside of trade when this player has not clicked continue', () => {
    const session = SharedSession.createPair('alice', 'bob');
    expect(session.waitingMessage(0)).toBeNull();
  });
});

describe('barter delegation', () => {
  it('creates, accepts, and rejects trade orders against the real PlayerGame instances', () => {
    const session = SharedSession.createPair('alice', 'bob');
    const rejected = session.createTradeOrder(0, [{ type: '麻布', quantity: 1 }], []);
    expect(rejected?.sellerSlot).toBe(0);
    expect(session.rejectTrade(rejected!.id)).toBe(rejected);
    expect(session.tradeOrders).toHaveLength(0);

    const order = session.createTradeOrder(0, [{ type: '麻布', quantity: 5 }], []);
    const before = session.games[1]!.inventory['麻布'];
    expect(session.acceptTrade(order!.id, 1)).toBe(true);
    expect(session.games[0]!.inventory['麻布']).toBe(3);
    expect(session.games[1]!.inventory['麻布']).toBe(before + 5);
  });
});

describe('addChat', () => {
  it('appends messages and caps history at 200, dropping the oldest first', () => {
    const session = SharedSession.createPair('alice', 'bob');
    for (let i = 0; i < 205; i++) {
      session.addChat('alice', `msg${i}`);
    }
    expect(session.chatHistory).toHaveLength(200);
    expect(session.chatHistory[0]).toEqual({ from: 'alice', message: 'msg5' });
    expect(session.chatHistory[199]).toEqual({ from: 'alice', message: 'msg204' });
  });
});
