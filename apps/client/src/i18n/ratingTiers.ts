import type { Difficulty } from '@pm2/shared';
import type { Bilingual, Lang } from './LangContext.js';
import { pf } from './LangContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html RATING_TIERS (lines 1331-1353):
// endgame rating thresholds per difficulty, lowest to highest. Renown (cumulative net profit of
// delivered orders) scales with voyage length and goods value, so each difficulty needs its own
// thresholds -- a 16-round hard voyage earns far more than an 8-round easy one.
export interface RatingTier {
  min: number;
  full: Bilingual;
  short: Bilingual;
}

export const RATING_TIERS: Record<Difficulty, RatingTier[]> = {
  easy: [
    {
      min: 0,
      full: { zh: '🌊 新手商人', en: '🌊 Novice Merchant' },
      short: { zh: '新手', en: 'Novice' },
    },
    {
      min: 400,
      full: { zh: '👍 合格商人', en: '👍 Competent Merchant' },
      short: { zh: '合格', en: 'Competent' },
    },
    {
      min: 600,
      full: { zh: '⭐ 成功商人', en: '⭐ Accomplished Merchant' },
      short: { zh: '成功', en: 'Accomplished' },
    },
    {
      min: 800,
      full: { zh: '🏆 海上贸易大亨', en: '🏆 Maritime Trade Tycoon' },
      short: { zh: '大亨', en: 'Tycoon' },
    },
    {
      min: 1200,
      full: { zh: '👑 丝绸之路霸主', en: '👑 Sovereign of the Silk Road' },
      short: { zh: '霸主', en: 'Sovereign' },
    },
  ],
  standard: [
    {
      min: 0,
      full: { zh: '🌊 新手商人', en: '🌊 Novice Merchant' },
      short: { zh: '新手', en: 'Novice' },
    },
    {
      min: 1000,
      full: { zh: '👍 合格商人', en: '👍 Competent Merchant' },
      short: { zh: '合格', en: 'Competent' },
    },
    {
      min: 1500,
      full: { zh: '⭐ 成功商人', en: '⭐ Accomplished Merchant' },
      short: { zh: '成功', en: 'Accomplished' },
    },
    {
      min: 2000,
      full: { zh: '🏆 海上贸易大亨', en: '🏆 Maritime Trade Tycoon' },
      short: { zh: '大亨', en: 'Tycoon' },
    },
    {
      min: 3000,
      full: { zh: '👑 丝绸之路霸主', en: '👑 Sovereign of the Silk Road' },
      short: { zh: '霸主', en: 'Sovereign' },
    },
  ],
  hard: [
    {
      min: 0,
      full: { zh: '🌊 新手商人', en: '🌊 Novice Merchant' },
      short: { zh: '新手', en: 'Novice' },
    },
    {
      min: 2000,
      full: { zh: '👍 合格商人', en: '👍 Competent Merchant' },
      short: { zh: '合格', en: 'Competent' },
    },
    {
      min: 3000,
      full: { zh: '⭐ 成功商人', en: '⭐ Accomplished Merchant' },
      short: { zh: '成功', en: 'Accomplished' },
    },
    {
      min: 4000,
      full: { zh: '🏆 海上贸易大亨', en: '🏆 Maritime Trade Tycoon' },
      short: { zh: '大亨', en: 'Tycoon' },
    },
    {
      min: 6000,
      full: { zh: '👑 丝绸之路霸主', en: '👑 Sovereign of the Silk Road' },
      short: { zh: '霸主', en: 'Sovereign' },
    },
  ],
};

export function ratingTiers(difficulty: Difficulty): RatingTier[] {
  return RATING_TIERS[difficulty] ?? RATING_TIERS.easy;
}

// The highest tier whose threshold the score has reached.
export function ratingTierFor(score: number, difficulty: Difficulty): RatingTier {
  let chosen = ratingTiers(difficulty)[0]!;
  for (const t of ratingTiers(difficulty)) {
    if (score >= t.min) chosen = t;
  }
  return chosen;
}

export function ratingFor(score: number, difficulty: Difficulty, lang: Lang): string {
  return pf(ratingTierFor(score, difficulty).full, lang);
}

// "400 Competent / 600 Accomplished / ..." built from the same table.
export function ratingThresholdHint(difficulty: Difficulty, lang: Lang): string {
  return ratingTiers(difficulty)
    .filter((t) => t.min > 0)
    .map((t) => `${t.min} ${pf(t.short, lang)}`)
    .join(' \u00b7 ');
}
