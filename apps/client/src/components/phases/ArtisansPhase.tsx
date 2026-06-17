import { WAGES } from '@pm2/shared';
import { tn } from '../../i18n/enNames.js';
import { ITEM_ICONS } from '../../i18n/itemIcons.js';
import { WORKER_TYPES } from '../../i18n/workerTypesText.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useWs } from '../../ws/WsContext.js';
import { PhaseBrief } from './PhaseBrief.js';
import { WorkerList } from './WorkerList.js';

// Ported verbatim from PortMasters2/PortMasters_online.html workerMgmtHTML (lines 2921-2979).
export function ArtisansPhase() {
  const { tr, pf, lang } = useTranslate();
  const { serverState } = useSession();
  const { send } = useWs();
  const g = serverState?.yourGame;
  if (!g) return null;
  const hireDiscount = g.modifierFlags.hireDiscount;
  const costOf = (key: keyof typeof WAGES) =>
    hireDiscount ? Math.floor(WAGES[key] / 2) : WAGES[key];
  const hiredAny = WORKER_TYPES.some((wt) => g[wt.listKey].length > 0);

  return (
    <>
      <PhaseBrief
        phaseKey="worker_mgmt"
        extraChips={
          hireDiscount && (
            <span className="chip green">
              {tr(
                '🎓 学徒传承：本回合雇佣半价',
                '🎓 Apprentice Legacy: hiring half-price this round',
              )}
            </span>
          )
        }
      />
      <div className="center-block">
        <div className="section-box">
          <h3>{tr('📦 当前库存速览', '📦 Stock at a Glance')}</h3>
          <div className="section-hint">
            {tr(
              '分配生产任务会立即扣除对应材料，请先核对库存。',
              'Assigning a task immediately consumes the materials — check your stock first.',
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div className="inv-section-title">{tr('原 材 料', 'MATERIALS')}</div>
              {g.unlockedResources.map((r) => (
                <div className="inv-item" key={r}>
                  <span className="icon">{ITEM_ICONS[r]}</span>
                  <span className="name">{tn(r, lang)}</span>
                  <span className="count">{g.inventory[r] || 0}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="inv-section-title">{tr('成 品', 'PRODUCTS')}</div>
              {g.unlockedProducts.map((r) => (
                <div className="inv-item" key={r}>
                  <span className="icon">{ITEM_ICONS[r]}</span>
                  <span className="name">{tn(r, lang)}</span>
                  <span className="count">{g.inventory[r] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section-box">
          <h3>{tr('🔨 雇佣工匠', '🔨 Hire Artisans')}</h3>
          <div className="section-hint">
            {tr(
              '雇佣本身免费，但每回合结算时自动支付工资（现金不足即破产）。工匠累计产出 2 件后晋升熟练⭐，此后每次产 2 件。',
              'Hiring is free, but wages are paid automatically every Upkeep (run out of cash and you go bankrupt). After producing 2 items an artisan becomes skilled ⭐ and makes 2 per task.',
            )}{' '}
            {tr('当前现金：', 'Gold on hand: ')}
            <strong style={{ color: '#059669' }}>
              {g.money} {tr('金币', 'gold')}
            </strong>
          </div>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, margin: '8px 0' }}
          >
            <thead>
              <tr style={{ color: 'var(--ink-faint)', textAlign: 'left' }}>
                <th style={{ padding: 4 }}>{tr('工匠', 'Artisan')}</th>
                <th>{tr('工资/回合', 'Wage/round')}</th>
                <th>{tr('可制作', 'Crafts')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {WORKER_TYPES.filter((wt) => g.unlockedWorkerTypes.includes(wt.key)).map((wt) => (
                <tr style={{ borderTop: '1px solid rgba(148,163,184,.25)' }} key={wt.key}>
                  <td style={{ padding: '6px 4px', fontWeight: 700 }}>
                    {wt.icon} {pf(wt.name)}
                  </td>
                  <td>
                    {costOf(wt.key)} 💰{hireDiscount && <s className="muted">{WAGES[wt.key]}</s>}
                  </td>
                  <td>{wt.can.map((t) => `${ITEM_ICONS[t]}${tn(t, lang)}`).join(tr('、', ', '))}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-success"
                      style={{ padding: '6px 14px', fontSize: 12 }}
                      onClick={() => send({ action: 'hireWorker', workerType: wt.key })}
                      title={pf(wt.tip)}
                    >
                      {tr('＋ 雇佣', '＋ Hire')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hiredAny && (
          <div className="section-box">
            <h3>{tr('👥 团队任务分配', '👥 Task Assignments')}</h3>
            <div className="section-hint">
              {tr(
                '为空闲工匠指派生产任务；产出将在结算阶段自动入库。解雇空闲工匠需支付一次工资作遣散费。',
                'Assign tasks to idle artisans; output arrives automatically at Upkeep. Dismissing an idle artisan costs one wage as severance.',
              )}
            </div>
            {WORKER_TYPES.map((wt) => (
              <WorkerList type={wt.key} list={g[wt.listKey]} tasks={wt.can} key={wt.key} />
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            className="btn btn-lg"
            onClick={() => send({ action: 'ready_for_next_phase' })}
            title={tr(
              '双方确认后进入贸易订单阶段',
              'The Trade phase begins once both captains confirm',
            )}
          >
            {tr('✅ 完成工匠管理，进入贸易', '✅ Done Managing — To Trade')}
            <span className="btn-sub">
              {tr('双方确认后同步推进', 'Advances when both confirm')}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
