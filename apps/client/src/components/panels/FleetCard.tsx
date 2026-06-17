import type { ItemId, PlayerGameState } from '@pm2/shared';
import {
  BOON_TEXT,
  FLAG_LABELS,
  modDesc,
  modName,
  monsoonDesc,
  monsoonName,
} from '../../i18n/boonModuleMonsoonText.js';
import { tn } from '../../i18n/enNames.js';
import { ITEM_COLORS, ITEM_ICONS, itemTip } from '../../i18n/itemIcons.js';
import { phaseName } from '../../i18n/phaseFlow.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { WORKER_TYPES } from '../../i18n/workerTypesText.js';

// Ported verbatim from PortMasters2/PortMasters_online.html buffChipsHTML (lines 2273-2293):
// one chip per active Fortune buff, productOrderBonus rendered directly from its payload since
// it's shared by two different Fortunes.
export function BuffChips({ g }: { g: PlayerGameState }) {
  const { tr, pf, lang } = useTranslate();
  const flags = g.modifierFlags;
  const chips: { key: string; icon: string; label: string; tip: string }[] = [];

  if (flags.productOrderBonus && flags.productOrderBonus.products.length > 0) {
    const { products, pct } = flags.productOrderBonus;
    const names = products.map((p) => tn(p, lang)).join(tr('、', ', '));
    const pctInt = Math.round(pct * 100);
    chips.push({
      key: 'productOrderBonus',
      icon: ITEM_ICONS[products[0]!] ?? '💎',
      label: `${names} +${pctInt}%`,
      tip: tr(`${names}订单报酬提高${pctInt}%`, `${names} orders pay +${pctInt}% this round`),
    });
  }
  for (const key of Object.keys(flags) as (keyof typeof flags)[]) {
    if (key === 'productOrderBonus' || !flags[key]) continue;
    const f = FLAG_LABELS[key];
    if (!f) continue;
    const t = BOON_TEXT[f.id];
    chips.push({ key, icon: f.icon, label: t ? pf(t.name) : f.id, tip: t ? pf(t.desc) : '' });
  }

  if (chips.length === 0) {
    return <span className="muted">{tr('本回合暂无增益', 'No buffs this round')}</span>;
  }
  return (
    <>
      {chips.map((c) => (
        <span key={c.key} className="chip tip" data-tip={c.tip}>
          {c.icon} {c.label}
        </span>
      ))}
    </>
  );
}

// Ported verbatim from PortMasters2/PortMasters_online.html modulesHTML (lines 2332-2337).
// Exported standalone since the original also calls it outside the fleet card (e.g. Shipyard).
export function Modules({ g }: { g: PlayerGameState }) {
  const { tr, lang } = useTranslate();
  if (g.equippedModules.length === 0) {
    return <span className="muted">{tr('尚未安装模块', 'No modules installed')}</span>;
  }
  return (
    <>
      {g.equippedModules.map((m, i) => (
        <span key={`${m.id}-${i}`} className="chip tip" data-tip={modDesc(m, lang)}>
          {m.icon} {modName(m, lang)}
        </span>
      ))}
    </>
  );
}

// Ported verbatim from PortMasters2/PortMasters_online.html invListHTML (lines 2339-2352).
function InventoryRow({ item, count }: { item: ItemId; count: number }) {
  const { lang } = useTranslate();
  return (
    <div className="inv-item">
      <span className="icon">{ITEM_ICONS[item]}</span>
      <span
        className="name tip"
        data-tip={itemTip(item, lang)}
        style={{ color: ITEM_COLORS[item] }}
      >
        {tn(item, lang)}
      </span>
      <span className="count" style={{ color: ITEM_COLORS[item] }}>
        {count}
      </span>
    </div>
  );
}

export function InventoryList({ g }: { g: PlayerGameState }) {
  const { tr } = useTranslate();
  return (
    <>
      <div className="inv-section-title">{tr('原 材 料', 'MATERIALS')}</div>
      {g.unlockedResources.map((r) => (
        <InventoryRow item={r} count={g.inventory[r] || 0} key={r} />
      ))}
      <div className="inv-section-title">{tr('成 品', 'PRODUCTS')}</div>
      {g.unlockedProducts.map((r) => (
        <InventoryRow item={r} count={g.inventory[r] || 0} key={r} />
      ))}
    </>
  );
}

// Ported verbatim from PortMasters2/PortMasters_online.html workerTeamHTML (lines 2354-2372).
export function WorkerTeam({ g }: { g: PlayerGameState }) {
  const { tr, pf } = useTranslate();
  const lines = WORKER_TYPES.map((wt) => {
    const list = g[wt.listKey];
    if (list.length === 0) return null;
    const busy = list.filter((w) => w.task).length;
    const skilled = list.filter((w) => w.isSkilled).length;
    const detail: string[] = [];
    if (busy) detail.push(tr(`${busy} 生产中`, `${busy} crafting`));
    if (skilled) detail.push(tr(`${skilled} 熟练⭐`, `${skilled} skilled ⭐`));
    return (
      <div className="inv-item" key={wt.key}>
        <span className="icon">{wt.icon}</span>
        <span className="name tip" data-tip={pf(wt.tip)}>
          {pf(wt.name)}
        </span>
        <span className="muted" style={{ marginRight: 6 }}>
          {detail.join(' · ')}
        </span>
        <span className="count">×{list.length}</span>
      </div>
    );
  }).filter(Boolean);
  if (lines.length === 0) {
    return <span className="muted">{tr('尚未雇佣工匠', 'No artisans hired yet')}</span>;
  }
  return <>{lines}</>;
}

// Ported verbatim from PortMasters2/PortMasters_online.html crewSectionsHTML (lines 2374-2407):
// the fleet status card shared by your panel, your partner's panel, and spectate, so the two
// sides are always directly comparable.
export function CrewSections({ g }: { g: PlayerGameState }) {
  const { tr, lang } = useTranslate();
  return (
    <>
      <div className="status-section">
        <h3>{tr('📊 航海概况', '📊 Voyage Overview')}</h3>
        <div className="stat-row">
          <span
            className="tip"
            data-tip={tr(
              `全程共${g.maxRounds}个航程（回合），结束后按声望评级`,
              `${g.maxRounds} voyages (rounds) in total; final rating is based on renown`,
            )}
          >
            {tr('🌊 航程进度', '🌊 Voyage')}
          </span>
          <span className="stat-value">
            {tr(
              `第 ${g.currentRound} / ${g.maxRounds} 程`,
              `Round ${g.currentRound} / ${g.maxRounds}`,
            )}
          </span>
        </div>
        <div className="stat-row">
          <span
            className="tip"
            data-tip={tr(
              '当前现金存款。工资、维护费、税款都从这里扣除，归零即破产',
              'Cash on hand. Wages, upkeep and taxes are paid from here — hit zero and you go bankrupt',
            )}
          >
            {tr('💰 现金存款', '💰 Gold')}
          </span>
          <span className="stat-money">
            {g.money} {tr('金币', 'gold')}
          </span>
        </div>
        <div className="stat-row">
          <span
            className="tip"
            data-tip={tr(
              '声望（信誉值）= 每笔完成订单的净利润累计。决定最终评级，越高越好',
              'Renown = cumulative net profit of completed orders. Determines your final rating',
            )}
          >
            {tr('🏆 声望（信誉）', '🏆 Renown')}
          </span>
          <span className="stat-score">{g.score}</span>
        </div>
        <div className="stat-row">
          <span
            className="tip"
            data-tip={tr(
              '当前所处阶段，双方始终同步',
              'Current phase — both captains always stay in sync',
            )}
          >
            {tr('🧭 当前阶段', '🧭 Phase')}
          </span>
          <span className="stat-value">{phaseName(g.phase, lang)}</span>
        </div>
      </div>
      <div className="status-section">
        <h3>{tr('🪄 本回合增益', '🪄 Round Buffs')}</h3>
        <BuffChips g={g} />
      </div>
      <div className="status-section">
        <h3>{tr('🌦️ 全球环境', '🌦️ Global Environment')}</h3>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
          {g.monsoon_state?.icon ?? '🌦️'} <strong>{monsoonName(g.monsoon_state, lang)}</strong>
          <br />
          {monsoonDesc(g.monsoon_state, lang)}
        </div>
      </div>
      <div className="status-section">
        <h3>{tr('🚢 旗舰状态', '🚢 Flagship')}</h3>
        <div className="stat-row">
          <span
            className="tip"
            data-tip={tr(
              '每升1级，每单运费永久减5金币，并解锁1个模块槽位',
              'Each level permanently cuts shipping by 5 gold per order and unlocks 1 module slot',
            )}
          >
            {tr('商船等级', 'Ship level')}
          </span>
          <span className="stat-value">Lv.{g.shipLevel}</span>
        </div>
        <div className="stat-row">
          <span
            className="tip"
            data-tip={tr(
              '运费 = max(5, 货物件数×2 − 船级×5 − 福缘减免)',
              'Shipping = max(5, items ×2 − level ×5 − fortune discounts)',
            )}
          >
            {tr('运费减免', 'Shipping discount')}
          </span>
          <span className="stat-value">
            −{g.shipLevel * 5} {tr('金币/单', 'gold/order')}
          </span>
        </div>
        <div className="stat-row">
          <span>{tr('模块槽位', 'Module slots')}</span>
          <span className="stat-value">
            {g.equippedModules.length} / {g.shipLevel}
          </span>
        </div>
        <div style={{ marginTop: 4 }}>
          <Modules g={g} />
        </div>
      </div>
      <div className="status-section">
        <h3>{tr('📦 船舱货物', '📦 Cargo Hold')}</h3>
        <InventoryList g={g} />
      </div>
      <div className="status-section">
        <h3>{tr('👥 工匠团队', '👥 Artisan Team')}</h3>
        <WorkerTeam g={g} />
      </div>
    </>
  );
}
