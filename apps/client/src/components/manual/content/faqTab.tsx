import { useTranslate } from '../../../i18n/useTranslate.js';
import { pm1Url } from '../../../i18n/pm1Links.js';

// Ported verbatim from PortMasters2/PortMasters_online.html manualContentZh/manualContentEn
// (lines 3452-3685 / 3687-3920 respectively), the 'faq' key of each.
// Kept as two parallel JSX trees (one per language) rather than merged tr()-per-node, matching
// the original's own choice to duplicate full per-language content blocks for this prose --
// merging them would mean interleaving translation calls through dense paragraphs for no
// real benefit.
export function FaqTab() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>❓ Frequently Asked Questions</h4>
        <ul>
          <li>
            <strong>Clicked a button and nothing happened, or stuck waiting?</strong> You're most
            likely waiting on your partner. Check "Ready n/N" in the bottom bar, and nudge them via
            💬.
          </li>
          <li>
            <strong>Have the materials but can't assign production?</strong> All artisans may
            already have tasks; each takes only one per round.
          </li>
          <li>
            <strong>Why did I suddenly go bankrupt?</strong> You couldn't cover wages or upkeep at
            settlement. Before expanding the team, check "⚠️ Due This Round" on the left.
          </li>
          <li>
            <strong>Can I still play after bankruptcy?</strong> Your run is over, but you can open
            the "👀 Spectator Window" to watch your partner live, and you never block them; once
            they finish, click "Set Sail Again" for a fresh run together.
          </li>
          <li>
            <strong>Partner disconnected?</strong> The session stays on the server, so they just
            log back in. Chat and trades pause while they're away.
          </li>
          <li>
            <strong>What exactly is renown?</strong> It's the running total of each order's reward
            minus its shipping cost. It's the sole basis of your final rating and is never reduced
            by spending.
          </li>
        </ul>
        <h4>⌨️ Shortcuts</h4>
        <ul>
          <li>
            <span className="kbd">F1</span> opens this manual · <span className="kbd">Esc</span>{' '}
            closes dialogs / the spectator window / chat
          </li>
        </ul>
        <h4>😣 Finding PortMasters 2 too hard?</h4>
        <p>
          The simplest fix is to play on <strong>Easy</strong>. Easy mode keeps to the founding set
          of goods so the market never gets crowded, which lets you settle into the buy, produce and
          trade rhythm without pressure. It is already the default, so you only need to confirm it
          when you invite, and the "Difficulty & Expansion" section spells out exactly what differs
          between the two levels.
        </p>
        <p>
          If you would still like the gentlest possible introduction, warm up with{' '}
          <a href={pm1Url(lang)} target="_blank" rel="noopener">
            <strong>PortMasters 1 →</strong>
          </a>{' '}
          first, with no online sync, no complex taxes, and a gentler intro to the buy → produce →
          trade loop.
        </p>
      </>
    );
  }
  return (
    <>
      <h4>❓ 常见问题</h4>
      <ul>
        <li>
          <strong>点了按钮没反应，或者一直在等待？</strong>
          大概率是在等对方确认。看底部「船长就绪 n/N」，并用 💬 聊天催一下伙伴。
        </li>
        <li>
          <strong>材料明明够却无法分配生产？</strong>
          可能所有工匠都已经有任务在身，每名工匠每回合只能接一个任务。
        </li>
        <li>
          <strong>为什么突然破产了？</strong>
          因为结算阶段的现金不够支付工资或维护费。扩编工匠前，先看看左侧「⚠️ 本回合应付款项」。
        </li>
        <li>
          <strong>破产后还能玩吗？</strong>
          本局确实是出局了，不过可以点「👀
          观战伙伴」实时围观对方航行，也不会拖慢对方进度；等伙伴结束后点「重新起航」就能一起开新局。
        </li>
        <li>
          <strong>对方掉线怎么办？</strong>
          会话会保留在服务器上，对方重新登录就能恢复；期间暂时无法聊天和互市成交。
        </li>
        <li>
          <strong>声望（信誉值）是什么？</strong>
          它是每笔订单「报酬减去运费」后的累计金额，是最终评级的唯一依据，不会因为花钱而减少。
        </li>
      </ul>
      <h4>⌨️ 快捷键</h4>
      <ul>
        <li>
          <span className="kbd">F1</span>
          打开本手册 ·<span className="kbd">Esc</span>
          关闭弹窗 / 观战窗 / 聊天窗
        </li>
      </ul>
      <h4>😣 觉得 PortMasters 2 太难？</h4>
      <p>
        最直接的办法是以
        <strong>轻松</strong>
        难度开局。轻松模式只包含基础货物，市场不会过度拥挤，让你能从容掌握采购、生产与贸易的节奏；它本就是默认难度，邀请时确认一下即可，各档难度的具体差别可见「难度与拓展」一节。
      </p>
      <p>
        如果仍想从最基础处入门，也可以先游玩上一代
        <a href={pm1Url(lang)} target="_blank" rel="noopener">
          <strong>PortMasters 1（中文版）→</strong>
        </a>
        ，它没有联机同步与复杂税制，更适合熟悉「采购 → 生产 → 贸易」的基本循环。
      </p>
    </>
  );
}
