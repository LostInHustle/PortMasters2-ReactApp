import { describe, expect, it } from 'vitest';
import {
  normalizeDifficulty,
  phaseOptionCount,
  pirateLossPct,
  unlocked,
  unlockedTier,
} from '../../src/game/difficultyRules.js';

// Expected values derived manually from PortMasters2/server.py DIFFICULTIES and
// normalize_difficulty
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

// Expected values derived manually from pirate_loss_pct and
// PIRATE_LOSS_TIERS: medium=0.15, above_medium=0.25, high=0.40.
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

// Expected values derived manually from unlocked/unlocked_tier/phase_option_count
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
