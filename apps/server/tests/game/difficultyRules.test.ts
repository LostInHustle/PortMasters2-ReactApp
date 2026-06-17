import { describe, expect, it } from 'vitest';
import {
  difficultyBrokerCorruption,
  difficultyRounds,
  difficultyTierUnlock,
  emperorMandateSize,
  normalizeDifficulty,
  phaseOptionCount,
  pirateLossPct,
  unlocked,
  unlockedTier,
} from '../../src/game/difficultyRules.js';

// Expected values hand-derived from PortMasters2/server.py DIFFICULTIES (lines 58-80) and
// normalize_difficulty/difficulty_rounds/difficulty_tier_unlock/difficulty_broker_corruption
// (lines 84-102).
describe('normalizeDifficulty', () => {
  it('passes through known difficulties', () => {
    expect(normalizeDifficulty('hard')).toBe('hard');
    expect(normalizeDifficulty('standard')).toBe('standard');
  });

  it('falls back to easy for anything unknown', () => {
    expect(normalizeDifficulty('bogus')).toBe('easy');
    expect(normalizeDifficulty(undefined)).toBe('easy');
  });
});

describe('difficultyRounds / difficultyTierUnlock / difficultyBrokerCorruption', () => {
  it('easy: 8 rounds, no tier unlocks, no broker corruption', () => {
    expect(difficultyRounds('easy')).toBe(8);
    expect(difficultyTierUnlock('easy')).toEqual({});
    expect(difficultyBrokerCorruption('easy')).toBe(false);
  });

  it('standard: 12 rounds, tier unlocks at rounds 4/8', () => {
    expect(difficultyRounds('standard')).toBe(12);
    expect(difficultyTierUnlock('standard')).toEqual({ 1: 4, 2: 8 });
    expect(difficultyBrokerCorruption('standard')).toBe(false);
  });

  it('hard: 16 rounds, tier unlocks at rounds 6/10, broker corruption on', () => {
    expect(difficultyRounds('hard')).toBe(16);
    expect(difficultyTierUnlock('hard')).toEqual({ 1: 6, 2: 10 });
    expect(difficultyBrokerCorruption('hard')).toBe(true);
  });
});

// Expected values hand-derived from pirate_loss_pct (server.py lines 144-150) and
// PIRATE_LOSS_TIERS (lines 137-141): medium=0.15, above_medium=0.25, high=0.40.
describe('pirateLossPct', () => {
  it('easy has a single flat tier regardless of round', () => {
    expect(pirateLossPct('easy', 1, 8)).toBeCloseTo(0.15);
    expect(pirateLossPct('easy', 8, 8)).toBeCloseTo(0.15);
  });

  it('standard steps up from medium to above_medium past the midpoint (round 6 of 12)', () => {
    expect(pirateLossPct('standard', 6, 12)).toBeCloseTo(0.15);
    expect(pirateLossPct('standard', 7, 12)).toBeCloseTo(0.25);
  });

  it('hard steps up from above_medium to high past the midpoint (round 8 of 16)', () => {
    expect(pirateLossPct('hard', 1, 16)).toBeCloseTo(0.25);
    expect(pirateLossPct('hard', 9, 16)).toBeCloseTo(0.4);
  });
});

// Expected values hand-derived from EMPEROR_MANDATE_TEMPLATES/DIFFICULTIES.mandates
// (server.py lines 64, 71, 78, 174-183).
describe('emperorMandateSize', () => {
  it('fires the scheduled template index on each difficulty mandate round', () => {
    expect(emperorMandateSize('easy', 3)).toBe(0);
    expect(emperorMandateSize('easy', 6)).toBe(1);
    expect(emperorMandateSize('easy', 8)).toBe(2);
  });

  it('is undefined on non-mandate rounds', () => {
    expect(emperorMandateSize('easy', 1)).toBeUndefined();
  });
});

// Expected values hand-derived from unlocked/unlocked_tier/phase_option_count
// (server.py lines 105-130).
describe('unlocked / unlockedTier / phaseOptionCount', () => {
  const tier0 = ['a'];
  const tier1 = ['b'];
  const tier2 = ['c'];

  it('unlocked stays at tier0 before any unlock round is reached', () => {
    expect(unlocked(tier0, tier1, tier2, 3, { 1: 4, 2: 8 })).toEqual(['a']);
  });

  it('unlocked accumulates tiers as rounds pass their unlock thresholds', () => {
    expect(unlocked(tier0, tier1, tier2, 4, { 1: 4, 2: 8 })).toEqual(['a', 'b']);
    expect(unlocked(tier0, tier1, tier2, 8, { 1: 4, 2: 8 })).toEqual(['a', 'b', 'c']);
  });

  it('unlockedTier reports the highest tier unlocked so far', () => {
    expect(unlockedTier(1, { 1: 4, 2: 8 })).toBe(0);
    expect(unlockedTier(4, { 1: 4, 2: 8 })).toBe(1);
    expect(unlockedTier(8, { 1: 4, 2: 8 })).toBe(2);
  });

  it('phaseOptionCount is 5 + 3 per unlocked tier', () => {
    expect(phaseOptionCount(1, { 1: 4, 2: 8 })).toBe(5);
    expect(phaseOptionCount(4, { 1: 4, 2: 8 })).toBe(8);
    expect(phaseOptionCount(8, { 1: 4, 2: 8 })).toBe(11);
  });
});
