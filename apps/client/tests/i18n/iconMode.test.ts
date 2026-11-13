import { afterEach, describe, expect, it } from 'vitest';
import {
  CAPTAIN_HAN,
  CAPTAIN_HUES,
  captainGlyph,
  captainHue,
  modeAware,
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
});
