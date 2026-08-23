import { tn } from '../../i18n/enNames.js';
import { ITEM_COLORS, ITEM_ICONS } from '../../i18n/itemIcons.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useWs } from '../../ws/WsContext.js';
import { EnvironmentBanner } from '../panels/EnvironmentBanner.js';
import { PhaseBrief } from './PhaseBrief.js';

// Ported verbatim from PortMasters2/PortMasters_online.html ordersHTML (lines 3024-3083):
// phase 2, fulfilling port orders from cargo for gold (the original calls this phase "贸易" /
// "Trade", distinct from the 'trade' phase key which is Barter).
export function TradePhase() {
  const { tr, lang } = useTranslate();
  const { serverState } = useSession();
  const { send } = useWs();
  const g = serverState?.yourGame;
  if (!g) return null;

  return (
    <>
      <PhaseBrief phaseKey={2} />
      <EnvironmentBanner g={g} />
      <div className="card-grid">
        {g.customerCards.map((o) => {
          const canComplete = o.resources.every((r) => (g.inventory[r.type] || 0) >= r.required);
          const completed = g.completedOrders.includes(o.id!);
          // The server sends the real figure (see orderTransportCost). This used to be worked
          // out here as max(5, items * 2 - level * 5), which only matches a captain carrying no
          // transport module and no transport boon: a Bulk Hauler was quoted 7 on a delivery
          // that charged 1, and Silk Monopoly was quoted 7 on one that shipped free.
          const shipping = o.transportCost ?? 0;
          const isGolden = o.kind === 'EmperorMandate';
          const cardClass = [
            isGolden && 'golden-order-card',
            isGolden && o.isFinalMandate && 'final-mandate',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div className={`card ${cardClass}`} key={o.id}>
              <div className="card-header">
                <span>
                  {isGolden ? tr('👑 皇命金单', '👑 Emperor Mandate') : '📍'}{' '}
                  {isGolden
                    ? `${tn(o.demandPort, lang)} · ${tr('钦定贡令', 'Imperial Commission')}`
                    : tn(o.demandPort, lang)}
                </span>
                <span style={{ display: 'flex', gap: 4 }}>
                  {isGolden && (
                    <span className="card-tag golden">{tr('⭐ 黄金订单', '⭐ Golden Order')}</span>
                  )}
                  {o.fromIntel && (
                    <span
                      className="card-tag"
                      style={{ background: 'rgba(245,158,11,.2)', color: '#92400e' }}
                      title={tr(
                        '这张订单由你购买的牙行密语兑现而来',
                        "This order materialized from a Broker's Whisper you purchased",
                      )}
                    >
                      {tr('🗣️ 密语应验', '🗣️ Whisper Fulfilled')}
                    </span>
                  )}
                  <span className={`card-tag ${o.isProductOrder ? 'product' : ''}`}>
                    {o.isProductOrder
                      ? tr('成品需求', 'Products Wanted')
                      : tr('原料需求', 'Materials Wanted')}
                  </span>
                </span>
              </div>
              <div className="card-body">
                {isGolden && (
                  <div className="section-hint" style={{ color: '#92400e' }}>
                    {tr(
                      '帝国使节只在关键航程现身。提前囤好指定货物，可换取足以改写本局的报酬。',
                      'Imperial envoys appear only at milestone voyages. Hoard the requested goods early for a payout that can redefine the game.',
                    )}
                  </div>
                )}
                {o.resources.map((r, i) => {
                  const has = (g.inventory[r.type] || 0) >= r.required;
                  return (
                    <div className="resource-row" key={i}>
                      <span style={{ fontSize: 14, marginRight: 4 }}>{has ? '✅' : '❌'}</span>
                      <span className="icon">{ITEM_ICONS[r.type]}</span>
                      <span className="name" style={{ color: ITEM_COLORS[r.type] }}>
                        {tn(r.type, lang)}
                      </span>
                      <span className="qty">×{r.required}</span>
                      <span className="inv-status" style={{ color: has ? '#059669' : '#e11d48' }}>
                        {tr('库存', 'stock')} {g.inventory[r.type] || 0}
                      </span>
                    </div>
                  );
                })}
                <div className="card-total">
                  <span>{tr('💰 订单报酬', '💰 Order Reward')}</span>
                  <span>{o.reward} 💰</span>
                </div>
                <div className="stat-row" style={{ marginTop: 3 }}>
                  <span
                    className="tip"
                    data-tip={tr(
                      '交付本单实际扣除的运费，已计入船级、福缘与已装模块的全部减免；成品另缴约5%增值税',
                      'The shipping this delivery actually costs, with your ship level, fortunes and installed modules already counted. Product orders also pay ~5% VAT',
                    )}
                  >
                    {tr('📦 运费', '📦 Shipping')}
                  </span>
                  <span className="muted">
                    {shipping} 💰{o.isProductOrder ? tr(' + 增值税', ' + VAT') : ''}
                  </span>
                </div>
              </div>
              <div className="card-footer">
                <button
                  className={`btn ${canComplete && !completed ? 'btn-success' : 'btn-grey'}`}
                  style={{ width: '100%' }}
                  disabled={!canComplete || completed}
                  onClick={() => send({ action: 'completeOrder', orderId: o.id })}
                  title={
                    completed
                      ? tr('该订单已交付', 'This order is already delivered')
                      : canComplete
                        ? tr(
                            '交付货物并结算报酬、运费与税款',
                            'Deliver the goods and settle reward, shipping and taxes',
                          )
                        : tr('库存不足，无法交付', 'Not enough stock to deliver')
                  }
                >
                  {completed
                    ? tr('✅ 已交付', '✅ Delivered')
                    : canComplete
                      ? tr('🤝 交付订单', '🤝 Deliver Order')
                      : tr('📦 库存不足', '📦 Not Enough Stock')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button
          className="btn btn-lg"
          onClick={() => send({ action: 'ready_for_next_phase' })}
          title={tr(
            '确认后进入结算：生产入库、支付工资与维护费',
            'Confirm to enter Upkeep: production arrives, wages and upkeep are paid',
          )}
        >
          {tr('✅ 完成交易，进入结算', '✅ Done Trading → Upkeep')}
          <span className="btn-sub">
            {tr('全员确认后同步推进', 'Advances when everyone confirms')}
          </span>
        </button>
      </div>
    </>
  );
}
