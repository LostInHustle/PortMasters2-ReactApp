import { GOLD, type ItemId, type TradeItemType } from '@pm2/shared';
import { useState } from 'react';
import { tn } from '../../i18n/enNames.js';
import { ITEM_ICONS } from '../../i18n/itemIcons.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useToast } from '../../state/ToastContext.js';
import { useWs } from '../../ws/WsContext.js';
import { PhaseBrief } from './PhaseBrief.js';

// Ported verbatim from PortMasters2/PortMasters_online.html tradePhaseHTML/createTradeOrder
// (lines 2827-2919). captureTradeForm/restoreTradeForm aren't ported: they exist only to work
// around the original's full-innerHTML re-render destroying in-progress form input, which
// React's reconciliation (this component stays mounted across re-renders) avoids for free.
export function BarterPhase() {
  const { tr, lang } = useTranslate();
  const { serverState } = useSession();
  const { send } = useWs();
  const { showNotification } = useToast();
  const g = serverState?.yourGame;
  if (!g || !serverState) return null;

  const mySlot = g.slot!;
  const orders = serverState.tradeOrders;
  const receivedOrders = orders.filter((o) => o.sellerSlot !== mySlot - 1);
  const myOrders = orders.filter((o) => o.sellerSlot === mySlot - 1);
  const myReady = serverState.tradeReady[mySlot - 1];
  const otherIndices = serverState.players.map((_, i) => i).filter((i) => i !== mySlot - 1);
  const othersReadyCount = otherIndices.filter((i) => serverState.tradeReady[i]).length;
  const nameOf = (sellerSlot: number) =>
    serverState.players[sellerSlot]?.name ?? tr('对方', 'Partner');
  const sep = tr('、', ', ');

  const options: TradeItemType[] = [GOLD, ...g.unlockedResources, ...g.unlockedProducts];
  const stockOf = (t: TradeItemType) => (t === GOLD ? g.money : g.inventory[t as ItemId] || 0);

  const [sellType, setSellType] = useState<TradeItemType>(GOLD);
  const [sellQty, setSellQty] = useState('1');
  const [buyType, setBuyType] = useState<TradeItemType>(GOLD);
  const [buyQty, setBuyQty] = useState('1');

  const submitOrder = () => {
    const sq = parseInt(sellQty, 10);
    const bq = parseInt(buyQty, 10);
    if (isNaN(sq) || sq < 1 || isNaN(bq) || bq < 1) {
      showNotification(
        tr('数量必须为大于 0 的整数', 'Quantities must be whole numbers greater than 0'),
        true,
      );
      return;
    }
    if (sellType === buyType) {
      showNotification(
        tr('出售与换取不能是同一种物品', "You can't trade an item for itself"),
        true,
      );
      return;
    }
    send({
      action: 'createTradeOrder',
      sell: [{ type: sellType, quantity: sq }],
      buy: [{ type: buyType, quantity: bq }],
    });
    showNotification(
      tr(
        '📨 订单已发布，其他船长可在其界面中接受或拒绝',
        '📨 Offer posted, any other captain can accept or decline it',
      ),
    );
  };

  return (
    <>
      <PhaseBrief
        phaseKey="trade"
        extraChips={
          <>
            <span className={`chip ${myReady ? 'green' : 'amber'}`}>
              {tr('我', 'You')}{' '}
              {myReady ? tr('✅ 已准备', '✅ Ready') : tr('⌛ 未准备', '⌛ Not ready')}
            </span>
            <span className={`chip ${othersReadyCount === otherIndices.length ? 'green' : 'amber'}`}>
              {tr(
                `其他船长 ${othersReadyCount}/${otherIndices.length} 已准备`,
                `Others ${othersReadyCount}/${otherIndices.length} ready`,
              )}
            </span>
          </>
        }
      />

      <div className="trade-section">
        <h3>{tr('📥 收到的交易', '📥 Offers Received')}</h3>
        <div className="section-hint">
          {tr(
            '接受即按订单内容即时互换；若任意一方资源不足，交易不会成立。不想要可直接拒绝。',
            "Accepting swaps the goods instantly; the trade won't go through if either side lacks the resources. Decline anything you don't want.",
          )}
        </div>
        {receivedOrders.length === 0 ? (
          <p className="muted">{tr('暂无来自其他船长的订单', 'No offers from other captains yet')}</p>
        ) : (
          receivedOrders.map((o) => (
            <div className="trade-order" key={o.id}>
              <div className="muted" style={{ fontSize: 11 }}>
                {nameOf(o.sellerSlot)}
              </div>
              <div>
                {tr('📤 对方给出：', '📤 They give: ')}
                <strong>
                  {o.sell
                    .map((i) => `${ITEM_ICONS[i.type] ?? ''}${tn(i.type, lang)} ×${i.quantity}`)
                    .join(sep)}
                </strong>
              </div>
              <div>
                {tr('📥 希望换取你的：', '📥 In exchange for your: ')}
                <strong>
                  {o.buy
                    .map((i) => `${ITEM_ICONS[i.type] ?? ''}${tn(i.type, lang)} ×${i.quantity}`)
                    .join(sep)}
                </strong>
              </div>
              <div className="actions">
                <button
                  className="btn btn-success"
                  onClick={() => send({ action: 'acceptTrade', orderId: o.id })}
                  title={tr('接受后立即完成互换', 'Accept to swap immediately')}
                >
                  {tr('✅ 接受成交', '✅ Accept')}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => send({ action: 'rejectTrade', orderId: o.id })}
                >
                  {tr('❌ 拒绝', '❌ Decline')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="trade-section">
        <h3>{tr('📤 向其他船长发布交易订单', '📤 Post an Offer')}</h3>
        <div className="section-hint">
          {tr(
            '下拉框中实时显示你的持有量，方便核对。订单发布后任意其他船长都可接受或拒绝；本阶段结束前未成交的订单自动作废。',
            'The dropdowns show your current stock. Any other captain can accept or decline; unaccepted offers expire when this phase ends.',
          )}
        </div>
        <div className="trade-create">
          <div>
            {tr('我 出售：', 'I give: ')}
            <select
              value={sellType}
              onChange={(e) => setSellType(e.target.value as TradeItemType)}
              title={tr('选择你要给出的物资或金币', 'Choose the goods or gold you offer')}
            >
              {options.map((t) => (
                <option value={t} key={t}>
                  {ITEM_ICONS[t] ?? ''} {tn(t, lang)}
                  {tr(`（我有 ${stockOf(t)}）`, ` (you have ${stockOf(t)})`)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={sellQty}
              onChange={(e) => setSellQty(e.target.value)}
              style={{ width: 64 }}
              title={tr('给出数量', 'Quantity offered')}
            />{' '}
            {tr('个', 'pcs')}
          </div>
          <div>
            {tr('换 取：', 'For their: ')}
            <select
              value={buyType}
              onChange={(e) => setBuyType(e.target.value as TradeItemType)}
              title={tr(
                '选择希望从其他船长处获得的物资或金币',
                'Choose what you want in return',
              )}
            >
              {options.map((t) => (
                <option value={t} key={t}>
                  {ITEM_ICONS[t] ?? ''} {tn(t, lang)}
                  {tr(`（我有 ${stockOf(t)}）`, ` (you have ${stockOf(t)})`)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={buyQty}
              onChange={(e) => setBuyQty(e.target.value)}
              style={{ width: 64 }}
              title={tr('索取数量', 'Quantity requested')}
            />{' '}
            {tr('个', 'pcs')}
          </div>
          <button
            className="btn btn-gold"
            onClick={submitOrder}
            title={tr('发布后对方会立即看到此订单', 'Your partner sees the offer immediately')}
          >
            {tr('📨 发布订单', '📨 Post Offer')}
          </button>
        </div>
      </div>

      <div className="section-box">
        <h3>{tr('🗂️ 我已发布的订单', '🗂️ My Posted Offers')}</h3>
        {myOrders.length === 0 ? (
          <span className="muted">
            {tr(
              '暂无。发布订单后可在此查看其状态。',
              'None yet. Posted offers and their status appear here.',
            )}
          </span>
        ) : (
          myOrders.map((o) => (
            <div style={{ fontSize: 12.5, margin: '5px 0' }} key={o.id}>
              {tr('📤 出', '📤 Give')}{' '}
              {o.sell.map((i) => `${tn(i.type, lang)}×${i.quantity}`).join(sep)} ⇄ {tr('换', 'for')}{' '}
              {o.buy.map((i) => `${tn(i.type, lang)}×${i.quantity}`).join(sep)}{' '}
              <span className="muted">
                {tr('（等待其他船长接受或拒绝）', '(awaiting a response)')}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button
          className={`btn btn-lg ${myReady ? 'btn-grey' : 'btn-success'}`}
          disabled={myReady}
          onClick={() => send({ action: 'setTradeReady' })}
          title={tr(
            '所有船长都点击后进入工匠管理。点击前请确认交易已谈妥',
            'Artisan management begins once every captain is ready, settle your trades first',
          )}
        >
          {myReady
            ? tr('⏳ 已准备，等待其他船长就绪', '⏳ Ready, waiting for others')
            : tr('✅ 互市完毕，准备就绪', '✅ Done Bartering, ready')}
          <span className="btn-sub">
            {myReady ? '' : tr('双方就绪后进入工匠管理', 'Advances when both are ready')}
          </span>
        </button>
      </div>
    </>
  );
}
