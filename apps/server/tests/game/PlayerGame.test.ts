import { describe, expect, it } from 'vitest';
import { PlayerGame } from '../../src/game/PlayerGame.js';

// Expected values hand-derived from PlayerGame.__init__ (PortMasters2/server.py lines 442-493).
describe('PlayerGame constructor', () => {
  it('defaults to easy difficulty with its rounds/tier-unlock schedule', () => {
    const game = new PlayerGame();
    expect(game.difficulty).toBe('easy');
    expect(game.maxRounds).toBe(8);
    expect(game.tierUnlock).toEqual({});
  });

  it('sets the starting money/score/round and fixed costs', () => {
    const game = new PlayerGame();
    expect(game.money).toBe(100);
    expect(game.score).toBe(0);
    expect(game.currentRound).toBe(1);
    expect(game.fixedCost).toBe(15);
    expect(game.shipLevel).toBe(0);
    expect(game.shipUpgradeCost).toEqual([15, 25, 40]);
    expect(game.phase).toBe(0);
    expect(game.intelCost).toBe(5);
    expect(game.slot).toBeNull();
  });

  it('seeds the starting inventory with 8 hemp / 5 silk / 3 tea and 0 everything else', () => {
    const game = new PlayerGame();
    expect(game.inventory['麻布']).toBe(8);
    expect(game.inventory['丝绸']).toBe(5);
    expect(game.inventory['茶叶']).toBe(3);
    expect(game.inventory['瓷土']).toBe(0);
    expect(game.inventory['麻衣']).toBe(0);
  });

  it('starts on the spring_current monsoon state (MONSOON_STATES[0])', () => {
    const game = new PlayerGame();
    expect(game.monsoonState?.id).toBe('spring_current');
    expect(game.monsoonState?.pirateRisk).toBeCloseTo(0.1);
  });

  it('starts every worker roster empty', () => {
    const game = new PlayerGame();
    expect(game.workers.weaver).toEqual([]);
    expect(game.workers.master).toEqual([]);
    expect(game.workers.jeweler).toEqual([]);
  });

  it('normalizes an unknown difficulty to easy', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const game = new PlayerGame('bogus' as any);
    expect(game.difficulty).toBe('easy');
  });

  it('honors standard/hard difficulty schedules', () => {
    const standard = new PlayerGame('standard');
    expect(standard.maxRounds).toBe(12);
    expect(standard.tierUnlock).toEqual({ 1: 4, 2: 8 });

    const hard = new PlayerGame('hard');
    expect(hard.maxRounds).toBe(16);
    expect(hard.tierUnlock).toEqual({ 1: 6, 2: 10 });
  });
});

// Expected values hand-derived from end_round (PortMasters2/server.py lines 1025-1071).
describe('PlayerGame.endRound', () => {
  it('settles income tax, snapshots lastRoundSummary, and resets round counters', () => {
    const game = new PlayerGame('easy');
    game.roundRevenue = 200;
    game.roundCosts = 50;
    game.maintenanceCosts = 15;
    game.workerWages = 10;
    // preTax = 200 - 50 - 15 - 10 = 125 -> tax = trunc(125 * 0.1) = 12
    game.endRound();

    expect(game.money).toBe(88); // 100 - 12
    expect(game.incomeTaxPaid).toBe(12);
    expect(game.lastRoundSummary).toEqual({
      round: 1,
      revenue: 200,
      costs: 50,
      incomeTax: 12,
      money: 88,
      score: 0,
    });
    expect(game.currentRound).toBe(2);
    expect(game.phase).toBe(0);
    expect(game.roundRevenue).toBe(0);
    expect(game.roundCosts).toBe(0);
    expect(game.maintenanceCosts).toBe(0);
    expect(game.workerWages).toBe(0);
    expect(game.gameOver).toBe(false);
  });

  it('pays only what it can when money is short of the tax owed', () => {
    const game = new PlayerGame('easy');
    game.money = 5;
    game.roundRevenue = 100; // preTax = 100 -> tax = trunc(100 * 0.1) = 10 > money(5)
    game.endRound();

    expect(game.money).toBe(0);
    expect(game.incomeTaxPaid).toBe(5);
    expect(game.lastRoundSummary?.incomeTax).toBe(5);
  });

  it('flags gameOver once currentRound passes maxRounds, skipping the next-round reset', () => {
    const game = new PlayerGame('easy');
    game.currentRound = game.maxRounds; // 8
    game.phase = 3;
    game.purchaseCount = 5;
    game.endRound();

    expect(game.currentRound).toBe(9);
    expect(game.gameOver).toBe(true);
    // Per server.py's early return on gameOver, these are NOT reset.
    expect(game.phase).toBe(3);
    expect(game.purchaseCount).toBe(5);
  });
});
