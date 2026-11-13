import { useTranslate } from '../../../i18n/useTranslate.js';

// Mirrors the "trade" section of the manual content in PortMasters2/PortMasters_online.html.
// Kept as two parallel JSX trees, one per language, rather than one merged tree with a
// translation call per node. The original also duplicates full content blocks per language for
// this prose, since merging them would mean interleaving translation calls through dense
// paragraphs for no real benefit.
export function TradeTab() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>🤝 The Barter Phase (the cooperative heart of the game)</h4>
        <ul>
          <li>
            Post an offer: "I give A×n for B×m", where A and B can be any material, product, or
            gold.
          </li>
          <li>
            Any other captain can <strong>accept</strong> (instant swap) or <strong>decline</strong>{' '}
            (offer voided). Trades fail safely if either side lacks the resources.
          </li>
          <li>
            Once every captain clicks "✅ Ready", the artisan phase begins; unaccepted offers
            expire.
          </li>
          <li>
            The Fellow Captains panel on the right shows every other captain's gold, renown, stock,
            artisans and buffs in real time, so{' '}
            <strong>see what they need before naming your price</strong>.
          </li>
        </ul>
        <h4>🌐 Online Mechanics</h4>
        <ul>
          <li>
            <strong>Invitations & difficulty</strong>: invite any online player from the lobby; one
            invite per minute, 60 second expiry. When you send the invite you first choose the
            session difficulty (Easy, Standard or Hard, Easy by default), and the invited captain
            reads a short explanation and agrees to it before the session starts at that level.
          </li>
          <li>
            <strong>Sync</strong>: every captain is always on the same round and phase; every phase
            needs everyone to confirm.
          </li>
          <li>
            <strong>Reconnection</strong>: sessions live on the server, so log back in to resume.
            The session is recycled only when every player in it is offline.
          </li>
          <li>
            <strong>Chat</strong>: hit 💬 in the header to talk (disabled while everyone else is
            offline).
          </li>
          <li>
            <strong>Restart</strong>: once every game in the room has ended (finished or bankrupt),
            any captain can reset for a new run.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h4>🤝 互市阶段（本作核心玩法）</h4>
      <ul>
        <li>发布订单：「我出售 A×n，换取 B×m」，其中 A、B 可以是任意原料、成品或金币。</li>
        <li>
          其他船长可
          <strong>接受</strong>
          （双方资源即时互换）或
          <strong>拒绝</strong>
          （订单作废）。任一方资源不足时交易不会成立。
        </li>
        <li>所有船长都点击「✅ 准备就绪」后进入工匠管理；未成交订单自动作废。</li>
        <li>
          右侧「同行船队」面板实时展示其他船长的存款、声望、库存、工匠与增益，
          <strong>看准他们缺什么再开价</strong>。
        </li>
      </ul>
      <h4>🌐 联机机制</h4>
      <ul>
        <li>
          <strong>邀请与难度</strong>
          ：大厅中向在线玩家发出邀请，每分钟限 1 次，60
          秒未回应自动超时。发出邀请时会先为本局选择难度（轻松、标准或高难，默认轻松），受邀船长在确认窗口看过说明并同意后，航程才以该难度开局。
        </li>
        <li>
          <strong>同步</strong>
          ：所有船长始终同回合同阶段；每个阶段需全员确认才推进。
        </li>
        <li>
          <strong>断线重连</strong>
          ：会话保留在服务器，重新登录即恢复进度；所有玩家都离线时会话回收。
        </li>
        <li>
          <strong>聊天</strong>
          ：点击右上角 💬 与其他船长实时沟通（其他人都离线时无法发送）。
        </li>
        <li>
          <strong>重新开始</strong>
          ：所有玩家都结束本局（完赛或破产）后，任一船长可重置开新局。
        </li>
      </ul>
    </>
  );
}
