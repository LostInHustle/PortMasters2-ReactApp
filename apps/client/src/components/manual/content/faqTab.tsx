import { useTranslate } from '../../../i18n/useTranslate.js';
import { pm1Url } from '../../../i18n/pm1Links.js';

// Mirrors the "faq" section of the manual content in PortMasters2/PortMasters_online.html.
// Kept as two parallel JSX trees, one per language, rather than one merged tree with a
// translation call per node. The original also duplicates full content blocks per language for
// this prose, since merging them would mean interleaving translation calls through dense
// paragraphs for no real benefit.
export function FaqTab() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>❓ Frequently Asked Questions</h4>
        <ul>
          <li>
            <strong>Clicked a button and nothing happened, or stuck waiting?</strong> You're most
            likely waiting on the other captains. Check the "🔄 Ready n / N" chip in the bottom bar,
            and nudge them via 💬.
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
            the "👀 Spectator Window" to watch the other captains live, and you never block them.
            The host can click "Set Sail Again" at any time for a fresh run; other captains can do
            so once every other captain's game has ended. Every captain can also use the 👀
            Spectator View button on their own fleet card on the left to view their own account in
            the same spectator window.
          </li>
          <li>
            <strong>Another captain disconnected?</strong> The session stays on the server, so they
            just log back in. Chat and trades with them pause while they're away.
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
            <span className="kbd">F1</span> opens this manual, <span className="kbd">Esc</span>{' '}
            closes dialogs / the spectator window / chat
          </li>
        </ul>
        <h4>😣 Finding PortMasters 2 too hard?</h4>
        <p>
          The simplest fix is to play on <strong>Easy</strong>. Easy mode keeps to the founding set
          of goods so the market never gets crowded, which lets you settle into the buy, produce and
          trade rhythm without pressure. It is already the default, so you only need to confirm it
          when you invite, and the "Difficulty & Expansion" section spells out exactly what differs
          between the levels.
        </p>
        <p>
          If you would still like the gentlest possible introduction, warm up with{' '}
          <a href={pm1Url(lang)} target="_blank" rel="noopener">
            <strong>PortMasters 1 →</strong>
          </a>{' '}
          first. It has no online sync and no complex taxes, and it gives a gentler intro to the buy
          → produce → trade loop.
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
          大概率是在等其他船长确认。看底部「🔄 全员就绪 n / N」，并用 💬 聊天催一下。
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
          本局确实是出局了，不过可以打开「👀
          观战窗口」实时围观其他船长的航行，也不会拖慢他们；房主可以随时点「🔄
          重新起航」开新局，其他船长则需等其他船长的本局都结束后才能重新起航。每位船长还可以点击左侧自己船队栏上的「👀
          观战视图」按钮，用同一个观战窗口查看自己的账户。
        </li>
        <li>
          <strong>其他船长掉线怎么办？</strong>
          会话会保留在服务器上，掉线的船长重新登录就能恢复；其离线期间无法与其聊天或互市成交，与其他船长仍可正常往来。
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
