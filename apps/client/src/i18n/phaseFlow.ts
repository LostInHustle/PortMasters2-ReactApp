import type { Phase } from '@pm2/shared';
import type { Bilingual, Lang } from './LangContext.js';
import { pf, tr } from './LangContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html PHASE_FLOW (lines 1608-1633):
// metadata for the 8 phases of a round, so the phase name + goal + action hint are always
// visible (recognition over recall).
export interface PhaseFlowEntry {
  key: Phase;
  icon: string;
  name: Bilingual;
  brief: Bilingual;
}

export const PHASE_FLOW: PhaseFlowEntry[] = [
  {
    key: 0,
    icon: '⚓',
    name: { zh: '启航', en: 'Set Sail' },
    brief: {
      zh: '新回合开始，双方确认后抽取福缘。',
      en: "A new round begins. Once both captains confirm, you'll draw your fortunes.",
    },
  },
  {
    key: 5,
    icon: '🧭',
    name: { zh: '福缘', en: 'Fortune' },
    brief: {
      zh: '航海家的罗盘从福缘池中为你随机抽出4张（双方抽到的组合不同），选择一项仅本回合生效的增益。要采购多就选折扣，要生产多就选匠人灵感。',
      en: "The Navigator's Compass deals you 4 random fortunes (each captain gets a different draw). Pick one buff for this round only, discounts if you plan to buy big, Artisan's Inspiration if you plan to produce.",
    },
  },
  {
    key: 1,
    icon: '🛒',
    name: { zh: '采购', en: 'Procure' },
    brief: {
      zh: '用金币购入原料或成品。在商品的特产港口采购单价更低；可在「牙行密语」面板花金币打探未来订单需求；注意为工资和维护费留足现金。',
      en: "Spend gold on materials or finished goods. Prices are lower at a commodity's home port; the Broker's Whisper panel sells intel on upcoming demand. Keep enough cash for wages and upkeep!",
    },
  },
  {
    key: 'trade',
    icon: '🤝',
    name: { zh: '互市', en: 'Barter' },
    brief: {
      zh: '与伙伴自由交易：发布「我出售 × 换取 ×」的订单，对方接受即成交。双方都点「准备就绪」后进入下一阶段。',
      en: 'Trade freely with your partner: post an offer of "I give × for ×" and it executes when accepted. Both captains must click Ready to move on.',
    },
  },
  {
    key: 'worker_mgmt',
    icon: '👥',
    name: { zh: '工匠', en: 'Artisans' },
    brief: {
      zh: '雇佣工匠并分配生产任务。分配任务时立即消耗材料，产出在结算阶段入库。',
      en: 'Hire artisans and assign production. Materials are consumed immediately on assignment; output arrives at Upkeep.',
    },
  },
  {
    key: 2,
    icon: '📦',
    name: { zh: '贸易', en: 'Trade' },
    brief: {
      zh: '用库存满足港口订单赚取金币。成品订单需缴纳约5%增值税；每单还需支付运费。',
      en: 'Fulfill port orders from your cargo for gold. Product orders pay ~5% VAT; every delivery also costs shipping.',
    },
  },
  {
    key: 3,
    icon: '🔧',
    name: { zh: '结算', en: 'Upkeep' },
    brief: {
      zh: '工匠产出入库、自动支付工资，然后支付维护费。现金不足以支付即破产，务必提前规划！',
      en: "Production arrives, wages are paid automatically, then you pay fleet upkeep. If you can't cover it, you go bankrupt, plan ahead!",
    },
  },
  {
    key: 4,
    icon: '🚢',
    name: { zh: '船坞', en: 'Shipyard' },
    brief: {
      zh: '可花费金币升级商船：每级永久减运费5金币并增加1个模块槽位。',
      en: 'Optionally upgrade your ship: each level permanently cuts shipping by 5 gold and adds a module slot.',
    },
  },
];

const PHASE_INDEX = new Map<Phase, number>(PHASE_FLOW.map((p, i) => [p.key, i]));

export function phaseName(key: Phase, lang: Lang): string {
  if (key === 'endgame') return tr(lang, '航程结束', 'Voyage Complete');
  if (key === 'bankruptcy') return tr(lang, '破产清算', 'Bankrupt');
  const idx = PHASE_INDEX.get(key);
  const meta = idx === undefined ? undefined : PHASE_FLOW[idx];
  return meta ? pf(meta.name, lang) : tr(lang, '准备中', 'Preparing');
}
