import type { Worker } from '@pm2/shared';
import { describe, expect, it } from 'vitest';
import { PlayerGame } from '../../src/game/PlayerGame.js';
import { serializePlayerGame } from '../../src/game/serialize.js';

function makeWorker(overrides: Partial<Worker> = {}): Worker {
  return { task: null, progress: 0, producedCount: 0, isSkilled: false, ...overrides };
}

// Expected shape hand-derived from PlayerGame.to_dict() (PortMasters2/server.py lines 1073-1129).
describe('serializePlayerGame', () => {
  it('sends monsoon_state and pirate_immunity in snake_case, matching the original frontend', () => {
    const game = new PlayerGame('easy');
    const state = serializePlayerGame(game);
    expect(state.monsoon_state?.id).toBe('spring_current');
    expect(state.pirate_immunity).toBe(false);
  });

  it('exposes only the length of phase2DemandTags as intelRemaining (fog of war)', () => {
    const game = new PlayerGame('easy');
    game.phase2DemandTags = ['麻布', '丝绸', '茶叶'];
    const state = serializePlayerGame(game);
    expect(state.intelRemaining).toBe(3);
    expect(state).not.toHaveProperty('phase2DemandTags');
  });

  it('sends only the last 10 log lines, matching self.lastLogs[-10:]', () => {
    const game = new PlayerGame('easy');
    for (let i = 0; i < 12; i++) game.log(`line ${i}`);
    const state = serializePlayerGame(game);
    expect(state.logs).toHaveLength(10);
    expect(state.logs[0]).toBe('line 2');
    expect(state.logs[9]).toBe('line 11');
  });

  it('flattens purchasedCards/completedOrders Sets into arrays', () => {
    const game = new PlayerGame('easy');
    game.purchasedCards.add(0);
    game.purchasedCards.add(2);
    game.completedOrders.add(1);
    const state = serializePlayerGame(game);
    expect(state.purchasedCards).toEqual([0, 2]);
    expect(state.completedOrders).toEqual([1]);
  });

  it('flattens each worker roster onto its own named field', () => {
    const game = new PlayerGame('easy');
    game.workers.weaver.push(makeWorker({ task: '麻衣' }));
    game.workers.jeweler.push(makeWorker(), makeWorker());
    const state = serializePlayerGame(game);
    expect(state.weavers).toHaveLength(1);
    expect(state.weavers[0]?.task).toBe('麻衣');
    expect(state.jewelers).toHaveLength(2);
    expect(state.masterWeavers).toEqual([]);
  });

  it('reports charterEvent as null on a round with no scheduled tier unlock', () => {
    const game = new PlayerGame('easy'); // easy never unlocks a tier
    expect(serializePlayerGame(game).charterEvent).toBeNull();
  });

  it('reports charterEvent on the exact round a tier unlocks for standard difficulty', () => {
    const game = new PlayerGame('standard');
    game.currentRound = 4; // standard's tierUnlock: {1: 4, 2: 8}
    expect(serializePlayerGame(game).charterEvent?.id).toBe('tier1');
  });

  it('reports brokerCorruption from the difficulty config, not per-instance state', () => {
    expect(serializePlayerGame(new PlayerGame('easy')).brokerCorruption).toBe(false);
    expect(serializePlayerGame(new PlayerGame('hard')).brokerCorruption).toBe(true);
  });
});
