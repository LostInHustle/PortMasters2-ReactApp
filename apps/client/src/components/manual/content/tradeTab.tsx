import { useTranslate } from '../../../i18n/useTranslate.js';

// Ported verbatim from PortMasters2/PortMasters_online.html manualContentZh/manualContentEn
// (lines 3452-3685 / 3687-3920 respectively), the 'trade' key of each.
// Kept as two parallel JSX trees (one per language) rather than merged tr()-per-node, matching
// the original's own choice to duplicate full per-language content blocks for this prose --
// merging them would mean interleaving translation calls through dense paragraphs for no
// real benefit.
export function TradeTab() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>🤝 The Barter Phase (this game's cooperative heart)</h4>
        <ul>
          <li>
            Post an offer: "I give A×n for B×m", where A and B can be any material, product, or
            gold.
          </li>
          <li>
            Your partner can
            <strong>accept</strong>
            (instant swap) or
            <strong>decline</strong>
            (offer voided). Trades fail safely if either side lacks the resources.
          </li>
          <li>
            Once both captains click "✅ Ready", the artisan phase begins; unaccepted offers expire.
          </li>
          <li>
            The right-hand panel shows your partner's gold, renown, stock, artisans and buffs in
            real time, so
            <strong>see what they need before naming your price</strong>.
          </li>
        </ul>
        <h4>🌐 Online Mechanics</h4>
        <ul>
          <li>
            <strong>Invitations & difficulty</strong>: invite any online player from the lobby; one
            invite per minute, 60 second expiry. When you send the invite you first choose the
            session difficulty (Easy, Standard or Hard, Easy by default), and the other captain
            reads a short explanation and agrees to it before you both start at the same level.
          </li>
          <li>
            <strong>Sync</strong>: both captains are always on the same round and phase; every phase
            needs both to confirm.
          </li>
          <li>
            <strong>Reconnection</strong>: sessions live on the server, so log back in to resume.
            The session is recycled only when both players are offline.
          </li>
          <li>
            <strong>Chat</strong>: hit 💬 in the header to talk (disabled while your partner is
            offline).
          </li>
          <li>
            <strong>Restart</strong>: once both games have ended (finished or bankrupt), either
            captain can reset for a new run.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h4>🤝 互市阶段（本作双人核心玩法）</h4>
      <ul>
        <li>发布订单：「我出售 A×n，换取 B×m」，其中 A、B 可以是任意原料、成品或金币。</li>
        <li>
          对方可
          <strong>接受</strong>
          （双方资源即时互换）或
          <strong>拒绝</strong>
          （订单作废）。任一方资源不足时交易不会成立。
        </li>
        <li>双方都点击「✅ 准备就绪」后进入工匠管理；未成交订单自动作废。</li>
        <li>
          右侧伙伴面板实时展示对方的存款、声望、库存、工匠与增益，
          <strong>看准对方缺什么再开价</strong>。
        </li>
      </ul>
      <h4>🌐 联机机制</h4>
      <ul>
        <li>
          <strong>邀请与难度</strong>
          ：大厅中向在线玩家发出邀请，每分钟限 1 次，60
          秒未回应自动超时。发出邀请时会先为本局选择难度（轻松或高难，默认轻松），对方在确认窗口看过说明并同意后，双方才以同一难度开局。
        </li>
        <li>
          <strong>同步</strong>
          ：双方始终同回合同阶段；每个阶段需双方确认才推进。
        </li>
        <li>
          <strong>断线重连</strong>
          ：会话保留在服务器，重新登录即恢复进度；双方都离线时会话回收。
        </li>
        <li>
          <strong>聊天</strong>
          ：点击右上角 💬 与伙伴实时沟通（对方离线时无法发送）。
        </li>
        <li>
          <strong>重新开始</strong>
          ：双方都结束本局（完赛或破产）后，任一方可重置开新局。
        </li>
      </ul>
    </>
  );
}
