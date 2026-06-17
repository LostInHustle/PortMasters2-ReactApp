import { pf, tr, useLang, type Bilingual, type Lang } from './LangContext.js';

export interface Translate {
  lang: Lang;
  tr: <T>(zh: T, en: T) => T;
  pf: <T>(o: Bilingual<T> | undefined) => T | '';
}

// Binds tr()/pf() to the current language, so call sites read the same as the original's
// `tr('中文', 'English')` / `pf(obj)` without re-passing lang everywhere.
export function useTranslate(): Translate {
  const { lang } = useLang();
  return {
    lang,
    tr: (zh, en) => tr(lang, zh, en),
    pf: (o) => pf(o, lang),
  };
}
