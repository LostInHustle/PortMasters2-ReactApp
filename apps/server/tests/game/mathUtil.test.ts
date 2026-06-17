import { describe, expect, it } from 'vitest';
import { pythonRound } from '../../src/game/mathUtil.js';

// Expected values hand-derived from Python 3's round() (banker's rounding): halves round to
// the nearest even integer, everything else rounds to the nearest integer as usual.
describe('pythonRound', () => {
  it('rounds non-halves to the nearest integer', () => {
    expect(pythonRound(2.4)).toBe(2);
    expect(pythonRound(2.6)).toBe(3);
  });

  it('rounds exact halves to the nearest even integer', () => {
    expect(pythonRound(0.5)).toBe(0);
    expect(pythonRound(1.5)).toBe(2);
    expect(pythonRound(2.5)).toBe(2);
    expect(pythonRound(3.5)).toBe(4);
  });

  it('matches Python for negative halves (round(-0.5) == 0, round(-1.5) == -2)', () => {
    expect(pythonRound(-0.5)).toBe(0);
    expect(pythonRound(-1.5)).toBe(-2);
  });
});
