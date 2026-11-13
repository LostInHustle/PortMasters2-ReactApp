import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadIconMode, setIconMode, storeIconMode, type IconMode } from './iconMode.js';

export type Lang = 'zh' | 'en';

export interface Bilingual<T = string> {
  zh: T;
  en: T;
}

const STORAGE_KEY = 'pm2_lang';

// Mirrors PortMasters2/PortMasters_online.html: default language is English,
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

// Mirrors PortMasters2/PortMasters_online.html `tr`/`pf`. The original
// reads a module global `LANG`; here `lang` is an explicit parameter since it now lives in React
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
  iconMode: IconMode;
  toggleIconMode: () => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(loadInitialLang);

  // Mirrors PortMasters2/PortMasters_online.html toggleLang: flips the
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

  // Icon style (emojis or Chinese characters) lives beside the language on purpose: both change
  // what nearly every component prints, and every component that prints text already listens
  // to this context, so one provider redraws the whole app for either switch.
  const [iconMode, setIconModeState] = useState<IconMode>(loadIconMode);
  // The icon tables are read during render, so their mirror must be current before any child
  // renders. Assigning it here is idempotent, which keeps it safe under repeated renders.
  setIconMode(iconMode);

  const toggleIconMode = useCallback(() => {
    const next: IconMode = iconMode === 'han' ? 'emoji' : 'han';
    storeIconMode(next);
    setIconModeState(next);
  }, [iconMode]);

  // The stylesheet keys a few rules off these two attributes: character seals for goods, and
  // the type size of the first mate's notes in Chinese.
  useEffect(() => {
    document.body.dataset.icons = iconMode;
  }, [iconMode]);
  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = tr(
      lang,
      'PortMasters 2 · 海上丝绸之路（联机版）',
      'PortMasters 2, Maritime Silk Road (Online)',
    );
  }, [lang]);

  const value = useMemo(
    () => ({ lang, toggleLang, iconMode, toggleIconMode }),
    [lang, toggleLang, iconMode, toggleIconMode],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a LangProvider');
  return ctx;
}
