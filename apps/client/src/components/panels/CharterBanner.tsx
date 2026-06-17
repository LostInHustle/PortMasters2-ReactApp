import type { CharterEvent } from '@pm2/shared';
import { charterDesc, charterName } from '../../i18n/boonModuleMonsoonText.js';
import { useTranslate } from '../../i18n/useTranslate.js';

// Ported verbatim from PortMasters2/PortMasters_online.html charterBannerHTML
// (lines 2320-2330): the Silk Road Charter unlock announcement shown on Set Sail for the rounds
// that introduce a new tier of content.
export function CharterBanner({ charterEvent }: { charterEvent: CharterEvent | null }) {
  const { tr, lang } = useTranslate();
  if (!charterEvent) return null;
  return (
    <div className="pm-banner" style={{ margin: '14px auto', maxWidth: 640, textAlign: 'left' }}>
      <span className="pm-icon">{charterEvent.icon}</span>
      <span>
        <strong>
          {tr('丝路特许：', 'Silk Road Charter: ')}
          {charterName(charterEvent, lang)}
        </strong>
        <br />
        {charterDesc(charterEvent, lang)}
      </span>
    </div>
  );
}
