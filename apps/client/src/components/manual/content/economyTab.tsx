import { useTranslate } from '../../../i18n/useTranslate.js';

// Ported verbatim from PortMasters2/PortMasters_online.html manualContentZh/manualContentEn
// (lines 3452-3685 / 3687-3920 respectively), the 'economy' key of each.
// Kept as two parallel JSX trees (one per language) rather than merged tr()-per-node, matching
// the original's own choice to duplicate full per-language content blocks for this prose --
// merging them would mean interleaving translation calls through dense paragraphs for no
// real benefit.
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
                Deducted automatically on
                <strong>product</strong>
                orders
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
                Paid manually at Upkeep;
                <strong>failing means bankruptcy</strong>
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
            <strong>Barter</strong>: strike good deals with your partner to cover each other's gaps.
          </li>
        </ul>
        <h4>📈 Buying Tip</h4>
        <p>
          Every material has home ports (Hemp Cloth: Quanzhou/Ningbo; Silk: Hangzhou/Yangzhou; Tea:
          Guangzhou/Quanzhou) where unit prices run about 1 gold lower. Ports and prices are printed
          on each supply card, so compare before you buy.
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
            <td>max(5, 件数×2 − 船级×5 − 福缘减免)</td>
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
          ：按成品市价结算（麻衣 30-42 / 布衣 50-65 / 绫罗绸缎 70-90 / 香囊 95 到
          120），扣增值税后仍是主要利润来源。
        </li>
        <li>
          <strong>互市</strong>
          ：和伙伴谈个好价钱，互补短板。
        </li>
      </ul>
      <h4>📈 采购小窍门</h4>
      <p>
        每种原料都有特产港（麻布：泉州/宁波；丝绸：杭州/扬州；茶叶：广州/泉州），特产港进货单价低 1
        金币上下；进货卡上的港口与价格都已列明，对比后再买。
      </p>
    </>
  );
}
