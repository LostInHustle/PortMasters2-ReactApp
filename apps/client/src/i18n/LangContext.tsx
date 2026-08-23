import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'zh' | 'en';

export interface Bilingual<T = string> {
  zh: T;
  en: T;
}

const STORAGE_KEY = 'pm2_lang';

// Ported from PortMasters2/PortMasters_online.html (line 1284): default language is English,
// persisted to localStorage, matching the original's `localStorage.getItem('pm2_lang') || 'en'`.
//
// Both accessors are guarded the same way sessionToken.ts guards its own, and for a sharper
// reason: this one runs during the very first render. Browsers that block site data do not
// return null from localStorage, they throw on the property access itself, so an unguarded read
// here took down the entire app before it painted anything. A player who cannot store a
// language preference should still get to play in English.
function loadInitialLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'zh' ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

function storeLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // storage unavailable: the choice simply will not survive a reload, which is not fatal
  }
}

// Ported from PortMasters2/PortMasters_online.html `tr`/`pf` (lines 1287-1289). The original
// reads a module-global `LANG`; here `lang` is an explicit parameter since it now lives in React
// state instead of a mutable global. Callers get it from useLang()/useTranslate().
export function tr<T>(lang: Lang, zh: T, en: T): T {
  return lang === 'en' ? en : zh;
}

export function pf<T>(o: Bilingual<T> | undefined, lang: Lang): T | '' {
  if (!o) return '';
  return o[lang] !== undefined ? o[lang] : o.zh;
}

interface LangContextValue {
  lang: Lang;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(loadInitialLang);

  // Ported from PortMasters2/PortMasters_online.html toggleLang (lines 1793-1802): flips the
  // language and persists it. The original then manually redraws every view
  // (applyLanguage/renderOnlineUsers/renderAll/...); React's reconciliation does that
  // automatically once `lang` changes, so none of those calls are needed here.
  //
  // The write to storage is a side effect and stays out of the state updater, which React is
  // free to call more than once. Same reasoning as SessionContext's sendChat.
  const toggleLang = useCallback(() => {
    const next: Lang = lang === 'en' ? 'zh' : 'en';
    storeLang(next);
    setLang(next);
  }, [lang]);

  const value = useMemo(() => ({ lang, toggleLang }), [lang, toggleLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a LangProvider');
  return ctx;
}
