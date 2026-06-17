// Mirrors Python 3's round() (banker's rounding / round-half-to-even, no ndigits) since
// JS's Math.round() always rounds halves away from zero — the two diverge on exact .5 values,
// which the monsoon price/reward multipliers (0.85/0.88/0.9/1.15/...) can actually land on.
export function pythonRound(x: number): number {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}
