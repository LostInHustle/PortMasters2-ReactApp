import { describe, expect, it } from 'vitest';
import {
  effectivePirateRisk,
  pirateThreat,
  resolvePirateHazard,
} from '../../src/game/pirateHazard.js';
import type { Rng } from '../../src/game/randomUtil.js';

// A fixed-value Rng substitutes for live randomness so raid outcomes are asserted exactly
// rather than against Math.random() -- the seam the plan calls for (no Python-side equivalent
// to cross-check against here, since this is a Node-only testing affordance).
function fixedRng(value: number): Rng {
  return {
    random: () => value,
    randint: () => 0,
    choice: (arr) => arr[0]!,
    weightedChoice: (items) => items[0]![0],
    shuffle: () => {},
  };
}

describe('pirateThreat / effectivePirateRisk', () => {
  it('threat is the monsoon pirateRisk plus any broker tip-off risk', () => {
    const ctx = { monsoonState: { pirateRisk: 0.1 } as never, brokerPirateRisk: 0.2 };
    expect(pirateThreat(ctx)).toBeCloseTo(0.3);
  });

  it('immunity drives effective risk to 0 regardless of threat', () => {
    const ctx = {
      monsoonState: { pirateRisk: 0.5 } as never,
      brokerPirateRisk: 0,
      pirateImmunity: true,
      modifierFlags: {},
      equippedModules: [],
    };
    expect(effectivePirateRisk(ctx)).toBe(0);
  });

  it('persian_dome_compass scales risk by 0.7', () => {
    const ctx = {
      monsoonState: { pirateRisk: 0.5 } as never,
      brokerPirateRisk: 0,
      pirateImmunity: false,
      modifierFlags: {},
      equippedModules: [{ id: 'persian_dome_compass', name: '', icon: '', desc: '' }],
    };
    expect(effectivePirateRisk(ctx)).toBeCloseTo(0.35);
  });
});

// Expected values hand-derived from resolve_pirate_hazard (server.py lines 1011-1023):
// a raid lands iff rng.random() < effectivePirateRisk(); loss = trunc(money * pirateLossPct(...)).
describe('resolvePirateHazard', () => {
  function makeCtx() {
    return {
      monsoonState: { pirateRisk: 0.1 } as never,
      brokerPirateRisk: 0,
      pirateImmunity: false,
      modifierFlags: {},
      equippedModules: [],
      money: 100,
      roundCosts: 0,
      totalCosts: 0,
      difficulty: 'easy' as const,
      currentRound: 1,
      maxRounds: 8,
      log: () => {},
    };
  }

  it('no raid when the roll is above the risk threshold', () => {
    const ctx = makeCtx();
    resolvePirateHazard(ctx, fixedRng(0.5));
    expect(ctx.money).toBe(100);
    expect(ctx.roundCosts).toBe(0);
  });

  it('raid lands when the roll is below the risk threshold; loss is 15% of gold on easy', () => {
    const ctx = makeCtx();
    resolvePirateHazard(ctx, fixedRng(0.05));
    expect(ctx.money).toBe(85); // 100 - trunc(100 * 0.15)
    expect(ctx.roundCosts).toBe(15);
    expect(ctx.totalCosts).toBe(15);
  });

  it('immunity skips the roll entirely and leaves money untouched', () => {
    const ctx = { ...makeCtx(), pirateImmunity: true };
    resolvePirateHazard(ctx, fixedRng(0)); // even a guaranteed-hit roll must not apply
    expect(ctx.money).toBe(100);
  });
});
