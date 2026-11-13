import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { captainGlyph } from '../../i18n/iconMode.js';
import { useLang } from '../../i18n/LangContext.js';
import { useSpectate } from '../../state/SpectateContext.js';
import { MateNote } from '../common/MateNote.js';
import { captainHueStyle } from '../common/Medal.js';
import { CrewSections } from './FleetCard.js';

const NO_DUE_PHASES = new Set<unknown>([0, 5, 'endgame', 'bankruptcy']);

// Mirrors PortMasters2/PortMasters_online.html renderStatus:
// your own fleet card, plus a "due this round" breakdown once wages/upkeep are pending. Wages
// and upkeep are both read straight off the server computed estimatedWages/fixedCost/
// maintenancePenalty fields rather than derived again here, so this can never drift from what
// payWages/payMaintenance actually charge at settlement (see costCalculations.ts/production.ts).
export function StatusPanel() {
  const { tr } = useTranslate();
  const { iconMode } = useLang();
  const { currentUser, serverState } = useSession();
  const { openSpectate } = useSpectate();
  const g = serverState?.yourGame;
  if (!g) return null;

  const openOwnView = () => openSpectate(currentUser ?? undefined);

  const showDue = !NO_DUE_PHASES.has(g.phase) && !g.gameOver;
  const pendWages = g.estimatedWages;
  const pendMaint = g.fixedCost + g.maintenancePenalty;
  const pendTotal = pendWages + pendMaint;
  const safe = g.money >= pendTotal;

  return (
    <div className="panel side-panel" id="status-panel">
      <div
        className="crew-head crew-head-self"
        title={tr(
          '在观战窗口中查看我的船队，就像其他船长看到的那样',
          'See your own fleet in the spectator window, just as the other captains see it',
        )}
        onClick={openOwnView}
      >
        <div className="avatar" style={captainHueStyle(currentUser)}>
          {captainGlyph(currentUser, iconMode)}
        </div>
        <div className="who">
          <div className="nm">{currentUser || tr('我', 'Me')}</div>
          <div className="role">
            {tr('我的船队', 'My fleet')}
            {tr(' · ', ', ')}
            {g.slot ? tr('玩家', 'Player ') + g.slot : ''}
          </div>
        </div>
        <span className="dot on" title={tr('在线', 'Online')} />
      </div>
      <button type="button" className="btn btn-ghost self-view-btn" onClick={openOwnView}>
        {tr('👀 观战视图', '👀 Spectator View')}
      </button>
      {showDue && pendTotal > 0 && (
        <MateNote>
          {!safe
            ? tr(
                `船长，本回合结算要付 ${pendTotal} 金币，我们还差 ${pendTotal - g.money} 金币，得尽快回笼资金。`,
                `We owe ${pendTotal} gold at Upkeep this round, Captain, and we are ${pendTotal - g.money} gold short. We need to raise cash.`,
              )
            : Math.floor(g.money / pendTotal) >= 2
              ? tr(
                  `船长，本回合结算要付 ${pendTotal} 金币，存款绰绰有余。`,
                  `We owe ${pendTotal} gold at Upkeep this round, Captain. Your gold covers it ${Math.floor(g.money / pendTotal)} times over.`,
                )
              : tr(
                  `船长，本回合结算要付 ${pendTotal} 金币，存款刚好够付，花钱要留神。`,
                  `We owe ${pendTotal} gold at Upkeep this round, Captain. Your gold just covers it, so spend with care.`,
                )}
        </MateNote>
      )}
      <CrewSections g={g} />
      {showDue && (
        <div
          className="status-section ss-due"
          style={{ borderColor: safe ? 'rgba(14,165,233,.14)' : 'rgba(225,29,72,.5)' }}
        >
          <h3>{tr('⚠️ 本回合应付款项', '⚠️ Due This Round')}</h3>
          <div className="stat-row">
            <span
              className="tip"
              data-tip={tr(
                '每回合结算阶段必须支付的固定运营成本，付不起即破产',
                'Fixed operating cost paid every Upkeep phase. Fail to pay and you go bankrupt',
              )}
            >
              {tr('🔧 维护费', '🔧 Upkeep')}
            </span>
            <span className="stat-value">
              {pendMaint} {tr('金币', 'gold')}
            </span>
          </div>
          <div className="stat-row">
            <span
              className="tip"
              data-tip={tr(
                '结算阶段自动支付的全部工匠工资，付不起即破产',
                'All artisan wages, paid automatically at Upkeep. Fail to pay and you go bankrupt',
              )}
            >
              {tr('👥 工资合计', '👥 Total wages')}
            </span>
            <span className="stat-value">
              {pendWages} {tr('金币', 'gold')}
            </span>
          </div>
          <div
            className="stat-row"
            style={{ borderTop: '1px solid rgba(148,163,184,.3)', marginTop: 4, paddingTop: 5 }}
          >
            <span>
              <strong>{tr('💸 合计应付', '💸 Total due')}</strong>
            </span>
            <span style={{ fontWeight: 800, color: safe ? '#059669' : '#e11d48' }}>
              {pendTotal} {tr('金币', 'gold')}
            </span>
          </div>
          {!safe && (
            <div
              style={{
                background: 'var(--grad-danger)',
                color: 'white',
                borderRadius: 9,
                padding: '5px 9px',
                fontSize: '10.5px',
                marginTop: 6,
                textAlign: 'center',
                fontWeight: 700,
              }}
            >
              {tr(
                '🚨 现金不足以支付本回合结算费用，请尽快回笼资金！',
                "🚨 You can't cover this round's settlement. Raise cash fast!",
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
