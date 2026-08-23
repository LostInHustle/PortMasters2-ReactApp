import { useMemo } from 'react';
import { pf, tr, useLang, type Bilingual, type Lang } from './LangContext.js';

export interface Translate {
  lang: Lang;
  tr: <T>(zh: T, en: T) => T;
  pf: <T>(o: Bilingual<T> | undefined) => T | '';
}

// Binds tr()/pf() to the current language, so call sites read the same as the original's
// `tr('中文', 'English')` / `pf(obj)` without re-passing lang everywhere.
//
// Memoized on the language, which is the only thing these close over. Almost every component
// in the app calls this hook, so handing back a fresh object with fresh closures on every
// render quietly made `tr` unusable as a dependency: anything built on top of it churned too,
// and useKeyboardShortcuts ended up tearing down and rebuilding its document keydown listener
// on every state broadcast in a live session. The language changes when a player toggles it,
// and these identities should change exactly then.
export function useTranslate(): Translate {
  const { lang } = useLang();
  return useMemo(
    () => ({
      lang,
      tr: (zh, en) => tr(lang, zh, en),
      pf: (o) => pf(o, lang),
    }),
    [lang],
  );
}
