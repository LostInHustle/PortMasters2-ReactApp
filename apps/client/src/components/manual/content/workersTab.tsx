import { useTranslate } from '../../../i18n/useTranslate.js';

// Ported verbatim from PortMasters2/PortMasters_online.html manualContentZh/manualContentEn
// (lines 3452-3685 / 3687-3920 respectively), the 'workers' key of each.
// Kept as two parallel JSX trees (one per language) rather than merged tr()-per-node, matching
// the original's own choice to duplicate full per-language content blocks for this prose --
// merging them would mean interleaving translation calls through dense paragraphs for no
// real benefit.
export function WorkersTab() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>👥 The Three Artisans</h4>
        <table>
          <thead>
            <tr>
              <th>Artisan</th>
              <th>Wage/round</th>
              <th>Crafts</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>👩‍🔧 Weaver</td>
              <td>8 gold</td>
              <td>Hemp Garb, Cloth Tunic</td>
            </tr>
            <tr>
              <td>👩‍🎨 Master Weaver</td>
              <td>12 gold</td>
              <td>Hemp Garb, Cloth Tunic, Fine Brocade</td>
            </tr>
            <tr>
              <td>🌸 Sachet Maker</td>
              <td>20 gold</td>
              <td>Scented Sachet (only source)</td>
            </tr>
          </tbody>
        </table>
        <h4>🧵 Recipes & Values</h4>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Materials</th>
              <th>Base value</th>
              <th>Market range</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>👔 Hemp Garb</td>
              <td>Hemp Cloth ×2</td>
              <td>15</td>
              <td>30 to 42</td>
            </tr>
            <tr>
              <td>👕 Cloth Tunic</td>
              <td>Hemp Cloth ×2 + Silk ×1</td>
              <td>35</td>
              <td>50 to 65</td>
            </tr>
            <tr>
              <td>👗 Fine Brocade</td>
              <td>Silk ×3</td>
              <td>60</td>
              <td>70 to 90</td>
            </tr>
            <tr>
              <td>🌸 Scented Sachet</td>
              <td>Silk ×1 + Tea ×2</td>
              <td>80</td>
              <td>95 to 120</td>
            </tr>
          </tbody>
        </table>
        <h4>⚙️ Production Rules</h4>
        <ul>
          <li>
            Assigning a task
            <strong>consumes materials immediately</strong>; the product arrives at
            <strong>Upkeep</strong>
            and can be sold from the next round.
          </li>
          <li>
            Each artisan takes one task per round; regular artisans make 1 item,
            <strong>skilled ⭐</strong>
            ones (auto-promoted after 2 lifetime items) make 2.
          </li>
          <li>
            Wages are paid automatically at Upkeep, so
            <strong>running out of cash means bankruptcy</strong>; do the math before expanding.
          </li>
          <li>
            Dismissing an idle artisan costs one wage as severance; busy artisans can't be
            dismissed.
          </li>
        </ul>
      </>
    );
  }
  return (
    <>
      <h4>👥 三类工匠</h4>
      <table>
        <thead>
          <tr>
            <th>工匠</th>
            <th>工资/回合</th>
            <th>可制作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>👩‍🔧 织女</td>
            <td>8 金币</td>
            <td>麻衣、布衣</td>
          </tr>
          <tr>
            <td>👩‍🎨 纺织大师</td>
            <td>12 金币</td>
            <td>麻衣、布衣、绫罗绸缎</td>
          </tr>
          <tr>
            <td>🌸 香囊师</td>
            <td>20 金币</td>
            <td>香囊（唯一来源）</td>
          </tr>
        </tbody>
      </table>
      <h4>🧵 生产配方与产值</h4>
      <table>
        <thead>
          <tr>
            <th>成品</th>
            <th>所需材料</th>
            <th>基准产值</th>
            <th>市价区间</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>👔 麻衣</td>
            <td>麻布×2</td>
            <td>15</td>
            <td>30 - 42</td>
          </tr>
          <tr>
            <td>👕 布衣</td>
            <td>麻布×2 + 丝绸×1</td>
            <td>35</td>
            <td>50 - 65</td>
          </tr>
          <tr>
            <td>👗 绫罗绸缎</td>
            <td>丝绸×3</td>
            <td>60</td>
            <td>70 - 90</td>
          </tr>
          <tr>
            <td>🌸 香囊</td>
            <td>丝绸×1 + 茶叶×2</td>
            <td>80</td>
            <td>95 - 120</td>
          </tr>
        </tbody>
      </table>
      <h4>⚙️ 生产规则</h4>
      <ul>
        <li>
          分配任务时
          <strong>立即扣除材料</strong>
          ；成品在本回合
          <strong>结算阶段</strong>
          入库，下回合才能卖。
        </li>
        <li>
          每名工匠每回合只能接一个任务；普通工匠产 1 件，
          <strong>熟练⭐</strong>
          （累计产出≥2件后自动晋升）产 2 件。
        </li>
        <li>
          工资在结算阶段自动支付，
          <strong>现金不足会直接破产</strong>
          ，扩张团队前请先算好账。
        </li>
        <li>解雇空闲工匠需支付一次工资作遣散费；生产中的工匠不能解雇。</li>
      </ul>
    </>
  );
}
