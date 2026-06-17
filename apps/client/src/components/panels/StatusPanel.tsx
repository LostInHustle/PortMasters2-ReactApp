import { WAGES } from '@pm2/shared';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { CrewSections } from './FleetCard.js';

const NO_DUE_PHASES = new Set<unknown>([0, 5, 'endgame', 'bankruptcy']);

// Ported verbatim from PortMasters2/PortMasters_online.html renderStatus (lines 2410-2448):
// your own fleet card, plus a "due this round" breakdown once wages/upkeep are pending.
export function StatusPanel() {
  const { tr } = useTranslate();
  const { currentUser, serverState } = useSession();
  const g = serverState?.yourGame;
  if (!g) return null;

  const showDue = !NO_DUE_PHASES.has(g.phase) && !g.gameOver;
  const pendWages =
    g.weavers.length * WAGES.weaver +
    g.masterWeavers.length * WAGES.master +
    g.sachetMakers.length * WAGES.sachet_maker;
  const pendMaint = g.fixedCost + g.maintenancePenalty;
  const pendTotal = pendWages + pendMaint;
  const safe = g.money >= pendTotal;

  return (
    <div className="panel side-panel" id="status-panel">
      <div className="crew-head">
        <div className="avatar">🧑‍✈️</div>
        <div className="who">
          <div className="nm">{currentUser || tr('我', 'Me')}</div>
          <div className="role">
            {tr('我的商队', 'My fleet')} · {g.slot ? tr('玩家', 'Player ') + g.slot : ''}
          </div>
        </div>
        <span className="dot on" title={tr('在线', 'Online')} />
      </div>
      <CrewSections g={g} />
      {showDue && (
        <div
          className="status-section"
          style={{ borderColor: safe ? 'rgba(14,165,233,.14)' : 'rgba(225,29,72,.5)' }}
        >
          <h3>{tr('⚠️ 本回合应付款项', '⚠️ Due This Round')}</h3>
          <div className="stat-row">
            <span
              title={tr(
                '每回合结算阶段必须支付的固定运营成本，付不起即破产',
                'Fixed operating cost paid every Upkeep phase — fail to pay and you go bankrupt',
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
              title={tr(
                '结算阶段自动支付的全部工匠工资，付不起即破产',
                'All artisan wages, paid automatically at Upkeep — fail to pay and you go bankrupt',
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
                "🚨 You can't cover this round's settlement — raise cash fast!",
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
