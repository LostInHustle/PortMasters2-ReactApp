import type { CSSProperties } from 'react';
import { useLang } from '../../i18n/LangContext.js';

// Ported from PortMasters2/PortMasters_online.html's three identical language buttons
// (btn-lang / btn-lang-login / btn-lang-lobby, lines 1201/1236/1246) and applyLanguage's
// langLabel/langTitle (lines 1748-1749). Factored into one component so every page (header,
// login, lobby) shows the same toggle -- the original duplicated the same button three times and
// kept them in sync via applyLanguage; here a single component is the single source of truth.
export function LangToggle({ className, style }: { className?: string; style?: CSSProperties }) {
  const { lang, toggleLang } = useLang();
  return (
    <button
      className={className ?? 'btn btn-ghost'}
      style={style}
      onClick={toggleLang}
      title={
        lang === 'en' ? '切换为中文界面 / Switch to Chinese' : 'Switch to English / 切换为英文界面'
      }
    >
      {lang === 'en' ? '🌐 中文' : '🌐 English'}
    </button>
  );
}
