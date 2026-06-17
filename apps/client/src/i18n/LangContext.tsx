import { createContext, useContext, useState, type ReactNode } from 'react';

export type Lang = 'zh' | 'en';

export interface Bilingual<T = string> {
  zh: T;
  en: T;
}

const STORAGE_KEY = 'pm2_lang';

// Ported from PortMasters2/PortMasters_online.html (line 1284): default language is English,
// persisted to localStorage, matching the original's `localStorage.getItem('pm2_lang') || 'en'`.
function loadInitialLang(): Lang {
  return localStorage.getItem(STORAGE_KEY) === 'zh' ? 'zh' : 'en';
}

// Ported from PortMasters2/PortMasters_online.html `tr`/`pf` (lines 1287-1289). The original
// reads a module-global `LANG`; here `lang` is an explicit parameter since it now lives in React
// state instead of a mutable global -- callers get it from useLang()/useTranslate().
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
  // language and persists it. The original then manually re-renders every view
  // (applyLanguage/renderOnlineUsers/renderAll/...); React's reconciliation does that
  // automatically once `lang` changes, so none of those calls are needed here.
  const toggleLang = () => {
    setLang((prev) => {
      const next: Lang = prev === 'en' ? 'zh' : 'en';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return <LangContext.Provider value={{ lang, toggleLang }}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a LangProvider');
  return ctx;
}
