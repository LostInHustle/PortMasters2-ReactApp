import { afterEach, describe, expect, it } from 'vitest';
import {
  CAPTAIN_HAN,
  CAPTAIN_HUES,
  captainGlyph,
  captainHue,
  fleetGlyph,
  modeAware,
  nameHash,
  setIconMode,
} from '../../src/i18n/iconMode.js';
import { ITEM_ICONS } from '../../src/i18n/itemIcons.js';
import { WORKER_TYPES } from '../../src/i18n/workerTypesText.js';

afterEach(() => setIconMode('emoji'));

describe('icon style', () => {
  it('shows emojis by default and Chinese characters once switched', () => {
    expect(ITEM_ICONS['丝绸']).toBe('👘');
    expect(WORKER_TYPES[0]!.icon).toBe('👩‍🔧');
    setIconMode('han');
    expect(ITEM_ICONS['丝绸']).toBe('丝');
    expect(ITEM_ICONS['金币']).toBe('金');
    expect(WORKER_TYPES[0]!.icon).toBe('织');
    setIconMode('emoji');
    expect(ITEM_ICONS['丝绸']).toBe('👘');
  });

  it('gives every item and every artisan a single character', () => {
    setIconMode('han');
    for (const key of Object.keys(ITEM_ICONS) as (keyof typeof ITEM_ICONS)[]) {
      expect(Array.from(ITEM_ICONS[key])).toHaveLength(1);
    }
    for (const wt of WORKER_TYPES) expect(Array.from(wt.icon)).toHaveLength(1);
  });

  it('falls back to the emoji for a key without a character', () => {
    const table = modeAware({ a: '🅰️', b: '🅱️' }, { a: '甲' });
    setIconMode('han');
    expect(table.a).toBe('甲');
    expect(table.b).toBe('🅱️');
  });
});

describe('captain medals', () => {
  it('always gives the same captain the same color and character', () => {
    expect(captainHue('Lin Yue')).toBe(captainHue('Lin Yue'));
    expect(CAPTAIN_HUES).toContain(captainHue('Lin Yue'));
    expect(CAPTAIN_HAN).toContain(captainGlyph('Lin Yue', 'han'));
    expect(captainGlyph('Lin Yue', 'emoji')).toBe('🧑‍✈️');
  });

  it('matches the hash the single file build computes', () => {
    // (h * 31 + code point) kept to 32 bits, the same arithmetic as the single file build
    let h = 0;
    for (const ch of '郑宝Zheng') h = (h * 31 + ch.codePointAt(0)!) % 2 ** 32;
    expect(nameHash('郑宝Zheng')).toBe(h);
    expect(nameHash(null)).toBe(0);
  });

  it('uses a group mark for the fleet header', () => {
    expect(fleetGlyph('emoji')).toBe('🧑‍✈️');
    expect(fleetGlyph('han')).toBe('队');
  });
});
