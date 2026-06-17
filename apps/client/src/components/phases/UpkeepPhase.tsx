import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useWs } from '../../ws/WsContext.js';
import { EnvironmentBanner } from '../panels/EnvironmentBanner.js';
import { PhaseBrief } from './PhaseBrief.js';

// Ported verbatim from PortMasters2/PortMasters_online.html maintenanceHTML (lines 3085-3127).
export function UpkeepPhase() {
  const { tr } = useTranslate();
  const { serverState } = useSession();
  const { send } = useWs();
  const g = serverState?.yourGame;
  if (!g) return null;

  const cost = g.fixedCost + g.maintenancePenalty;
  const safe = g.money >= cost;
  const m = g.monsoon_state;
  const riskPct = Math.round((g.pirateRiskEffective ?? m?.pirateRisk ?? 0) * 100);
  const escortCost = g.escortCost || 10;
  const canEscort = !g.pirate_immunity && g.money >= escortCost;
  const lossPct = Math.round(g.pirateLossPct * 100);
  const projectedLoss = Math.round(g.money * g.pirateLossPct);

  return (
    <>
      <PhaseBrief phaseKey={3} />
      <EnvironmentBanner g={g} />
      <div className="center-block">
        <div
          className="section-box"
          style={{
            background: 'linear-gradient(135deg,rgba(52,211,153,.12),rgba(13,148,136,.08))',
          }}
        >
          <h3>{tr('✅ 已自动完成', '✅ Handled Automatically')}</h3>
          <div className="section-hint">
            {tr(
              '工匠产出已入库（可在左侧船舱货物中查看），全部工匠工资已自动结算扣除。',
              'Artisan output is now in your hold (see the cargo panel on the left), and all wages have been deducted automatically.',
            )}
          </div>
        </div>
        <div className="section-box" style={safe ? {} : { borderColor: 'rgba(225,29,72,.5)' }}>
          <h3>{tr('🔧 待支付：船队维护费', '🔧 Due Now: Fleet Upkeep')}</h3>
          <div className="stat-row" style={{ fontSize: 14 }}>
            <span>{tr('维护费', 'Upkeep')}</span>
            <strong>
              {cost} {tr('金币', 'gold')}
            </strong>
          </div>
          <div className="stat-row" style={{ fontSize: 14 }}>
            <span>{tr('当前现金', 'Gold on hand')}</span>
            <strong style={{ color: safe ? '#059669' : '#e11d48' }}>
              {g.money} {tr('金币', 'gold')}
            </strong>
          </div>
          {!safe && (
            <div
              style={{
                background: 'var(--grad-danger)',
                color: '#fff',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 12,
                marginTop: 8,
                fontWeight: 700,
              }}
            >
              {tr(
                '🚨 现金不足以支付维护费——支付后将破产出局！',
                "🚨 You can't cover the upkeep — paying it will bankrupt your fleet!",
              )}
            </div>
          )}
          <div className="section-hint" style={{ marginTop: 8 }}>
            {tr(
              '支付维护费后还将按本回合净利润缴纳约10%所得税（持「免税令」福缘时为5%）。',
              "After upkeep, ~10% income tax is levied on this round's net profit (5% with the Tax Exemption fortune).",
            )}
          </div>
        </div>
        <div className="section-box">
          <h3>{tr('🛡️ 海盗反制：雇佣护航', '🛡️ Pirate Counterplay: Hire Escort')}</h3>
          <div className="section-hint">
            {tr(
              `本程海盗袭扰概率为 ${riskPct}%（含天象与可疑牙行的影响），若触发将损失当前金币的 ${lossPct}%（按现有现金约为 ${projectedLoss} 金币）。护航费用按当前财富计算，本次为 ${escortCost} 金币，可完全免疫本次结算的海盗 RNG。`,
              `This voyage's pirate raid chance is ${riskPct}% (weather plus any shady brokers); if it lands you lose ${lossPct}% of your gold (about ${projectedLoss} gold at your current balance). The escort fee scales with your wealth, ${escortCost} gold right now, and fully neutralizes pirate RNG for this upkeep.`,
            )}
          </div>
          <button
            className={`btn ${g.pirate_immunity ? 'btn-grey' : 'btn-shield'}`}
            disabled={g.pirate_immunity || !canEscort}
            onClick={() => send({ action: 'hireEscort' })}
            title={
              g.pirate_immunity
                ? tr('本程已获得护航保护', 'Escort protection is already active')
                : canEscort
                  ? tr(
                      '支付金币，免疫本次结算的海盗事件',
                      'Pay gold to prevent pirate events this upkeep',
                    )
                  : tr('现金不足，无法雇佣护航', 'Not enough gold to hire an escort')
            }
          >
            {g.pirate_immunity
              ? tr('🛡️ 护航已就位', '🛡️ Escort Active')
              : tr(`🛡️ 雇佣护航（${escortCost}💰）`, `🛡️ Hire Escort (${escortCost}💰)`)}
          </button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn btn-warning btn-xl"
            onClick={() => send({ action: 'doMaintenance' })}
            title={tr(
              '支付维护费并结束本回合结算',
              "Pay the upkeep and finish this round's settlement",
            )}
          >
            {tr('💸 支付维护费', '💸 Pay Upkeep')}
            <span className="btn-sub">
              {tr('双方完成后进入船坞', 'Shipyard opens when both have paid')}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
