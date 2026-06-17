import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  PHASE_OPTIONS_BASE,
  PHASE_OPTIONS_PER_TIER,
  PIRATE_LOSS_TIERS,
  type Difficulty,
  type DifficultyConfig,
} from '@pm2/shared';

// Ported verbatim from PortMasters2/server.py normalize_difficulty/difficulty_cfg/
// difficulty_rounds/difficulty_tier_unlock/difficulty_broker_corruption (lines 84-102).
export function normalizeDifficulty(value: unknown): Difficulty {
  return value === 'easy' || value === 'standard' || value === 'hard' ? value : DEFAULT_DIFFICULTY;
}

export function difficultyCfg(difficulty: unknown): DifficultyConfig {
  return DIFFICULTIES[normalizeDifficulty(difficulty)];
}

export function difficultyRounds(difficulty: unknown): number {
  return difficultyCfg(difficulty).rounds;
}

export function difficultyTierUnlock(difficulty: unknown): Record<number, number> {
  return difficultyCfg(difficulty).tierUnlock;
}

export function difficultyBrokerCorruption(difficulty: unknown): boolean {
  return difficultyCfg(difficulty).brokerCorruption;
}

// Ported verbatim from PortMasters2/server.py unlocked()/unlocked_tier() (lines 105-118).
export function unlocked<T>(
  tier0: readonly T[],
  tier1: readonly T[],
  tier2: readonly T[],
  roundNo: number,
  tierUnlock: Record<number, number>,
): T[] {
  const pools: Record<number, readonly T[]> = { 0: tier0, 1: tier1, 2: tier2 };
  const items = [...tier0];
  for (const [tierStr, unlockRound] of Object.entries(tierUnlock)) {
    if (roundNo >= unlockRound) {
      items.push(...pools[Number(tierStr)]!);
    }
  }
  return items;
}

export function unlockedTier(roundNo: number, tierUnlock: Record<number, number>): number {
  let highest = 0;
  for (const [tierStr, unlockRound] of Object.entries(tierUnlock)) {
    if (roundNo >= unlockRound) {
      highest = Math.max(highest, Number(tierStr));
    }
  }
  return highest;
}

// Ported verbatim from PortMasters2/server.py phase_option_count (lines 129-130).
export function phaseOptionCount(roundNo: number, tierUnlock: Record<number, number>): number {
  return PHASE_OPTIONS_BASE + PHASE_OPTIONS_PER_TIER * unlockedTier(roundNo, tierUnlock);
}

// Ported verbatim from PortMasters2/server.py pirate_loss_pct (lines 144-150).
export function pirateLossPct(difficulty: unknown, roundNo: number, maxRounds: number): number {
  const curve = difficultyCfg(difficulty).pirateLoss;
  const secondHalfTier = curve.length === 2 ? curve[1] : curve[0];
  const tier = roundNo <= Math.floor(maxRounds / 2) ? curve[0] : secondHalfTier;
  return PIRATE_LOSS_TIERS[tier];
}

// Ported verbatim from PortMasters2/server.py emperor_mandate_size (lines 181-183).
export function emperorMandateSize(difficulty: unknown, roundNo: number): number | undefined {
  return difficultyCfg(difficulty).mandates[roundNo];
}
