export type Difficulty = 'easy' | 'standard' | 'hard';
export type PirateLossTier = 'medium' | 'above_medium' | 'high';

export interface DifficultyConfig {
  rounds: number;
  /** tier -> round it joins the content pools. Empty means the difficulty never leaves Tier 0. */
  tierUnlock: Record<number, number>;
  brokerCorruption: boolean;
  /** One tier for a flat toll all voyage, or [firstHalf, secondHalf] stepping up at the midpoint. */
  pirateLoss: readonly [PirateLossTier] | readonly [PirateLossTier, PirateLossTier];
  /** round -> index into EMPEROR_MANDATE_TEMPLATES. */
  mandates: Record<number, number>;
}

// Ported verbatim from PortMasters2/server.py DIFFICULTIES (lines 58-81).
export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    rounds: 8,
    tierUnlock: {},
    brokerCorruption: false,
    pirateLoss: ['medium'],
    mandates: { 3: 0, 6: 1, 8: 2 },
  },
  standard: {
    rounds: 12,
    tierUnlock: { 1: 4, 2: 8 },
    brokerCorruption: false,
    pirateLoss: ['medium', 'above_medium'],
    mandates: { 3: 0, 7: 1, 12: 2 },
  },
  hard: {
    rounds: 16,
    tierUnlock: { 1: 6, 2: 10 },
    brokerCorruption: true,
    pirateLoss: ['above_medium', 'high'],
    mandates: { 6: 0, 12: 1, 16: 2 },
  },
};

export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

// Raid severity as a fraction of current gold (server.py lines 137-141).
export const PIRATE_LOSS_TIERS: Record<PirateLossTier, number> = {
  medium: 0.15,
  above_medium: 0.25,
  high: 0.4,
};

// Escort fee = max(ESCORT_COST_MIN, current gold * ESCORT_COST_PCT) (server.py lines 158-159).
export const ESCORT_COST_MIN = 10;
export const ESCORT_COST_PCT = 0.1;

// Corrupt-broker hazard, hard mode only (server.py lines 165-166).
export const BROKER_CORRUPTION_CHANCE = 0.3;
export const BROKER_CORRUPTION_RISK = 0.2;

// Market-card hand size = BASE + PER_TIER * unlocked tier count (server.py lines 125-126).
export const PHASE_OPTIONS_BASE = 5;
export const PHASE_OPTIONS_PER_TIER = 3;
