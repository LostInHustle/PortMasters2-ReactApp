import { useTranslate } from '../../../i18n/useTranslate.js';

// Split out of expansionTab.tsx (originally 663 lines, well past the file-size ceiling) to keep
// each manual-tab file within the project's soft 200 / hard 350 line discipline -- this tab's
// source content is unusually table-heavy (7 unlock-category tables), so it's split by category
// group rather than forced into one oversized file.
export function ExpansionUnlockWindsModules() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>🌬️ New Trade Winds</h4>
        <p>
          Beyond the original Spring Current, Summer Monsoon, Autumn Gales and Winter Blockade, 4
          new trade-wind states join the pool. From Round 3 on, each "season" (every 2 rounds) is{' '}
          <strong>drawn at random from the currently unlocked pool</strong> instead of a fixed 4
          season cycle, though Rounds 1 to 2 are still always Spring Current, exactly as before.
        </p>
        <table>
          <thead>
            <tr>
              <th>Trade Wind</th>
              <th>Unlocked by</th>
              <th>Effect summary</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🌫️ Min River Kiln-Smoke</td>
              <td>New Maritime Edict</td>
              <td>
                Fuzhou and Quanzhou orders pay more; Porcelain Clay is cheaper; pirate risk is
                moderate
              </td>
            </tr>
            <tr>
              <td>🌅 Goryeo Dawn Route</td>
              <td>New Maritime Edict</td>
              <td>
                Goryeo and Guangzhou orders pay more; Copper Ore is cheaper; pirate risk is elevated
              </td>
            </tr>
            <tr>
              <td>🌴 Srivijaya Spice Breeze</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>
                Srivijaya and Dashi orders pay more; Spices are cheaper; pirate risk is elevated
              </td>
            </tr>
            <tr>
              <td>🌙 Dashi Pearl Moon</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>
                Dashi and Srivijaya orders pay much more; Pearls are cheaper; pirate risk is highest
              </td>
            </tr>
          </tbody>
        </table>
        <h4>🔧 New Ship Modules</h4>
        <table>
          <thead>
            <tr>
              <th>Module</th>
              <th>Unlocked by</th>
              <th>Effect</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🎫 Trade Bureau Token</td>
              <td>New Maritime Edict</td>
              <td>
                Orders for new trade-route goods (Porcelain Clay, Copper Ore and their products) pay
                +10%
              </td>
            </tr>
            <tr>
              <td>🔥 Kiln Cellar</td>
              <td>New Maritime Edict</td>
              <td>Porcelain Clay and Copper Ore purchase price −2 gold per unit</td>
            </tr>
            <tr>
              <td>📡 Ocean-Going Interpreter</td>
              <td>New Maritime Edict</td>
              <td>Each Broker's Whisper purchase reveals 1 extra clue at no added cost</td>
            </tr>
            <tr>
              <td>🪪 Foreign Quarter Guild Pass</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>Spices and Pearls purchase price −3 gold per unit</td>
            </tr>
            <tr>
              <td>🧿 Persian Dome Compass</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>Pirate risk reduced by 30%</td>
            </tr>
            <tr>
              <td>⛵ Fleet of Ten-Thousand Treasures</td>
              <td>Ten Thousand Kingdoms Trade</td>
              <td>
                Shipping for Foreign Perfume Oil and Pearl Necklace is 3 gold cheaper per item
              </td>
            </tr>
          </tbody>
        </table>
        <div className="pm-banner" style={{ marginTop: '10px' }}>
          <span className="pm-icon">🗺️</span>
          <span>
            These additions arrive as banner announcements on the <strong>Set Sail</strong> page,
            so watch for them at the start of Round 6 and Round 10!
          </span>
        </div>
      </>
    );
  }
  return (
    <>
      <h4>🌬️ 新增季风（贸易风）</h4>
      <p>
        除原有的「春潮顺流」「盛夏季风」「秋汛乱流」「冬海封锁」外，新增 4 种季风状态。第 3
        程起，每个"季节"（每 2 回合一变）将从
        <strong>当时已解锁的季风池中随机抽取</strong>
        ，不再是固定的四季循环。不过第 1 至 2 程仍固定为「春潮顺流」，与最初版本完全一致。
      </p>
      <table>
        <thead>
          <tr>
            <th>季风</th>
            <th>解锁批次</th>
            <th>效果概要</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🌫️ 闽江窑烟</td>
            <td>市舶新政</td>
            <td>福州港、泉州港订单报酬提高；瓷土采购价降低；海盗风险中等</td>
          </tr>
          <tr>
            <td>🌅 高丽晓航</td>
            <td>市舶新政</td>
            <td>高丽港、广州港订单报酬提高；铜矿采购价降低；海盗风险较高</td>
          </tr>
          <tr>
            <td>🌴 三佛齐香风</td>
            <td>万国通商</td>
            <td>三佛齐港、大食港订单报酬提高；香料采购价降低；海盗风险较高</td>
          </tr>
          <tr>
            <td>🌙 大食珠月</td>
            <td>万国通商</td>
            <td>大食港、三佛齐港订单报酬大幅提高；珍珠采购价降低；海盗风险最高</td>
          </tr>
        </tbody>
      </table>
      <h4>🔧 新增战船改装</h4>
      <table>
        <thead>
          <tr>
            <th>改装</th>
            <th>解锁批次</th>
            <th>效果</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>🎫 市舶司令牌</td>
            <td>市舶新政</td>
            <td>新航线货品（瓷土、铜矿及其成品）订单收入 +10%</td>
          </tr>
          <tr>
            <td>🔥 陶土窖</td>
            <td>市舶新政</td>
            <td>瓷土与铜矿采购单价各降低 2 金币</td>
          </tr>
          <tr>
            <td>📡 远洋通译</td>
            <td>市舶新政</td>
            <td>牙行密语每次额外显示 1 条线索（不增加花费）</td>
          </tr>
          <tr>
            <td>🪪 蕃坊行会证</td>
            <td>万国通商</td>
            <td>香料与珍珠采购单价各降低 3 金币</td>
          </tr>
          <tr>
            <td>🧿 波斯穹顶罗盘</td>
            <td>万国通商</td>
            <td>海盗风险降低 30%</td>
          </tr>
          <tr>
            <td>⛵ 万宝商船</td>
            <td>万国通商</td>
            <td>「蕃香脂」与「珠链」每件运费降低 3 金币</td>
          </tr>
        </tbody>
      </table>
      <div className="pm-banner" style={{ marginTop: '10px' }}>
        <span className="pm-icon">🗺️</span>
        <span>
          这些新内容会在
          <strong>「启航」</strong>
          页以横幅公告的形式出现，记得留意第 6 程与第 10 程开局时的提示！
        </span>
      </div>
    </>
  );
}
