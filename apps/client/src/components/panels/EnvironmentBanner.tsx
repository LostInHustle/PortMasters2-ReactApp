import type { PlayerGameState } from '@pm2/shared';
import { monsoonDesc, monsoonName } from '../../i18n/boonModuleMonsoonText.js';
import { tn } from '../../i18n/enNames.js';
import { useTranslate } from '../../i18n/useTranslate.js';

// Ported verbatim from PortMasters2/PortMasters_online.html environmentBannerHTML
// (lines 2295-2317): the monsoon-state banner shown at the top of several phase screens.
export function EnvironmentBanner({ g }: { g: PlayerGameState }) {
  const { tr, lang } = useTranslate();
  const m = g.monsoon_state;
  if (!m) return null;
  const ports = m.rewardPorts.map((p) => tn(p, lang)).join(tr('、', ', '));
  const resource = tn(m.resource, lang);
  const rewardPct = Math.round((m.rewardMultiplier - 1) * 100);
  const pricePct = Math.round(Math.abs((m.purchaseMultiplier - 1) * 100));
  const riskPct = Math.round((g.pirateRiskEffective ?? m.pirateRisk) * 100);
  const priceWord = m.purchaseMultiplier < 1 ? tr('降价', 'cheaper') : tr('涨价', 'pricier');

  return (
    <div className="environment-banner">
      <div className="env-icon">{m.icon}</div>
      <div className="env-copy">
        <div className="env-title">
          {tr('全球环境：', 'Global Environment: ')}
          {monsoonName(m, lang)}
        </div>
        <div className="env-desc">{monsoonDesc(m, lang)}</div>
      </div>
      <div className="env-tags">
        <span className="chip green">
          {tr(`${ports} 订单 +${rewardPct}%`, `${ports} orders +${rewardPct}%`)}
        </span>
        <span className="chip amber">
          {tr(`${resource} ${priceWord} ${pricePct}%`, `${resource} ${priceWord} ${pricePct}%`)}
        </span>
        <span className={`chip ${g.pirate_immunity ? 'green' : 'amber'}`}>
          {g.pirate_immunity
            ? tr('🛡️ 已护航', '🛡️ Escorted')
            : tr(`🏴‍☠️ 海盗 ${riskPct}%`, `🏴‍☠️ Pirates ${riskPct}%`)}
        </span>
      </div>
    </div>
  );
}
