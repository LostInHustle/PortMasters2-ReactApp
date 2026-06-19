import { tn } from '../../i18n/enNames.js';
import { ITEM_COLORS, ITEM_ICONS, itemTip } from '../../i18n/itemIcons.js';
import { priceTip } from '../../i18n/priceTip.js';
import { tnames } from '../../i18n/serverTextRules.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useWs } from '../../ws/WsContext.js';
import { EnvironmentBanner } from '../panels/EnvironmentBanner.js';
import { BrokerWhisper } from './BrokerWhisper.js';
import { PhaseBrief } from './PhaseBrief.js';

// Ported verbatim from PortMasters2/PortMasters_online.html purchaseHTML (lines 2705-2755).
export function ProcurePhase() {
  const { tr, lang } = useTranslate();
  const { serverState } = useSession();
  const { send } = useWs();
  const g = serverState?.yourGame;
  if (!g) return null;
  const flags = g.modifierFlags;

  const discountChips: { key: string; label: string }[] = [];
  if (flags.purchaseDiscount) {
    discountChips.push({
      key: 'pd',
      label: tr('✨ 商贾魅力：实付约85折', "✨ Merchant's Charm: ~15% off"),
    });
  }
  if (flags.hempPriceReduction) {
    discountChips.push({
      key: 'hp',
      label: tr('🧶 麻布专营：麻布单价−2', '🧶 Hemp Monopoly: −2/unit on Hemp Cloth'),
    });
  }
  if (g.equippedModules.some((m) => m.id === 'kiln_cellar')) {
    discountChips.push({
      key: 'kc',
      label: tr(
        '🔥 陶土窖：瓷土、铜矿单价−2',
        '🔥 Kiln Cellar: −2/unit on Porcelain Clay & Copper Ore',
      ),
    });
  }
  if (g.equippedModules.some((m) => m.id === 'foreign_quarter_pass')) {
    discountChips.push({
      key: 'fq',
      label: tr(
        '🪪 蕃坊行会证：香料、珍珠单价−3',
        '🪪 Foreign Quarter Guild Pass: −3/unit on Spices & Pearls',
      ),
    });
  }
  if (g.equippedModules.some((m) => m.id === 'smugglers_hold')) {
    discountChips.push({
      key: 'sh',
      label: tr(
        '🏴‍☠️ 走私暗舱：采购成本实付85折',
        "🏴‍☠️ Smuggler's Hold: purchases at ~85% of sticker price",
      ),
    });
  }

  return (
    <>
      <PhaseBrief
        phaseKey={1}
        extraChips={discountChips.map((c) => (
          <span className="chip green" key={c.key}>
            {c.label}
          </span>
        ))}
      />
      <EnvironmentBanner g={g} />
      <BrokerWhisper g={g} />
      <div className="card-grid">
        {g.resourceCards.map((card) => {
          const purchased = g.purchasedCards.includes(card.id!);
          const effectiveCost = card.effectiveCost ?? card.totalCost;
          const cardDiscounted = effectiveCost !== card.totalCost;
          const canAfford = g.money >= effectiveCost && !purchased;
          return (
            <div className="card" key={card.id}>
              <div className="card-header">
                <span>📍 {tn(card.port, lang)}</span>
                <span className={`card-tag ${card.isProductCard ? 'product' : ''}`}>
                  {card.isProductCard
                    ? tr('成品现货', 'Finished Goods')
                    : tr('原材料', 'Raw Materials')}
                </span>
              </div>
              <div className="card-body">
                {card.resources.map((r, i) => {
                  const effectivePrice = r.effectivePrice ?? r.price;
                  const rowDiscounted = effectivePrice !== r.price;
                  return (
                    <div className="resource-row" key={i}>
                      <span className="icon">{ITEM_ICONS[r.type]}</span>
                      <span
                        className="name tip"
                        data-tip={itemTip(r.type, lang)}
                        style={{ color: ITEM_COLORS[r.type] }}
                      >
                        {tn(r.type, lang)}
                      </span>
                      <span className="qty">×{r.quantity}</span>
                      <span className="price tip" data-tip={priceTip(r, lang)}>
                        {tr('单价', 'unit')}{' '}
                        {rowDiscounted ? (
                          <>
                            <span className="price-original">{r.price}</span>{' '}
                            <span className="price-discounted">{effectivePrice}💰</span>
                          </>
                        ) : (
                          <>{r.price}💰</>
                        )}
                        {r.materialDetails &&
                          ` · ${tr('用料', 'uses')} ${tnames(r.materialDetails, lang)}`}
                      </span>
                    </div>
                  );
                })}
                <div className="card-total">
                  <span>{tr('合计货款', 'Total')}</span>
                  <span>
                    {cardDiscounted ? (
                      <>
                        <span className="price-original">{card.totalCost}</span>{' '}
                        <span className="price-discounted">{effectiveCost} 💰</span>
                      </>
                    ) : (
                      <>{card.totalCost} 💰</>
                    )}
                  </span>
                </div>
              </div>
              <div className="card-footer">
                <button
                  className={`btn ${canAfford ? 'btn-success' : 'btn-grey'}`}
                  style={{ width: '100%' }}
                  disabled={!canAfford}
                  onClick={() => send({ action: 'purchase', cardId: card.id })}
                  title={
                    purchased
                      ? tr('该批货物已购入船舱', 'This cargo is already in your hold')
                      : canAfford
                        ? tr(
                            '立即购入，货物直接进入船舱',
                            'Buy now, goods go straight to your hold',
                          )
                        : tr('现金不足，无法采购', 'Not enough gold')
                  }
                >
                  {purchased
                    ? tr('✅ 已采购入舱', '✅ Purchased')
                    : canAfford
                      ? tr('🛒 采购此批货物', '🛒 Buy This Cargo')
                      : tr('💸 现金不足', '💸 Not Enough Gold')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ textAlign: 'center', marginTop: 22 }}>
        <button
          className="btn btn-lg"
          onClick={() => send({ action: 'ready_for_next_phase' })}
          title={tr(
            '确认后等待对方，双方都确认即进入互市',
            'Confirm and wait, Barter begins once both captains are ready',
          )}
        >
          {tr('✅ 完成采购，进入互市', '✅ Done Procuring, to Barter')}
          <span className="btn-sub">{tr('双方确认后同步推进', 'Advances when both confirm')}</span>
        </button>
      </div>
    </>
  );
}
