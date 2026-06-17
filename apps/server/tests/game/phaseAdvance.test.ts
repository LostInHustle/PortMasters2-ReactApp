import { BOONS_TIER0, type CustomerOrder, type MarketCard, type PortId } from '@pm2/shared';
import { describe, expect, it } from 'vitest';
import {
  activePhase,
  advance,
  setPhase,
  type PhaseAdvanceContext,
  type PhaseAdvanceGame,
} from '../../src/game/phaseAdvance.js';
import type { Rng } from '../../src/game/randomUtil.js';

// Expected behavior hand-derived from PortMasters2/server.py SharedSession._active_phase/
// _set_phase/advance (lines 1236-1345).
function noShuffleRng(): Rng {
  return {
    random: () => 0,
    randint: () => 0,
    choice: (arr) => arr[0]!,
    weightedChoice: (items) => items[0]![0],
    shuffle: () => {},
  };
}

const PORT = '泉州港' as PortId;

function makeGame(overrides: Partial<PhaseAdvanceGame> = {}): PhaseAdvanceGame {
  return {
    phase2DemandTags: [],
    revealedIntel: [],
    unlockedPorts: () => [PORT],
    money: 100,
    intelCost: 5,
    equippedModules: [],
    difficulty: 'standard',
    brokerPirateRisk: 0,
    log: () => {},
    currentRound: 1,
    maxRounds: 8,
    gameOver: false,
    setMonsoonState: () => {},
    bankrupt: false,
    phase: 0,
    tierUnlock: {},
    modifierFlags: {},
    boonChoices: [],
    resourceCards: [],
    customerCards: [],
    rng: noShuffleRng(),
    unlockedResources: () => [],
    unlockedProducts: () => [],
    genResourceCard: (): MarketCard => ({
      port: PORT,
      resources: [],
      totalCost: 0,
      isProductCard: false,
    }),
    genEmperorMandateOrder: (size): CustomerOrder => ({
      kind: 'EmperorMandate',
      demandPort: PORT,
      resources: [],
      reward: 0,
      totalItems: size,
      isProductOrder: false,
    }),
    genMixedOrder: (): CustomerOrder => ({
      demandPort: PORT,
      resources: [],
      reward: 0,
      totalItems: 0,
      isProductOrder: false,
    }),
    processProduction: () => {},
    payWages: () => true,
    endRound: () => {},
    ...overrides,
  };
}

function makeCtx(
  g1: PhaseAdvanceGame,
  g2: PhaseAdvanceGame,
  overrides: Partial<PhaseAdvanceContext> = {},
): PhaseAdvanceContext {
  return {
    games: [g1, g2] as const,
    tradeReady: [false, false],
    tradeOrders: [],
    ready: new Set([0, 1]),
    tierUnlock: {},
    monsoonCycleCache: {},
    ...overrides,
  };
}

describe('activePhase', () => {
  it('follows the first non-gameOver game', () => {
    const g1 = makeGame({ gameOver: true, phase: 'endgame' });
    const g2 = makeGame({ gameOver: false, phase: 2 });
    expect(activePhase([g1, g2])).toBe(2);
  });

  it('falls back to games[0] when both have finished', () => {
    const g1 = makeGame({ gameOver: true, phase: 'endgame' });
    const g2 = makeGame({ gameOver: true, phase: 'bankruptcy' });
    expect(activePhase([g1, g2])).toBe('endgame');
  });
});

describe('setPhase', () => {
  it('sets the phase on every non-gameOver game and skips finished ones', () => {
    const g1 = makeGame({ gameOver: false, phase: 0 });
    const g2 = makeGame({ gameOver: true, phase: 'bankruptcy' });
    setPhase([g1, g2], 5);
    expect(g1.phase).toBe(5);
    expect(g2.phase).toBe('bankruptcy');
  });
});

describe('advance: phase 0 -> 5 (Fortune Tides)', () => {
  it('resyncs the monsoon and deals each non-gameOver game 4 boon choices', () => {
    const applied: unknown[] = [];
    const g1 = makeGame({
      phase: 0,
      setMonsoonState: (s) => applied.push(s),
    });
    const g2 = makeGame({
      phase: 0,
      gameOver: true,
      bankrupt: false,
      setMonsoonState: (s) => applied.push(s),
    });
    const ctx = makeCtx(g1, g2);
    advance(ctx, noShuffleRng());
    expect(g1.phase).toBe(5);
    expect(g1.boonChoices).toHaveLength(4);
    expect(g1.boonChoices.every((b) => BOONS_TIER0.some((t) => t.id === b.id))).toBe(true);
    // monsoon resync touched the non-gameOver game
    expect(applied.length).toBeGreaterThan(0);
    // a gameOver game is skipped: no boon draw, and setPhase left its phase untouched
    expect(g2.boonChoices).toHaveLength(0);
    expect(g2.phase).toBe(0);
    expect(ctx.ready.size).toBe(0);
  });
});

describe('advance: phase 5 -> 1 (Procure dealt)', () => {
  it('deals a 0-indexed resource hand and samples demand tags from unlocked items', () => {
    const g1 = makeGame({
      phase: 5,
      unlockedResources: () => ['麻布', '丝绸'],
      unlockedProducts: () => [],
    });
    const g2 = makeGame({ phase: 5, gameOver: true });
    const ctx = makeCtx(g1, g2);
    advance(ctx, noShuffleRng());
    expect(g1.phase).toBe(1);
    expect(g1.resourceCards.map((c) => c.id)).toEqual([0, 1, 2, 3, 4]);
    expect(g1.phase2DemandTags.length).toBeGreaterThan(0);
    expect(g1.phase2DemandTags.every((t) => ['麻布', '丝绸'].includes(t))).toBe(true);
  });

  it('reveals free intel from a boon and removes the revealed tag from the demand pool', () => {
    const g1 = makeGame({
      phase: 5,
      unlockedResources: () => ['麻布'],
      unlockedProducts: () => [],
      modifierFlags: { freeIntel: 1 },
    });
    const g2 = makeGame({ phase: 5, gameOver: true });
    const ctx = makeCtx(g1, g2);
    advance(ctx, noShuffleRng());
    expect(g1.revealedIntel).toHaveLength(1);
    expect(g1.revealedIntel[0]).toMatchObject({ item: '麻布', port: PORT, used: false });
    expect(g1.phase2DemandTags).toHaveLength(0);
  });

  it('does not reveal intel when no boon grants free_intel', () => {
    const g1 = makeGame({
      phase: 5,
      unlockedResources: () => ['麻布'],
      unlockedProducts: () => [],
      modifierFlags: {},
    });
    const g2 = makeGame({ phase: 5, gameOver: true });
    advance(makeCtx(g1, g2), noShuffleRng());
    expect(g1.revealedIntel).toHaveLength(0);
  });
});

describe('advance: phase 1 -> trade (Barter opens)', () => {
  it('moves to the trade phase and clears trade state', () => {
    const g1 = makeGame({ phase: 1 });
    const g2 = makeGame({ phase: 1 });
    const ctx = makeCtx(g1, g2, {
      tradeReady: [true, true],
      tradeOrders: [{ id: 'trade_1', sellerSlot: 0, sell: [], buy: [] }],
    });
    advance(ctx, noShuffleRng());
    expect(g1.phase).toBe('trade');
    expect(g2.phase).toBe('trade');
    expect(ctx.tradeReady).toEqual([false, false]);
    expect(ctx.tradeOrders).toEqual([]);
  });
});

describe('advance: phase worker_mgmt -> 2 (Artisans dealt)', () => {
  it('deals only mixed orders when no mandate is scheduled this round', () => {
    const g1 = makeGame({ phase: 'worker_mgmt', difficulty: 'easy', currentRound: 1 });
    const g2 = makeGame({ phase: 'worker_mgmt', gameOver: true });
    advance(makeCtx(g1, g2), noShuffleRng());
    expect(g1.phase).toBe(2);
    expect(g1.customerCards).toHaveLength(5);
    expect(g1.customerCards.every((o) => o.kind === undefined)).toBe(true);
    expect(g1.customerCards.map((o) => o.id)).toEqual([0, 1, 2, 3, 4]);
  });

  it('deals the Emperor Mandate first (id 0) on a scheduled round, then fills with mixed orders', () => {
    // easy's mandate schedule (packages/shared/src/data/difficulties.ts) fires size 0 at round 3.
    const g1 = makeGame({ phase: 'worker_mgmt', difficulty: 'easy', currentRound: 3 });
    const g2 = makeGame({ phase: 'worker_mgmt', gameOver: true });
    advance(makeCtx(g1, g2), noShuffleRng());
    expect(g1.customerCards[0]).toMatchObject({ id: 0, kind: 'EmperorMandate' });
    expect(g1.customerCards.slice(1).map((o) => o.id)).toEqual([1, 2, 3, 4]);
  });

  it('extraOrder modifier adds an extra order slot on top of the base option count', () => {
    const g1 = makeGame({
      phase: 'worker_mgmt',
      difficulty: 'easy',
      currentRound: 1,
      modifierFlags: { extraOrder: 1 },
    });
    const g2 = makeGame({ phase: 'worker_mgmt', gameOver: true });
    advance(makeCtx(g1, g2), noShuffleRng());
    expect(g1.customerCards).toHaveLength(6);
  });
});

describe('advance: phase 2 -> 3 (Upkeep settles)', () => {
  it('runs production and wages, advancing survivors to phase 3', () => {
    let produced = false;
    const g1 = makeGame({
      phase: 2,
      processProduction: () => {
        produced = true;
      },
      payWages: () => true,
    });
    const g2 = makeGame({ phase: 2, gameOver: true });
    advance(makeCtx(g1, g2), noShuffleRng());
    expect(produced).toBe(true);
    expect(g1.phase).toBe(3);
    expect(g1.gameOver).toBe(false);
  });

  it('bankrupts a game that cannot pay wages', () => {
    const g1 = makeGame({ phase: 2, payWages: () => false });
    const g2 = makeGame({ phase: 2, gameOver: true });
    advance(makeCtx(g1, g2), noShuffleRng());
    expect(g1.gameOver).toBe(true);
    expect(g1.bankrupt).toBe(true);
    expect(g1.phase).toBe('bankruptcy');
  });
});

describe('advance: phase 3 -> 4 (Shipyard opens)', () => {
  it('bumps every non-gameOver game to phase 4 and leaves finished games untouched', () => {
    const g1 = makeGame({ phase: 3 });
    const g2 = makeGame({ phase: 3, gameOver: true, bankrupt: true });
    advance(makeCtx(g1, g2), noShuffleRng());
    expect(g1.phase).toBe(4);
    // unlike phase 4's branch, phase 3 has no bankruptcy re-assertion -- a gameOver game
    // is simply skipped, so its phase is whatever it already was.
    expect(g2.phase).toBe(3);
  });
});

describe('advance: phase 4 -> 0 or endgame (round settles)', () => {
  it('ends the round and loops back to phase 0 when more rounds remain', () => {
    let ended = false;
    const g1 = makeGame({
      phase: 4,
      endRound: () => {
        ended = true;
      },
    });
    const g2 = makeGame({ phase: 4, gameOver: true });
    advance(makeCtx(g1, g2), noShuffleRng());
    expect(ended).toBe(true);
    expect(g1.phase).toBe(0);
  });

  it('moves to endgame when endRound flips gameOver', () => {
    const g1 = makeGame({
      phase: 4,
      endRound: function (this: PhaseAdvanceGame) {
        this.gameOver = true;
      },
    });
    const g2 = makeGame({ phase: 4, gameOver: true });
    const ctx = makeCtx(g1, g2);
    advance(ctx, noShuffleRng());
    expect(g1.phase).toBe('endgame');
  });

  it('re-asserts bankruptcy phase for an already-finished bankrupt game', () => {
    const g1 = makeGame({ phase: 4, gameOver: true, bankrupt: true, endRound: () => {} });
    const g2 = makeGame({ phase: 4, gameOver: true, bankrupt: true, endRound: () => {} });
    advance(makeCtx(g1, g2), noShuffleRng());
    expect(g1.phase).toBe('bankruptcy');
    expect(g2.phase).toBe('bankruptcy');
  });
});

describe('advance: ready gate', () => {
  it('always clears the ready set, regardless of which phase ran', () => {
    const g1 = makeGame({ phase: 3 });
    const g2 = makeGame({ phase: 3 });
    const ctx = makeCtx(g1, g2, { ready: new Set([0, 1]) });
    advance(ctx, noShuffleRng());
    expect(ctx.ready.size).toBe(0);
  });
});
