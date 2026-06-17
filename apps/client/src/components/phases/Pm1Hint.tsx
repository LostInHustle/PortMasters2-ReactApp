import type { ReactNode } from 'react';
import { pm1Label, pm1Url } from '../../i18n/pm1Links.js';
import { useTranslate } from '../../i18n/useTranslate.js';

// Ported verbatim from PortMasters2/PortMasters_online.html pm1HintHTML (lines 2544-2558).
export function Pm1Hint({ context }: { context: ReactNode }) {
  const { tr, lang } = useTranslate();
  return (
    <div className="pm-banner">
      <span className="pm-icon">🧭</span>
      <span>
        {context}{' '}
        {tr(
          '本作 PortMasters 2 上手门槛较高；可以先游玩上一代 ',
          'PortMasters 2 has a steep learning curve — consider warming up with ',
        )}
        <a href={pm1Url(lang)} target="_blank" rel="noopener noreferrer">
          {pm1Label(lang)}
        </a>
        {tr(
          ' 熟悉采购、生产与贸易的基本节奏，再回来挑战。',
          ' to learn the buy → produce → trade loop, then come back for the challenge.',
        )}
      </span>
    </div>
  );
}
