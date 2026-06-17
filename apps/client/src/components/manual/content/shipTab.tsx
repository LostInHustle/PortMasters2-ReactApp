import { useTranslate } from '../../../i18n/useTranslate.js';

// Ported verbatim from PortMasters2/PortMasters_online.html manualContentZh/manualContentEn
// (lines 3452-3685 / 3687-3920 respectively), the 'ship' key of each.
// Kept as two parallel JSX trees (one per language) rather than merged tr()-per-node, matching
// the original's own choice to duplicate full per-language content blocks for this prose --
// merging them would mean interleaving translation calls through dense paragraphs for no
// real benefit.
export function ShipTab() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>🚢 Ship Upgrades (Shipyard phase)</h4>
        <table>
          <thead>
            <tr>
              <th>Upgrade</th>
              <th>Cost</th>
              <th>Cumulative effect</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Lv.0 → Lv.1</td>
              <td>15 gold</td>
              <td>Shipping −5/order · 1 module slot</td>
            </tr>
            <tr>
              <td>Lv.1 → Lv.2</td>
              <td>25 gold</td>
              <td>Shipping −10/order · 2 module slots</td>
            </tr>
            <tr>
              <td>Lv.2 → Lv.3</td>
              <td>40 gold</td>
              <td>Shipping −15/order · 3 module slots</td>
            </tr>
          </tbody>
        </table>
        <ul>
          <li>Shipping never drops below 5 gold (certain fortunes/modules can push it to 0).</li>
          <li>
            Upgrades are a<strong>permanent investment</strong>: the more orders you deliver, the
            faster they pay off. Aim for Lv.1–2 around rounds 2–4.
          </li>
          <li>
            Late upgrades in the final round or two rarely pay for themselves, so keep that gold for
            stock instead.
          </li>
          <li>
            Once a slot is unlocked you can "Choose Ship Modules" at the Shipyard. Each round's 3
            options are
            <strong>fixed</strong>
            (closing and reopening shows the same batch), and you get one
            <strong>Change Batch</strong>
            reroll per round.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h4>🚢 商船升级（船坞阶段）</h4>
      <table>
        <thead>
          <tr>
            <th>升级</th>
            <th>费用</th>
            <th>累计效果</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Lv.0 → Lv.1</td>
            <td>15 金币</td>
            <td>每单运费 −5 · 1 个模块槽</td>
          </tr>
          <tr>
            <td>Lv.1 → Lv.2</td>
            <td>25 金币</td>
            <td>每单运费 −10 · 2 个模块槽</td>
          </tr>
          <tr>
            <td>Lv.2 → Lv.3</td>
            <td>40 金币</td>
            <td>每单运费 −15 · 3 个模块槽</td>
          </tr>
        </tbody>
      </table>
      <ul>
        <li>运费下限为 5 金币（部分福缘/模块可降至 0）。</li>
        <li>
          升级是
          <strong>永久投资</strong>
          ：交付订单越频繁，回本越快。一般建议第 2~4 程内升至 Lv.1~2。
        </li>
        <li>临近尾声的最后一两程再升级往往回不了本，把现金留给进货更划算。</li>
        <li>
          升级解锁槽位后，可在船坞「选择船舶模块」。每回合的 3 个候选
          <strong>固定不变</strong>
          ，关闭再打开仍是同一批；每回合可用一次
          <strong>「换一批」</strong>
          重新抽取。
        </li>
      </ul>
    </>
  );
}
