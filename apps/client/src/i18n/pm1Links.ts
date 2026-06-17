import type { Lang } from './LangContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html PM1_URLS (lines 1367-1372): a link
// to the original PortMasters 1 for new captains, varying by language.
export const PM1_URLS: Record<Lang, string> = {
  zh: 'https://lostinhustle.github.io/PortMasters/PortMasters_Web_Edition/PortMasters_MandarinEdition_v1.4.0',
  en: 'https://lostinhustle.github.io/PortMasters/PortMasters_Web_Edition/PortMasters_v1.4.0',
};

export function pm1Url(lang: Lang): string {
  return PM1_URLS[lang];
}

export function pm1Label(lang: Lang): string {
  return lang === 'en' ? 'PortMasters 1 →' : 'PortMasters 1（中文版）→';
}
