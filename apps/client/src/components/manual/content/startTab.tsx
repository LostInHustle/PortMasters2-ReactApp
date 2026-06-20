import { useTranslate } from '../../../i18n/useTranslate.js';
import { pm1Url } from '../../../i18n/pm1Links.js';

// Ported verbatim from PortMasters2/PortMasters_online.html manualContentZh/manualContentEn
// (lines 3452-3685 / 3687-3920 respectively), the 'start' key of each.
// Kept as two parallel JSX trees (one per language) rather than merged tr()-per-node, matching
// the original's own choice to duplicate full per-language content blocks for this prose --
// merging them would mean interleaving translation calls through dense paragraphs for no
// real benefit.
export function StartTab() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>🎯 Objective</h4>
        <p>
          You and your partner each run a maritime trading fleet. Over the voyage (
          <strong>8 rounds on Easy, 12 on Standard, 16 on Hard</strong>
          ), build <strong>renown</strong> through the buy low → produce → sell high loop. Renown
          is the net profit of every
          delivered order; your final rating depends on it. You start with 100 gold and a small
          stock of materials.
        </p>
        <p className="muted">
          Every session has Easy, Standard and Hard difficulties forming a ladder, and the default
          is Easy. The level is settled at invite time: the inviting captain picks it and the other
          confirms it in a short window. Easy mode keeps to the founding set of goods and is the
          gentler place to start; see the "Difficulty & Expansion" section for exactly what changes
          between them.
        </p>
        <h4>🧭 Your First Voyage (recommended route)</h4>
        <ol>
          <li>
            <strong>Fortune</strong>: in round 1, Emergency Loan (+40 gold) or Merchant's Charm (15%
            off purchases) eases the early cash crunch.
          </li>
          <li>
            <strong>Procure</strong>: buy cheap Hemp Cloth and Silk, since they're your crafting
            inputs. Leave cash for wages and the 15 gold upkeep.
          </li>
          <li>
            <strong>Barter</strong>: trade surpluses with your partner early, for example spare Tea
            for their Silk.
          </li>
          <li>
            <strong>Artisans</strong>: hire 1 Weaver (8 gold/round) for Hemp Garb or Cloth Tunics;
            keep the payroll small.
          </li>
          <li>
            <strong>Trade</strong>: deliver orders marked ✅ in-stock whose reward beats the
            shipping cost.
          </li>
          <li>
            <strong>Upkeep / Shipyard</strong>: pay upkeep; only upgrade the ship once cash is
            comfortable.
          </li>
        </ol>
        <h4>⚖️ Core Principles</h4>
        <ul>
          <li>
            <strong>Cash flow first</strong>: failing to pay wages and upkeep means instant
            bankruptcy, which is far worse than earning a little less.
          </li>
          <li>
            <strong>Products beat raw goods</strong>: a Sachet has a base value of 80, while
            flipping raw materials nets single digits.
          </li>
          <li>
            <strong>Stay in sync</strong>: every phase needs both captains to confirm, so use chat
            (💬) to keep the pace.
          </li>
        </ul>
        <div className="pm-banner" style={{ marginTop: '10px' }}>
          <span className="pm-icon">🧭</span>
          <span>
            <strong>This is PortMasters 2</strong>, and the learning curve is steep. If it feels
            overwhelming, warm up with{' '}
            <a href={pm1Url(lang)} target="_blank" rel="noopener">
              PortMasters 1 →
            </a>{' '}
            and come back.
          </span>
        </div>
      </>
    );
  }
  return (
    <>
      <h4>🎯 游戏目标</h4>
      <p>
        你与伙伴各自经营一支海上商队，在整段航程（
        <strong>轻松 8 回合、标准 12 回合、高难 16 回合</strong>
        ）内通过「低买 → 生产 → 高卖」积累
        <strong>声望（信誉值）</strong>
        。声望来自每笔订单的净利润，游戏结束时按声望评级。开局资金 100 金币，并自带少量原料。
      </p>
      <p className="muted">
        每一局有轻松、标准、高难三档难度，构成由易到难的阶梯，默认是轻松。难度在邀请时商定：发出邀请的一方选择，另一方在确认窗口看过说明并同意后开局。轻松只包含基础货物，更适合新手起步；想了解各档难度的差别，可查看「难度与拓展」一节。
      </p>
      <h4>🧭 第一程怎么玩（推荐路线）</h4>
      <ol>
        <li>
          <strong>福缘</strong>
          ：第一程建议选「紧急钱庄」（+40金币）或「商贾魅力」（采购85折），缓解开局现金压力。
        </li>
        <li>
          <strong>采购</strong>
          ：优先买便宜的麻布、丝绸，它们是生产原料。注意给工资和 15 金币维护费留出现金。
        </li>
        <li>
          <strong>互市</strong>
          ：开局可与伙伴互通有无，比如用富余茶叶换对方丝绸。
        </li>
        <li>
          <strong>工匠</strong>
          ：先雇 1 名织女（8金币/回合）做麻衣或布衣，控制工资规模。
        </li>
        <li>
          <strong>贸易</strong>
          ：优先交付「✅ 库存齐全」且报酬高于运费的订单。
        </li>
        <li>
          <strong>结算 / 船坞</strong>
          ：付维护费；现金充裕再考虑升船。
        </li>
      </ol>
      <h4>⚖️ 核心原则</h4>
      <ul>
        <li>
          <strong>现金流第一</strong>
          ：工资 + 维护费付不起就直接破产，比少赚钱严重得多。
        </li>
        <li>
          <strong>成品利润远高于原料</strong>
          ：香囊基准产值 80，原料转手只有个位数差价。
        </li>
        <li>
          <strong>双人同步</strong>
          ：每个阶段都需双方确认才推进，多用聊天（💬）协调节奏。
        </li>
      </ul>
      <div className="pm-banner" style={{ marginTop: '10px' }}>
        <span className="pm-icon">🧭</span>
        <span>
          <strong>本作为 PortMasters 2</strong>
          ，上手门槛较高。若感到吃力，建议先体验上一代
          <a href={pm1Url(lang)} target="_blank" rel="noopener">
            PortMasters 1（中文版）→
          </a>
          ，熟悉基础玩法后再回来。
        </span>
      </div>
    </>
  );
}
