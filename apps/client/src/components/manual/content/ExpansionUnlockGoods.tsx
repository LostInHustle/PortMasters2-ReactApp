import { useTranslate } from '../../../i18n/useTranslate.js';

// Split out of expansionTab.tsx (originally 663 lines, well past the file-size ceiling) to keep
// each manual-tab file within the project's soft 200 / hard 350 line discipline -- this tab's
// source content is unusually table-heavy (7 unlock-category tables), so it's split by category
// group rather than forced into one oversized file.
export function ExpansionUnlockGoods() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>🗺️ Silk Road Charter: Phased Unlocks (Hard mode)</h4>
        <p>
          Rounds 1 to 5 play exactly like the original release, with 3 raw materials, 4 products, 3
          artisan types and 5 ports. From <strong>Round 6</strong>, the "New Maritime Edict" takes
          effect; from <strong>Round 10</strong>, "Ten Thousand Kingdoms Trade" opens. Each wave
          adds new
          resources, products, ports, artisans, fortunes, ship modules and trade winds to the pools
          you draw from, so the later the voyage, the wider the board. As the waves arrive, the
          hands you pick from in the buying and trade phases grow too, going from 5 cards to 8 once
          the first wave opens at Round 6 and to 11 once the second opens at Round 10, so the new
          goods always have room to appear.
        </p>
        <table>
          <thead>
            <tr>
              <th>Wave</th>
              <th>Unlocks at</th>
              <th>What's added</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🗺️ New Maritime Edict</td>
              <td>Round 6</td>
              <td>
                Porcelain Clay, Copper Ore, Bronze Mirror, Celadon Porcelain; Fuzhou, Goryeo;
                Coppersmith, Potter; 3 Fortunes + 3 ship modules + 2 trade winds
              </td>
            </tr>
            <tr>
              <td>🌏 Ten Thousand Kingdoms Trade</td>
              <td>Round 10</td>
              <td>
                Spices, Pearls, Foreign Perfume Oil, Pearl Necklace; Srivijaya, Dashi; Perfumer,
                Jeweler; 3 Fortunes + 3 ship modules + 2 trade winds
              </td>
            </tr>
          </tbody>
        </table>
        <h4>📦 New Resources</h4>
        <table>
          <thead>
            <tr>
              <th>Resource</th>
              <th>Unlocked by</th>
              <th>Home ports</th>
              <th>Reference price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🧱 Porcelain Clay</td>
              <td>New Maritime Edict</td>
              <td>Quanzhou, Fuzhou</td>
              <td>8 to 12</td>
            </tr>
            <tr>
              <td>⛏️ Copper Ore</td>
              <td>New Maritime Edict</td>
              <td>Guangzhou, Goryeo</td>
              <td>10 to 15</td>
            </tr>
            <tr>
              <td>🌶️ Spices</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>Srivijaya, Dashi</td>
              <td>14 to 20</td>
            </tr>
            <tr>
              <td>🦪 Pearls</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>Guangzhou, Srivijaya</td>
              <td>16 to 24</td>
            </tr>
          </tbody>
        </table>
        <h4>🏺 New Products</h4>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Unlocked by</th>
              <th>Materials</th>
              <th>Base value</th>
              <th>Market range</th>
              <th>Crafted by</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🪞 Bronze Mirror</td>
              <td>New Maritime Edict</td>
              <td>Copper Ore ×3</td>
              <td>45</td>
              <td>55 to 72</td>
              <td>Coppersmith</td>
            </tr>
            <tr>
              <td>🏺 Celadon Porcelain</td>
              <td>New Maritime Edict</td>
              <td>Porcelain Clay ×3</td>
              <td>65</td>
              <td>78 to 100</td>
              <td>Potter</td>
            </tr>
            <tr>
              <td>🧴 Foreign Perfume Oil</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>Spices ×2 + Silk ×1</td>
              <td>85</td>
              <td>100 to 130</td>
              <td>Perfumer</td>
            </tr>
            <tr>
              <td>📿 Pearl Necklace</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>Pearls ×2 + Silk ×1</td>
              <td>105</td>
              <td>125 to 160</td>
              <td>Jeweler</td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }
  return (
    <>
      <h4>🗺️ 丝路特许：分批解锁（高难模式）</h4>
      <p>
        第 1 至 5 程的玩法与最初版本完全一致，包含 3 种原料、4 种成品、3 类工匠、5 座港口。从
        <strong>第 6 程</strong>
        起，「市舶新政」颁布；从
        <strong>第 10 程</strong>
        起，「万国通商」开启。两批新内容会分别加入原料、成品、港口、工匠、福缘、战船改装与季风的可选池，航路越往后，棋盘也就越宽。随着新内容解锁，采购阶段与贸易阶段可挑选的卡牌也会相应增多：基础为
        5 张，第 6 程起增至 8 张，第 10 程起增至 11 张，让新货物有充足的出现机会。
      </p>
      <table>
        <thead>
          <tr>
            <th>批次</th>
            <th>解锁时机</th>
            <th>新增内容概览</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🗺️ 市舶新政</td>
            <td>第 6 程起</td>
            <td>
              瓷土、铜矿、紫铜镜、青瓷器；福州港、高丽港；铜匠、陶匠；3 福缘 + 3 战船改装 + 2 季风
            </td>
          </tr>
          <tr>
            <td>🌏 万国通商</td>
            <td>第 10 程起</td>
            <td>
              香料、珍珠、蕃香脂、珠链；三佛齐港、大食港；香料师、珠宝匠；3 福缘 + 3 战船改装 + 2
              季风
            </td>
          </tr>
        </tbody>
      </table>
      <h4>📦 新增原料</h4>
      <table>
        <thead>
          <tr>
            <th>原料</th>
            <th>解锁批次</th>
            <th>特产港</th>
            <th>参考单价</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🧱 瓷土</td>
            <td>市舶新政</td>
            <td>泉州港、福州港</td>
            <td>8 - 12</td>
          </tr>
          <tr>
            <td>⛏️ 铜矿</td>
            <td>市舶新政</td>
            <td>广州港、高丽港</td>
            <td>10 - 15</td>
          </tr>
          <tr>
            <td>🌶️ 香料</td>
            <td>万国通商</td>
            <td>三佛齐港、大食港</td>
            <td>14 - 20</td>
          </tr>
          <tr>
            <td>🦪 珍珠</td>
            <td>万国通商</td>
            <td>广州港、三佛齐港</td>
            <td>16 - 24</td>
          </tr>
        </tbody>
      </table>
      <h4>🏺 新增成品</h4>
      <table>
        <thead>
          <tr>
            <th>成品</th>
            <th>解锁批次</th>
            <th>所需材料</th>
            <th>基准产值</th>
            <th>市价区间</th>
            <th>制作工匠</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🪞 紫铜镜</td>
            <td>市舶新政</td>
            <td>铜矿×3</td>
            <td>45</td>
            <td>55 - 72</td>
            <td>铜匠</td>
          </tr>
          <tr>
            <td>🏺 青瓷器</td>
            <td>市舶新政</td>
            <td>瓷土×3</td>
            <td>65</td>
            <td>78 - 100</td>
            <td>陶匠</td>
          </tr>
          <tr>
            <td>🧴 蕃香脂</td>
            <td>万国通商</td>
            <td>香料×2 + 丝绸×1</td>
            <td>85</td>
            <td>100 - 130</td>
            <td>香料师</td>
          </tr>
          <tr>
            <td>📿 珠链</td>
            <td>万国通商</td>
            <td>珍珠×2 + 丝绸×1</td>
            <td>105</td>
            <td>125 - 160</td>
            <td>珠宝匠</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
