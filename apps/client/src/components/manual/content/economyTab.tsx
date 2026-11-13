import { useTranslate } from '../../../i18n/useTranslate.js';

// Mirrors the "economy" section of the manual content in PortMasters2/PortMasters_online.html.
// Kept as two parallel JSX trees, one per language, rather than one merged tree with a
// translation call per node. The original also duplicates full content blocks per language for
// this prose, since merging them would mean interleaving translation calls through dense
// paragraphs for no real benefit.
export function EconomyTab() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>💸 The Four Expenses to Watch</h4>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>How it's computed</th>
              <th>When it's paid</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>📦 Shipping</td>
              <td>max(5, items ×2 − ship level ×5 − fortune discounts)</td>
              <td>On every order delivery</td>
            </tr>
            <tr>
              <td>🧾 VAT</td>
              <td>(sale price − avg. material cost − labor) × 5%</td>
              <td>
                Deducted automatically on <strong>product</strong> orders
              </td>
            </tr>
            <tr>
              <td>📜 Income tax</td>
              <td>Round net profit × 10% (5% with Tax Exemption)</td>
              <td>Deducted automatically at round end</td>
            </tr>
            <tr>
              <td>🔧 Upkeep</td>
              <td>Flat 15 gold/round</td>
              <td>
                Paid manually at Upkeep; <strong>failing means bankruptcy</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <h4>💰 Income Sources</h4>
        <ul>
          <li>
            <strong>Material orders</strong>: reward = demand ×5 + 10 to 25 variance; low effort,
            thin margins.
          </li>
          <li>
            <strong>Product orders</strong>: settled at market price (Hemp Garb 30 to 42 / Cloth
            Tunic 50 to 65 / Fine Brocade 70 to 90 / Sachet 95 to 120), and remain your main profit
            source even after VAT.
          </li>
          <li>
            <strong>Barter</strong>: strike good deals with the other captains to cover each other's
            gaps.
          </li>
        </ul>
        <h4>📈 Buying Tip</h4>
        <p>
          Hemp Cloth, Silk and Tea cost the following per unit. Home ports charge 1 gold below the
          base range; other ports charge 1 gold above it.
        </p>
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Home ports</th>
              <th>Unit price at home ports</th>
              <th>Unit price elsewhere</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🧶 Hemp Cloth</td>
              <td>Quanzhou, Ningbo</td>
              <td>2 to 5 gold</td>
              <td>4 to 7 gold</td>
            </tr>
            <tr>
              <td>👘 Silk</td>
              <td>Hangzhou, Yangzhou</td>
              <td>5 to 9 gold</td>
              <td>7 to 11 gold</td>
            </tr>
            <tr>
              <td>🍵 Tea</td>
              <td>Guangzhou, Quanzhou</td>
              <td>9 to 13 gold</td>
              <td>11 to 15 gold</td>
            </tr>
          </tbody>
        </table>
        <p>
          Monsoons, fortunes and ship modules can move the price further; the supply card always
          prints the final per unit price, so compare before you buy.
        </p>
      </>
    );
  }
  return (
    <>
      <h4>💸 四大支出，务必牢记</h4>
      <table>
        <thead>
          <tr>
            <th>项目</th>
            <th>计算方式</th>
            <th>何时支付</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>📦 运费</td>
            <td>件数×2 − 船级×5 − 福缘减免，最低 5 金币</td>
            <td>每次交付订单时</td>
          </tr>
          <tr>
            <td>🧾 增值税</td>
            <td>(售价 − 材料均价成本 − 人工) × 5%</td>
            <td>
              交付
              <strong>成品</strong>
              订单时自动扣除
            </td>
          </tr>
          <tr>
            <td>📜 所得税</td>
            <td>回合净利润 × 10%（免税令时 5%）</td>
            <td>每回合结束自动扣除</td>
          </tr>
          <tr>
            <td>🔧 维护费</td>
            <td>固定 15 金币/回合</td>
            <td>
              结算阶段手动支付，
              <strong>付不起即破产</strong>
            </td>
          </tr>
        </tbody>
      </table>
      <h4>💰 收入来源</h4>
      <ul>
        <li>
          <strong>原料订单</strong>
          ：报酬 = 需求量×5 + 10~25 浮动，门槛低利润薄。
        </li>
        <li>
          <strong>成品订单</strong>
          ：按成品市价结算（麻衣 30~42 / 布衣 50~65 / 绫罗绸缎 70~90 / 香囊
          95~120），扣增值税后仍是主要利润来源。
        </li>
        <li>
          <strong>互市</strong>
          ：和其他船长谈个好价钱，互补短板。
        </li>
      </ul>
      <h4>📈 采购小窍门</h4>
      <p>
        麻布、丝绸、茶叶的每单位价格见下表。特产港比基础价低 1 金币，其他港口比基础价高 1 金币。
      </p>
      <table>
        <thead>
          <tr>
            <th>原料</th>
            <th>特产港</th>
            <th>特产港单价</th>
            <th>其他港口单价</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🧶 麻布</td>
            <td>泉州港、宁波港</td>
            <td>2~5 金币</td>
            <td>4~7 金币</td>
          </tr>
          <tr>
            <td>👘 丝绸</td>
            <td>杭州港、扬州港</td>
            <td>5~9 金币</td>
            <td>7~11 金币</td>
          </tr>
          <tr>
            <td>🍵 茶叶</td>
            <td>广州港、泉州港</td>
            <td>9~13 金币</td>
            <td>11~15 金币</td>
          </tr>
        </tbody>
      </table>
      <p>季风、福缘与船舶模块还会进一步改变单价；进货卡上标出的价格才是最终价，对比后再买。</p>
    </>
  );
}
