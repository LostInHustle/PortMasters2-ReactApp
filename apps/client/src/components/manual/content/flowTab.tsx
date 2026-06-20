import { useTranslate } from '../../../i18n/useTranslate.js';

// Ported verbatim from PortMasters2/PortMasters_online.html manualContentZh/manualContentEn
// (lines 3452-3685 / 3687-3920 respectively), the 'flow' key of each.
// Kept as two parallel JSX trees (one per language) rather than merged tr()-per-node, matching
// the original's own choice to duplicate full per-language content blocks for this prose --
// merging them would mean interleaving translation calls through dense paragraphs for no
// real benefit.
export function FlowTab() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>🔄 The 8 Phases of Every Voyage</h4>
        <table>
          <thead>
            <tr>
              <th>Phase</th>
              <th>What you do</th>
              <th>Advances when</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>⚓ Set Sail</td>
              <td>Confirm the start of the round</td>
              <td>Both click "Set Sail"</td>
            </tr>
            <tr>
              <td>🧭 Fortune</td>
              <td>
                Pick 1 of 4 randomly drawn fortune cards (each captain gets a different draw); lasts
                this round only
              </td>
              <td>Both lock a fortune</td>
            </tr>
            <tr>
              <td>🛒 Procure</td>
              <td>Buy materials/goods from 5 supply cards (each card once)</td>
              <td>Both click "Done Procuring"</td>
            </tr>
            <tr>
              <td>🤝 Barter</td>
              <td>Trade goods and gold freely with your partner</td>
              <td>Both click "Ready"</td>
            </tr>
            <tr>
              <td>👥 Artisans</td>
              <td>Hire/dismiss artisans, assign production (consumes materials immediately)</td>
              <td>Both click "Done Managing"</td>
            </tr>
            <tr>
              <td>📦 Trade</td>
              <td>Deliver up to 5 port orders from stock for rewards</td>
              <td>Both click "Done Trading"</td>
            </tr>
            <tr>
              <td>🔧 Upkeep</td>
              <td>Production arrives, wages paid automatically, then pay upkeep manually</td>
              <td>Both pay upkeep</td>
            </tr>
            <tr>
              <td>🚢 Shipyard</td>
              <td>Optional: upgrade your ship; then end the voyage</td>
              <td>Both click "End Voyage"</td>
            </tr>
          </tbody>
        </table>
        <p>
          The "🔄 Ready n/N" chip in the bottom bar shows sync progress; once you confirm, a waiting
          hint appears until your partner does too. Bankrupt players count as auto-ready and never
          block their partner.
        </p>
      </>
    );
  }
  return (
    <>
      <h4>🔄 每个航程的 8 个阶段</h4>
      <table>
        <thead>
          <tr>
            <th>阶段</th>
            <th>你要做什么</th>
            <th>推进条件</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>⚓ 启航</td>
            <td>确认开始本回合</td>
            <td>双方点击「扬帆起航」</td>
          </tr>
          <tr>
            <td>🧭 福缘</td>
            <td>从随机抽出的 4 张福缘卡中选 1 张（双方组合不同），仅本回合生效</td>
            <td>双方各自锁定福缘</td>
          </tr>
          <tr>
            <td>🛒 采购</td>
            <td>从 5 张进货卡中购买原料/成品（每张限购一次）</td>
            <td>双方点击「完成采购」</td>
          </tr>
          <tr>
            <td>🤝 互市</td>
            <td>与伙伴自由交易货物与金币</td>
            <td>双方点击「准备就绪」</td>
          </tr>
          <tr>
            <td>👥 工匠</td>
            <td>雇佣/解雇工匠，分配生产任务（立即耗料）</td>
            <td>双方点击「完成工匠管理」</td>
          </tr>
          <tr>
            <td>📦 贸易</td>
            <td>用库存交付 5 张港口订单赚取报酬</td>
            <td>双方点击「完成交易」</td>
          </tr>
          <tr>
            <td>🔧 结算</td>
            <td>产出入库、自动付工资，然后手动支付维护费</td>
            <td>双方支付维护费</td>
          </tr>
          <tr>
            <td>🚢 船坞</td>
            <td>可选：升级商船；然后结束本航程</td>
            <td>双方点击「结束航程」</td>
          </tr>
        </tbody>
      </table>
      <p>
        底部操作栏的「🔄 船长就绪
        n/N」实时显示同步进度；你确认后若对方未确认，会显示等待提示。已破产的玩家视为自动就绪，不会阻塞对方。
      </p>
    </>
  );
}
