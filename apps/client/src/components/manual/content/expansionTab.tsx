import { useTranslate } from '../../../i18n/useTranslate.js';
import { ExpansionUnlockArtisansPorts } from './ExpansionUnlockArtisansPorts.js';
import { ExpansionUnlockGoods } from './ExpansionUnlockGoods.js';
import { ExpansionUnlockWindsModules } from './ExpansionUnlockWindsModules.js';

// Ported verbatim from PortMasters2/PortMasters_online.html manualContentZh/manualContentEn
// (lines 3452-3685 / 3687-3920 respectively), the 'expansion' key of each. The bulk of this
// tab's original content (7 unlock-category tables) lives in ExpansionUnlock* sub-components
// (see those files for why); this component keeps only the difficulty-modes intro and composes
// the rest in the original's exact section order.
export function ExpansionTab() {
  const { lang } = useTranslate();
  if (lang === 'en') {
    return (
      <>
        <h4>⚖️ Difficulty Modes</h4>
        <p>
          Every session is played at one of three difficulties that form a ladder, and it always
          starts on <strong>Easy</strong> by default. <strong>Easy mode</strong> is the shorter 8
          round voyage and keeps the whole game on the founding set of goods, with only the three
          raw materials Hemp Cloth, Silk and Tea, the four starter products, the first three
          artisan guilds, and the fortunes, ship modules, ports and trade winds tied to them. The
          board never grows crowded, so you have plenty of room to learn the rhythm of each round
          at your own pace. <strong>Standard mode</strong> is the 12 round middle rung: it also
          opens the full trade, with the Silk Road Charter unlocking at Rounds 4 and 8, but with no
          corrupt brokers. <strong>Hard mode</strong> is the longer 16 round voyage that opens the
          full maritime trade with the charter unlocking at Rounds 6 and 10 and the corrupt-broker
          hazard switched on, so there is a great deal more to manage and the competition for cargo
          space and coin grows much fiercer. The phased unlocks below happen on Standard and Hard
          but never on Easy. Raids bite harder as you climb the ladder too: a successful raid takes
          a share of your current gold (a larger share later in the voyage and on higher
          difficulties) and the escort fee scales with your wealth as well; and on Hard a Broker's
          Whisper can come from a corrupt broker who tips off pirates and raises that voyage's raid
          chance, turning the escort call at Upkeep into a genuine trade-off.
        </p>
        <p>
          The difficulty is settled before a voyage begins. The inviting captain chooses the level
          for the session, and the other captain sees a short explanation of what it changes in the
          confirmation window and agrees to it, so both captains always run the same voyage at the
          same difficulty.
        </p>
        <div className="pm-banner" style={{ margin: '8px 0 4px' }}>
          <span className="pm-icon">⚖️</span>
          <span>
            The phased unlock tables below use <strong>Hard mode</strong> (Rounds 6 and 10) as the
            example. <strong>Standard mode</strong> unlocks the same content earlier (Rounds 4 and
            8); <strong>Easy mode</strong> stays on the founding set named above for the entire
            game and these expansions never arrive.
          </span>
        </div>
        <ExpansionUnlockGoods />
        <ExpansionUnlockArtisansPorts />
        <ExpansionUnlockWindsModules />
      </>
    );
  }
  return (
    <>
      <h4>⚖️ 难度模式</h4>
      <p>
        每一局会在三档难度之一下进行，构成由易到难的阶梯，默认始终是
        <strong>轻松</strong>。<strong>轻松模式</strong>共 8
        个回合，让整段航程都停留在基础货物之内，只包含麻布、丝绸、茶叶三种原料、四种入门成品、前三类工匠，以及与之相关的福缘、战船改装、港口和季风。棋盘始终不会过度拥挤，你有充足的余裕慢慢熟悉每个回合的节奏。
        <strong>标准模式</strong>共 12 个回合，是中间一档：同样开放完整贸易，丝路特许在第 4、8
        程分批解锁，但不会出现暗通海盗的牙行。
        <strong>高难模式</strong>共 16 个回合，开放完整的海上贸易并加入可疑牙行机制，丝路特许在第
        6、10
        程分批解锁，需要打理的事务多得多，对舱位与金币的竞争也激烈许多。下文「丝路特许」的分批解锁在标准与高难模式中都会发生，轻松模式则不会。海盗机制对所有难度都已加强：海盗一旦得手会掠走当前财富的一定比例（越往后、难度越高比例越大），雇佣护航的费用也随财富浮动；在高难模式中，购买牙行密语还可能遇到可疑牙行暗通海盗、抬高本程袭扰概率，让结算阶段是否雇佣护航成为真正的取舍。
      </p>
      <p>
        难度在航程开始前就已商定。发出邀请的一方先选择本局难度，对方会在确认窗口看到一段说明，了解它会改变什么之后再同意，所以两位船长始终在同一难度下经营同一段航程。
      </p>
      <div className="pm-banner" style={{ margin: '8px 0 4px' }}>
        <span className="pm-icon">⚖️</span>
        <span>
          下面这份分批解锁清单以
          <strong>高难模式</strong>
          （第 6、10 程）为例。
          <strong>标准模式</strong>
          解锁的内容相同，只是更早到来（第 4、8 程）；
          <strong>轻松模式</strong>
          则全程停留在基础内容，这些扩展不会出现。
        </span>
      </div>
      <ExpansionUnlockGoods />
      <ExpansionUnlockArtisansPorts />
      <ExpansionUnlockWindsModules />
    </>
  );
}
