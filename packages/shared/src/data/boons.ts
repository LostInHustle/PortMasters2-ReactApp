import type { ProductId } from './products.js';

export interface ProductOrderBonus {
  products: readonly ProductId[];
  pct: number;
}

// Every key the original's modifierFlags dict may carry (server.py BOONS_TIER0/1/2, lines 350-371).
export interface BoonModifiers {
  transportSilkDiscount?: number;
  transportFlatDiscount?: number;
  purchaseDiscount?: number;
  workerBonusProduction?: number;
  instantGold?: number;
  incomeTaxOverride?: number;
  hempPriceReduction?: number;
  hireDiscount?: number;
  freeIntel?: number;
  productOrderBonus?: ProductOrderBonus;
  vatDiscount?: number;
  escortDiscount?: number;
  pirateRiskDiscount?: number;
  extraOrder?: number;
}

export interface Boon {
  id: string;
  name: string;
  icon: string;
  desc: string;
  modifiers: BoonModifiers;
}

// Ported verbatim from PortMasters2/server.py BOONS_TIER0 (lines 350-359).
export const BOONS_TIER0 = [
  {
    id: 'silk_wind',
    name: '丝路顺风',
    icon: '🌬️',
    desc: '本回合丝绸及成品运费减半。',
    modifiers: { transportSilkDiscount: 0.5 },
  },
  {
    id: 'favorable_tides',
    name: '顺风顺水',
    icon: '🌊',
    desc: '本回合基础运费减4金币。',
    modifiers: { transportFlatDiscount: 4 },
  },
  {
    id: 'merchant_charm',
    name: '商贾魅力',
    icon: '✨',
    desc: '本回合采购85折优惠。',
    modifiers: { purchaseDiscount: 0.15 },
  },
  {
    id: 'artisan_inspiration',
    name: '匠人灵感',
    icon: '🔨',
    desc: '本回合所有工人多生产1件。',
    modifiers: { workerBonusProduction: 1 },
  },
  {
    id: 'emergency_loan',
    name: '紧急钱庄',
    icon: '💰',
    desc: '立即获得40金币。',
    modifiers: { instantGold: 40 },
  },
  {
    id: 'tax_shelter',
    name: '免税令',
    icon: '📜',
    desc: '本回合所得税率降至5%。',
    modifiers: { incomeTaxOverride: 0.05 },
  },
  {
    id: 'hemp_monopoly',
    name: '麻布专营',
    icon: '🧶',
    desc: '麻布采购单价降低2金币。',
    modifiers: { hempPriceReduction: 2 },
  },
  {
    id: 'master_apprentice',
    name: '学徒传承',
    icon: '🎓',
    desc: '本回合雇佣工资减半。',
    modifiers: { hireDiscount: 0.5 },
  },
] as const satisfies readonly Boon[];

// Ported verbatim from PortMasters2/server.py BOONS_TIER1 (lines 361-365).
export const BOONS_TIER1 = [
  {
    id: 'farsight',
    name: '千里眼',
    icon: '🔮',
    desc: '本回合免费获得1条牙行密语线索。',
    modifiers: { freeIntel: 1 },
  },
  {
    id: 'porcelain_bronze_guild',
    name: '陶铜联号',
    icon: '🏮',
    desc: '本回合「青瓷器」与「紫铜镜」订单报酬提高15%。',
    modifiers: { productOrderBonus: { products: ['青瓷器', '紫铜镜'], pct: 0.15 } },
  },
  {
    id: 'frontier_tariff_relief',
    name: '拓商减负',
    icon: '🧾',
    desc: '本回合交付成品订单的增值税减半。',
    modifiers: { vatDiscount: 0.5 },
  },
] as const satisfies readonly Boon[];

// Ported verbatim from PortMasters2/server.py BOONS_TIER2 (lines 367-371).
export const BOONS_TIER2 = [
  {
    id: 'exotic_treasures',
    name: '蕃国奇珍',
    icon: '💎',
    desc: '本回合「蕃香脂」与「珠链」订单报酬提高15%。',
    modifiers: { productOrderBonus: { products: ['蕃香脂', '珠链'], pct: 0.15 } },
  },
  {
    id: 'deep_sea_escort_pact',
    name: '远洋护航',
    icon: '🛡️',
    desc: '本回合雇佣护航费用减半，海盗风险减半。',
    modifiers: { escortDiscount: 0.5, pirateRiskDiscount: 0.5 },
  },
  {
    id: 'merchants_converge',
    name: '万商云集',
    icon: '🛍️',
    desc: '本回合贸易阶段额外出现1张订单。',
    modifiers: { extraOrder: 1 },
  },
] as const satisfies readonly Boon[];

export const BOONS = [
  ...BOONS_TIER0,
  ...BOONS_TIER1,
  ...BOONS_TIER2,
] as const satisfies readonly Boon[];

export type BoonId = (typeof BOONS)[number]['id'];
