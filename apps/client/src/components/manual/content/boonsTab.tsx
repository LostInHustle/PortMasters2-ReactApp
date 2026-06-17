import { useTranslate } from '../../../i18n/useTranslate.js';

// Ported verbatim from PortMasters2/PortMasters_online.html manualContentZh/manualContentEn
// (lines 3452-3685 / 3687-3920 respectively), the 'boons' key of each.
// Kept as two parallel JSX trees (one per language) rather than merged tr()-per-node, matching
// the original's own choice to duplicate full per-language content blocks for this prose --
// merging them would mean interleaving translation calls through dense paragraphs for no
// real benefit.
export function BoonsTab() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>
          🍀 Fortune Codex (the Navigator's Compass draws 4 at random each round, with each captain
          getting a different set; effects last one round)
        </h4>
        <table>
          <thead>
            <tr>
              <th>Fortune</th>
              <th>Effect</th>
              <th>Best moment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🌬️ Silk Road Tailwind</td>
              <td>Silk & product shipping halved</td>
              <td>Delivering many product orders this round</td>
            </tr>
            <tr>
              <td>🌊 Favorable Tides</td>
              <td>Base shipping −4 gold</td>
              <td>Many small deliveries planned</td>
            </tr>
            <tr>
              <td>✨ Merchant's Charm</td>
              <td>15% off purchases</td>
              <td>A big shopping round</td>
            </tr>
            <tr>
              <td>🔨 Artisan's Inspiration</td>
              <td>Every worker makes +1 item</td>
              <td>Pays off most with a large crew</td>
            </tr>
            <tr>
              <td>💰 Emergency Loan</td>
              <td>Gain 40 gold instantly</td>
              <td>A lifeline when bankruptcy looms</td>
            </tr>
            <tr>
              <td>📜 Tax Exemption</td>
              <td>Income tax drops to 5%</td>
              <td>Expecting big profits this round</td>
            </tr>
            <tr>
              <td>🧶 Hemp Monopoly</td>
              <td>Hemp Cloth −2 gold per unit</td>
              <td>Running a garb/tunic production line</td>
            </tr>
            <tr>
              <td>🎓 Apprentice Legacy</td>
              <td>Hiring wages halved</td>
              <td>Expanding the team this round</td>
            </tr>
            <tr>
              <td>
                🔮 Farsight
                <br />
                <span className="muted">New Maritime Edict · Round 6+</span>
              </td>
              <td>Gain 1 free Broker's Whisper clue this round</td>
              <td>Want to lock in a Trade phase order early</td>
            </tr>
            <tr>
              <td>
                🏮 Porcelain & Bronze Consortium
                <br />
                <span className="muted">New Maritime Edict · Round 6+</span>
              </td>
              <td>Celadon Porcelain and Bronze Mirror orders pay +15% this round</td>
              <td>Stockpiled Celadon Porcelain/Bronze Mirror ready to deliver</td>
            </tr>
            <tr>
              <td>
                🧾 Frontier Tariff Relief
                <br />
                <span className="muted">New Maritime Edict · Round 6+</span>
              </td>
              <td>VAT on finished goods deliveries is halved this round</td>
              <td>Planning to deliver lots of products this round</td>
            </tr>
            <tr>
              <td>
                💎 Treasures from Afar
                <br />
                <span className="muted">Ten Thousand Kingdoms Trade · Round 10+</span>
              </td>
              <td>Foreign Perfume Oil and Pearl Necklace orders pay +15% this round</td>
              <td>Stockpiled Foreign Perfume Oil/Pearl Necklace ready to deliver</td>
            </tr>
            <tr>
              <td>
                🛡️ Deep-Sea Escort Pact
                <br />
                <span className="muted">Ten Thousand Kingdoms Trade · Round 10+</span>
              </td>
              <td>Escort hiring costs half price and pirate risk is halved this round</td>
              <td>When the trade wind's pirate risk is high</td>
            </tr>
            <tr>
              <td>
                🛍️ Merchants Converge
                <br />
                <span className="muted">Ten Thousand Kingdoms Trade · Round 10+</span>
              </td>
              <td>1 extra order appears in the Trade phase this round</td>
              <td>Want more delivery opportunities</td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }
  return (
    <>
      <h4>
        🍀 福缘图鉴（每回合「航海家的罗盘」从下表随机抽 4 张供你选 1
        张；双方抽到的组合各不相同，仅当回合生效）
      </h4>
      <table>
        <thead>
          <tr>
            <th>福缘</th>
            <th>效果</th>
            <th>适合时机</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🌬️ 丝路顺风</td>
            <td>丝绸及成品运费减半</td>
            <td>本回合要交付大量成品订单</td>
          </tr>
          <tr>
            <td>🌊 顺风顺水</td>
            <td>基础运费减 4 金币</td>
            <td>要交付多笔小额订单</td>
          </tr>
          <tr>
            <td>✨ 商贾魅力</td>
            <td>采购 85 折</td>
            <td>本回合计划大量进货</td>
          </tr>
          <tr>
            <td>🔨 匠人灵感</td>
            <td>所有工人多产 1 件</td>
            <td>工匠团队规模较大时收益最高</td>
          </tr>
          <tr>
            <td>💰 紧急钱庄</td>
            <td>立即获得 40 金币</td>
            <td>现金紧张、濒临破产时的救命稻草</td>
          </tr>
          <tr>
            <td>📜 免税令</td>
            <td>所得税率降至 5%</td>
            <td>预计本回合利润很高</td>
          </tr>
          <tr>
            <td>🧶 麻布专营</td>
            <td>麻布采购单价 −2 金币</td>
            <td>主打麻衣/布衣生产线</td>
          </tr>
          <tr>
            <td>🎓 学徒传承</td>
            <td>雇佣工资减半</td>
            <td>本回合计划扩编工匠团队</td>
          </tr>
          <tr>
            <td>
              🔮 千里眼
              <br />
              <span className="muted">市舶新政 · 第6程起</span>
            </td>
            <td>本回合免费获得 1 条牙行密语线索</td>
            <td>想提前锁定贸易阶段订单</td>
          </tr>
          <tr>
            <td>
              🏮 陶铜联号
              <br />
              <span className="muted">市舶新政 · 第6程起</span>
            </td>
            <td>本回合「青瓷器」与「紫铜镜」订单报酬 +15%</td>
            <td>库存中已有大量青瓷器/紫铜镜待交付</td>
          </tr>
          <tr>
            <td>
              🧾 拓商减负
              <br />
              <span className="muted">市舶新政 · 第6程起</span>
            </td>
            <td>本回合交付成品订单的增值税减半</td>
            <td>本回合计划大量交付成品</td>
          </tr>
          <tr>
            <td>
              💎 蕃国奇珍
              <br />
              <span className="muted">万国通商 · 第10程起</span>
            </td>
            <td>本回合「蕃香脂」与「珠链」订单报酬 +15%</td>
            <td>库存中已有大量蕃香脂/珠链待交付</td>
          </tr>
          <tr>
            <td>
              🛡️ 远洋护航
              <br />
              <span className="muted">万国通商 · 第10程起</span>
            </td>
            <td>本回合雇佣护航费用减半，海盗风险减半</td>
            <td>季风海盗风险较高时</td>
          </tr>
          <tr>
            <td>
              🛍️ 万商云集
              <br />
              <span className="muted">万国通商 · 第10程起</span>
            </td>
            <td>本回合贸易阶段额外出现 1 张订单</td>
            <td>想要更多交付机会</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
