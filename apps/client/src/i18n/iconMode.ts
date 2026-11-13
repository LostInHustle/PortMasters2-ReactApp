// Icon style: players can show goods, artisans and captain avatars as emojis (the default) or as
// Chinese characters. Like the language, this is a presentation preference only. It never
// reaches the server, and each captain in a room can choose differently.
//
// The mode lives in React state (LangContext owns it, so every component that already
// renders on a language change also renders on an icon change). This module keeps a
// mirror of that state for the icon tables, which are plain objects read during render: a
// table built with modeAware() answers each lookup from the emoji set or the character set
// according to the mirror, so the many existing `ITEM_ICONS[item]` call sites need no change.

export type IconMode = 'emoji' | 'han';

const STORAGE_KEY = 'pm2_icon_mode';

let currentMode: IconMode = 'emoji';

export function getIconMode(): IconMode {
  return currentMode;
}

export function setIconMode(mode: IconMode): void {
  currentMode = mode;
}

// Guarded for the same reason LangContext guards its own storage access: browsers that block
// site data throw on the property access itself, and this runs during the first render.
export function loadIconMode(): IconMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'han' ? 'han' : 'emoji';
  } catch {
    return 'emoji';
  }
}

export function storeIconMode(mode: IconMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // storage unavailable: the choice simply will not survive a reload, which is not fatal
  }
}

/**
 * Wraps an emoji table so that lookups return the Chinese character for the same key while the
 * character mode is on, and fall back to the emoji for any key without a character.
 */
export function modeAware<T extends Record<string, string>>(
  emoji: T,
  han: Partial<Record<keyof T, string>>,
): T {
  return new Proxy(emoji, {
    get(target, key, receiver) {
      if (currentMode === 'han' && typeof key === 'string') {
        const ch = (han as Record<string, string | undefined>)[key];
        if (ch) return ch;
      }
      return Reflect.get(target, key, receiver) as unknown;
    },
  });
}

// Every captain gets a medal in a color of their own, picked from their name so it is the same
// on every screen and for every player. In character mode the medal carries a seafaring
// character chosen the same way. Kept identical to the single file build so a captain looks
// the same in both.
export const CAPTAIN_HUES = [30, 60, 130, 195, 230, 265, 300, 340] as const;
export const CAPTAIN_HAN = [
  '帆',
  '舟',
  '航',
  '潮',
  '浪',
  '港',
  '锚',
  '舵',
  '鲸',
  '鹏',
  '龙',
  '鹤',
] as const;

export function nameHash(name: string | null | undefined): number {
  let h = 0;
  for (const ch of String(name ?? '')) h = (Math.imul(h, 31) + (ch.codePointAt(0) ?? 0)) >>> 0;
  return h;
}

export function captainHue(name: string | null | undefined): number {
  return CAPTAIN_HUES[nameHash(name) % CAPTAIN_HUES.length]!;
}

export function captainGlyph(name: string | null | undefined, mode: IconMode): string {
  return mode === 'han' ? CAPTAIN_HAN[nameHash(name) % CAPTAIN_HAN.length]! : '🧑‍✈️';
}

export function fleetGlyph(mode: IconMode): string {
  return mode === 'han' ? '队' : '🧑‍✈️';
}
