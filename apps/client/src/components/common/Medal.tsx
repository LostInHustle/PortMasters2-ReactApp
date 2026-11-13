import type { CSSProperties } from 'react';
import { captainGlyph, captainHue } from '../../i18n/iconMode.js';
import { useLang } from '../../i18n/LangContext.js';

// A captain's round medal: their own color, with the captain emoji or, in character mode, a
// seafaring Chinese character. Both come from the captain's name, so the same captain looks
// the same on every screen.
export function Medal({ name, small }: { name: string | null | undefined; small?: boolean }) {
  const { iconMode } = useLang();
  return (
    <span
      className={small ? 'medal sm' : 'medal'}
      style={{ '--hue': captainHue(name) } as CSSProperties}
    >
      {captainGlyph(name, iconMode)}
    </span>
  );
}

/** Inline style that gives any element a captain's own hue (used by the crew head avatar). */
export function captainHueStyle(name: string | null | undefined): CSSProperties {
  return { '--hue': captainHue(name) } as CSSProperties;
}
