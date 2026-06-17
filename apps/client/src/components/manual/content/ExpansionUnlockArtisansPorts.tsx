import { useTranslate } from '../../../i18n/useTranslate.js';

// Split out of expansionTab.tsx (originally 663 lines, well past the file-size ceiling) to keep
// each manual-tab file within the project's soft 200 / hard 350 line discipline -- this tab's
// source content is unusually table-heavy (7 unlock-category tables), so it's split by category
// group rather than forced into one oversized file.
export function ExpansionUnlockArtisansPorts() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>👷 New Artisans</h4>
        <table>
          <thead>
            <tr>
              <th>Artisan</th>
              <th>Unlocked by</th>
              <th>Wage/round</th>
              <th>Crafts</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🪞 Coppersmith</td>
              <td>New Maritime Edict</td>
              <td>12 gold</td>
              <td>Bronze Mirror</td>
            </tr>
            <tr>
              <td>🏺 Potter</td>
              <td>New Maritime Edict</td>
              <td>14 gold</td>
              <td>Celadon Porcelain</td>
            </tr>
            <tr>
              <td>🧴 Perfumer</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>18 gold</td>
              <td>Foreign Perfume Oil (only source)</td>
            </tr>
            <tr>
              <td>📿 Jeweler</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>24 gold</td>
              <td>Pearl Necklace (only source)</td>
            </tr>
          </tbody>
        </table>
        <h4>⚓ New Ports</h4>
        <table>
          <thead>
            <tr>
              <th>Port</th>
              <th>Unlocked by</th>
              <th>Specialty</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Fuzhou</td>
              <td>New Maritime Edict</td>
              <td>A major source of Porcelain Clay and Celadon Porcelain</td>
            </tr>
            <tr>
              <td>Goryeo</td>
              <td>New Maritime Edict</td>
              <td>A cross-sea trade hub and the chief source of Copper Ore</td>
            </tr>
            <tr>
              <td>Srivijaya</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>The Southeast Asian crossroads for Spices and Pearls</td>
            </tr>
            <tr>
              <td>Dashi</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>A distant western market and a premium buyer of Spice and Pearl goods</td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }
  return (
    <>
      <h4>👷 新增工匠</h4>
      <table>
        <thead>
          <tr>
            <th>工匠</th>
            <th>解锁批次</th>
            <th>工资/回合</th>
            <th>可制作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🪞 铜匠</td>
            <td>市舶新政</td>
            <td>12 金币</td>
            <td>紫铜镜</td>
          </tr>
          <tr>
            <td>🏺 陶匠</td>
            <td>市舶新政</td>
            <td>14 金币</td>
            <td>青瓷器</td>
          </tr>
          <tr>
            <td>🧴 香料师</td>
            <td>万国通商</td>
            <td>18 金币</td>
            <td>蕃香脂（唯一来源）</td>
          </tr>
          <tr>
            <td>📿 珠宝匠</td>
            <td>万国通商</td>
            <td>24 金币</td>
            <td>珠链（唯一来源）</td>
          </tr>
        </tbody>
      </table>
      <h4>⚓ 新增港口</h4>
      <table>
        <thead>
          <tr>
            <th>港口</th>
            <th>解锁批次</th>
            <th>特色</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>福州港</td>
            <td>市舶新政</td>
            <td>瓷土与青瓷器的重要产地</td>
          </tr>
          <tr>
            <td>高丽港</td>
            <td>市舶新政</td>
            <td>跨海贸易枢纽，铜矿的主要来源</td>
          </tr>
          <tr>
            <td>三佛齐港</td>
            <td>万国通商</td>
            <td>南洋香料与珍珠的转运枢纽</td>
          </tr>
          <tr>
            <td>大食港</td>
            <td>万国通商</td>
            <td>遥远的西方市场，香料与珍珠制品的高价买家</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
