import type { MonsoonState } from '@pm2/shared';
import { MONSOON_TIER0 } from '@pm2/shared';
import { describe, expect, it } from 'vitest';
import { syncMonsoonState, type MonsoonSyncGame } from '../../src/game/monsoonSync.js';
import type { Rng } from '../../src/game/randomUtil.js';

// Expected behavior hand-derived from PortMasters2/server.py SharedSession.sync_monsoon_state
// (lines 1248-1261).
function fixedRng(chosen: MonsoonState): Rng {
  return {
    random: () => 0,
    randint: () => 0,
    choice: () => chosen as never,
    weightedChoice: (items) => items[0]![0],
    shuffle: () => {},
  };
}

function throwingRng(): Rng {
  return {
    random: () => {
      throw new Error('should not be called');
    },
    randint: () => {
      throw new Error('should not be called');
    },
    choice: () => {
      throw new Error('should not be called');
    },
    weightedChoice: () => {
      throw new Error('should not be called');
    },
    shuffle: () => {
      throw new Error('should not be called');
    },
  };
}

interface TestGame extends MonsoonSyncGame {
  applied: MonsoonState[];
}

function emptyCache(): Record<number, MonsoonState> {
  return {};
}

function makeGame(currentRound: number, maxRounds: number, gameOver = false): TestGame {
  const game: TestGame = {
    currentRound,
    maxRounds,
    gameOver,
    applied: [],
    setMonsoonState(state: MonsoonState) {
      game.applied.push(state);
    },
  };
  return game;
}

describe('syncMonsoonState', () => {
  it('cycle 0 (rounds 1-2) always resolves to the Spring Current opening, uncached', () => {
    const g1 = makeGame(1, 8);
    const g2 = makeGame(1, 8);
    const ctx = { games: [g1, g2] as const, tierUnlock: {}, monsoonCycleCache: emptyCache() };
    syncMonsoonState(ctx, throwingRng());
    expect(g1.applied[0]).toEqual(MONSOON_TIER0[0]);
    expect(ctx.monsoonCycleCache).toEqual({});
  });

  it('cycle 1 (rounds 3-4) rolls once via rng.choice and caches it under the cycle index', () => {
    const chosen = { id: 'picked' } as unknown as MonsoonState;
    const g1 = makeGame(3, 8);
    const g2 = makeGame(3, 8);
    const ctx = { games: [g1, g2] as const, tierUnlock: {}, monsoonCycleCache: emptyCache() };
    syncMonsoonState(ctx, fixedRng(chosen));
    expect(g1.applied[0]).toBe(chosen);
    expect(g2.applied[0]).toBe(chosen);
    expect(ctx.monsoonCycleCache[1]).toBe(chosen);
  });

  it('a second sync within the same already-cached cycle reuses the cache without re-rolling', () => {
    const cached = { id: 'cached' } as unknown as MonsoonState;
    const g1 = makeGame(4, 8);
    const g2 = makeGame(4, 8);
    const ctx = { games: [g1, g2] as const, tierUnlock: {}, monsoonCycleCache: { 1: cached } };
    syncMonsoonState(ctx, throwingRng());
    expect(g1.applied[0]).toBe(cached);
  });

  it('uses the first non-gameOver game to determine the active round', () => {
    const finished = makeGame(99, 8, true);
    const active = makeGame(3, 8);
    const chosen = { id: 'picked' } as unknown as MonsoonState;
    const ctx = {
      games: [finished, active] as const,
      tierUnlock: {},
      monsoonCycleCache: emptyCache(),
    };
    syncMonsoonState(ctx, fixedRng(chosen));
    expect(ctx.monsoonCycleCache[1]).toBe(chosen);
  });

  it('clamps the active round into [1, maxRounds] before computing the cycle', () => {
    const overshot = makeGame(99, 8);
    const ctx = {
      games: [overshot, makeGame(99, 8)] as const,
      tierUnlock: {},
      monsoonCycleCache: emptyCache(),
    };
    const chosen = { id: 'picked' } as unknown as MonsoonState;
    syncMonsoonState(ctx, fixedRng(chosen));
    // round clamps to maxRounds=8 -> cycle = floor((8-1)/2) = 3
    expect(ctx.monsoonCycleCache[3]).toBe(chosen);
  });

  it('propagates the resolved state to both games', () => {
    const g1 = makeGame(1, 8);
    const g2 = makeGame(1, 8);
    const ctx = { games: [g1, g2] as const, tierUnlock: {}, monsoonCycleCache: emptyCache() };
    syncMonsoonState(ctx, throwingRng());
    expect(g1.applied).toHaveLength(1);
    expect(g2.applied).toHaveLength(1);
  });
});
