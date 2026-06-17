import type {
  Boon,
  BoonModifiers,
  CharterEvent,
  MonsoonId,
  MonsoonState,
  ShipModule,
} from '@pm2/shared';
import type { Bilingual, Lang } from './LangContext.js';
import { pf } from './LangContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html BOON_TEXT/MONSOON_TEXT/MODULE_TEXT/
// CHARTER_TEXT/FLAG_LABELS (lines 1455-1569): display text for Fortunes, monsoon states, ship
// modules and the Silk Road Charter is keyed by id and looked up per language -- the server
// still sends the Chinese name/desc as usual, and the client overrides it by id when rendering.
interface BilingualPair {
  name: Bilingual;
  desc: Bilingual;
}

export const BOON_TEXT: Record<string, BilingualPair> = {
  silk_wind: {
    name: { zh: '丝路顺风', en: 'Silk Road Tailwind' },
    desc: {
      zh: '本回合丝绸及成品运费减半。',
      en: 'Shipping for silk and finished goods is halved this round.',
    },
  },
  favorable_tides: {
    name: { zh: '顺风顺水', en: 'Favorable Tides' },
    desc: { zh: '本回合基础运费减4金币。', en: 'Base shipping cost −4 gold this round.' },
  },
  merchant_charm: {
    name: { zh: '商贾魅力', en: "Merchant's Charm" },
    desc: { zh: '本回合采购85折优惠。', en: 'All purchases 15% off this round.' },
  },
  artisan_inspiration: {
    name: { zh: '匠人灵感', en: "Artisan's Inspiration" },
    desc: { zh: '本回合所有工人多生产1件。', en: 'Every worker produces 1 extra item this round.' },
  },
  emergency_loan: {
    name: { zh: '紧急钱庄', en: 'Emergency Loan' },
    desc: { zh: '立即获得40金币。', en: 'Gain 40 gold immediately.' },
  },
  tax_shelter: {
    name: { zh: '免税令', en: 'Tax Exemption' },
    desc: { zh: '本回合所得税率降至5%。', en: 'Income tax rate drops to 5% this round.' },
  },
  hemp_monopoly: {
    name: { zh: '麻布专营', en: 'Hemp Monopoly' },
    desc: { zh: '麻布采购单价降低2金币。', en: 'Hemp Cloth purchase price −2 gold per unit.' },
  },
  master_apprentice: {
    name: { zh: '学徒传承', en: 'Apprentice Legacy' },
    desc: { zh: '本回合雇佣工资减半。', en: 'Hiring wages halved this round.' },
  },
  farsight: {
    name: { zh: '千里眼', en: 'Farsight' },
    desc: {
      zh: '本回合免费获得1条牙行密语线索。',
      en: "Gain 1 free Broker's Whisper clue this round.",
    },
  },
  porcelain_bronze_guild: {
    name: { zh: '陶铜联号', en: 'Porcelain & Bronze Consortium' },
    desc: {
      zh: '本回合「青瓷器」与「紫铜镜」订单报酬提高15%。',
      en: 'Celadon Porcelain and Bronze Mirror orders pay 15% more this round.',
    },
  },
  frontier_tariff_relief: {
    name: { zh: '拓商减负', en: 'Frontier Tariff Relief' },
    desc: {
      zh: '本回合交付成品订单的增值税减半。',
      en: 'VAT on finished goods deliveries is halved this round.',
    },
  },
  exotic_treasures: {
    name: { zh: '蕃国奇珍', en: 'Treasures from Afar' },
    desc: {
      zh: '本回合「蕃香脂」与「珠链」订单报酬提高15%。',
      en: 'Foreign Perfume Oil and Pearl Necklace orders pay 15% more this round.',
    },
  },
  deep_sea_escort_pact: {
    name: { zh: '远洋护航', en: 'Deep-Sea Escort Pact' },
    desc: {
      zh: '本回合雇佣护航费用减半，海盗风险减半。',
      en: 'Escort hiring costs half price and pirate risk is halved this round.',
    },
  },
  merchants_converge: {
    name: { zh: '万商云集', en: 'Merchants Converge' },
    desc: {
      zh: '本回合贸易阶段额外出现1张订单。',
      en: '1 extra order appears in the Trade phase this round.',
    },
  },
};

export function boonName(b: Boon, lang: Lang): string {
  const t = BOON_TEXT[b.id];
  return t ? pf(t.name, lang) : b.name || b.id;
}
export function boonDesc(b: Boon, lang: Lang): string {
  const t = BOON_TEXT[b.id];
  return t ? pf(t.desc, lang) : b.desc || '';
}

export const MONSOON_TEXT: Record<string, BilingualPair> = {
  spring_current: {
    name: { zh: '春潮顺流', en: 'Spring Current' },
    desc: {
      zh: '泉州港与广州港订单报酬提高，茶叶采购价降低。海盗风险较低。',
      en: 'Quanzhou and Guangzhou orders pay more, Tea is cheaper, and pirate risk is low.',
    },
  },
  summer_monsoon: {
    name: { zh: '盛夏季风', en: 'Summer Monsoon' },
    desc: {
      zh: '杭州港与扬州港订单报酬提高，丝绸采购价上升。海盗风险升高。',
      en: 'Hangzhou and Yangzhou orders pay more, Silk is pricier, and pirate risk rises.',
    },
  },
  autumn_gales: {
    name: { zh: '秋汛乱流', en: 'Autumn Gales' },
    desc: {
      zh: '宁波港与泉州港订单报酬提高，麻布采购价降低。海盗风险中等。',
      en: 'Ningbo and Quanzhou orders pay more, Hemp Cloth is cheaper, and pirate risk is moderate.',
    },
  },
  winter_blockade: {
    name: { zh: '冬海封锁', en: 'Winter Blockade' },
    desc: {
      zh: '广州港与杭州港订单报酬大幅提高，茶叶采购价上升。海盗风险最高。',
      en: 'Guangzhou and Hangzhou orders pay much more, Tea is pricier, and pirate risk is highest.',
    },
  },
  fujian_kiln_smoke: {
    name: { zh: '闽江窑烟', en: 'Min River Kiln-Smoke' },
    desc: {
      zh: '福州港与泉州港订单报酬提高，瓷土采购价降低。海盗风险中等。',
      en: 'Fuzhou and Quanzhou orders pay more, Porcelain Clay is cheaper, and pirate risk is moderate.',
    },
  },
  goryeo_dawn_route: {
    name: { zh: '高丽晓航', en: 'Goryeo Dawn Route' },
    desc: {
      zh: '高丽港与广州港订单报酬提高，铜矿采购价降低。海盗风险较高。',
      en: 'Goryeo and Guangzhou orders pay more, Copper Ore is cheaper, and pirate risk is elevated.',
    },
  },
  srivijaya_spice_breeze: {
    name: { zh: '三佛齐香风', en: 'Srivijaya Spice Breeze' },
    desc: {
      zh: '三佛齐港与大食港订单报酬提高，香料采购价降低。海盗风险较高。',
      en: 'Srivijaya and Dashi orders pay more, Spices are cheaper, and pirate risk is elevated.',
    },
  },
  dashi_pearl_moon: {
    name: { zh: '大食珠月', en: 'Dashi Pearl Moon' },
    desc: {
      zh: '大食港与三佛齐港订单报酬大幅提高，珍珠采购价降低。海盗风险最高。',
      en: 'Dashi and Srivijaya orders pay much more, Pearls are cheaper, and pirate risk is highest.',
    },
  },
};

export function monsoonName(m: MonsoonState | null | undefined, lang: Lang): string {
  const t = m ? MONSOON_TEXT[m.id as MonsoonId] : undefined;
  return t ? pf(t.name, lang) : m?.name || '';
}
export function monsoonDesc(m: MonsoonState | null | undefined, lang: Lang): string {
  const t = m ? MONSOON_TEXT[m.id as MonsoonId] : undefined;
  return t ? pf(t.desc, lang) : m?.desc || '';
}

export const MODULE_TEXT: Record<string, BilingualPair> = {
  smugglers_hold: {
    name: { zh: '走私暗舱', en: "Smuggler's Hold" },
    desc: { zh: '采购成本-15%。所得税+20%。', en: 'Purchase costs −15%. Income tax +20%.' },
  },
  bulk_hauler: {
    name: { zh: '散货索具', en: 'Bulk Rigging' },
    desc: {
      zh: '每件货物运费-1。船坞升级费用+15金币。',
      en: 'Shipping −1 gold per item. Ship upgrades cost +15 gold.',
    },
  },
  artisans_workshop: {
    name: { zh: '工匠工坊', en: "Artisan's Workshop" },
    desc: { zh: '工人产量+1。工资+20%。', en: 'Workers produce +1 item. Wages +20%.' },
  },
  tax_evasion: {
    name: { zh: '避税账本', en: 'Hidden Ledger' },
    desc: {
      zh: '所得税按增值税后利润计。15%概率在订单完成时罚款20金币(稽查)。',
      en: 'Income tax assessed on profit after VAT. 15% chance of a 20 gold audit fine when an order completes.',
    },
  },
  silk_monopoly: {
    name: { zh: '丝路垄断', en: 'Silk Monopoly' },
    desc: {
      zh: '丝绸运费为0。丝绸产品订单收入+20%。',
      en: 'Silk ships free. Silk-product order income +20%.',
    },
  },
  brokers_network: {
    name: { zh: '牙行网络', en: "Broker's Network" },
    desc: {
      zh: '每次花费2金币。每次购买密语显示2条线索。',
      en: 'Whispers cost only 2 gold and reveal 2 clues per purchase.',
    },
  },
  salvage_crane: {
    name: { zh: '打捞起重机', en: 'Salvage Crane' },
    desc: {
      zh: '30%概率在订单完成时退还运费。',
      en: '30% chance to refund shipping when an order completes.',
    },
  },
  overdrive_engine: {
    name: { zh: '超载引擎', en: 'Overdrive Engine' },
    desc: { zh: '运费-5金币。维护费+10金币。', en: 'Shipping −5 gold. Maintenance +10 gold.' },
  },
  bureau_token: {
    name: { zh: '市舶司令牌', en: 'Trade Bureau Token' },
    desc: {
      zh: '新航线货品（瓷土、铜矿及其成品）订单收入+10%。',
      en: 'Orders for new trade-route goods (Porcelain Clay, Copper Ore and their products) pay +10%.',
    },
  },
  kiln_cellar: {
    name: { zh: '陶土窖', en: 'Kiln Cellar' },
    desc: {
      zh: '瓷土与铜矿采购单价各降低2金币。',
      en: 'Porcelain Clay and Copper Ore purchase price −2 gold per unit.',
    },
  },
  ocean_relay: {
    name: { zh: '远洋通译', en: 'Ocean-Going Interpreter' },
    desc: {
      zh: '牙行密语每次额外显示1条线索（不增加花费）。',
      en: "Each Broker's Whisper purchase reveals 1 extra clue at no added cost.",
    },
  },
  foreign_quarter_pass: {
    name: { zh: '蕃坊行会证', en: 'Foreign Quarter Guild Pass' },
    desc: {
      zh: '香料与珍珠采购单价各降低3金币。',
      en: 'Spices and Pearls purchase price −3 gold per unit.',
    },
  },
  persian_dome_compass: {
    name: { zh: '波斯穹顶罗盘', en: 'Persian Dome Compass' },
    desc: { zh: '海盗风险降低30%。', en: 'Pirate risk reduced by 30%.' },
  },
  fleet_of_treasures: {
    name: { zh: '万宝商船', en: 'Fleet of Ten-Thousand Treasures' },
    desc: {
      zh: '「蕃香脂」与「珠链」每件运费降低3金币。',
      en: 'Shipping for Foreign Perfume Oil and Pearl Necklace is 3 gold cheaper per item.',
    },
  },
};

export function modName(m: ShipModule, lang: Lang): string {
  const t = MODULE_TEXT[m.id];
  return t ? pf(t.name, lang) : m.name || m.id;
}
export function modDesc(m: ShipModule, lang: Lang): string {
  const t = MODULE_TEXT[m.id];
  return t ? pf(t.desc, lang) : m.desc || '';
}

// Silk Road Charter: the unlock announcement shown at the start of the relevant rounds, sent by
// the server as charterEvent={id,icon,name,desc}.
export const CHARTER_TEXT: Record<string, BilingualPair> = {
  tier1: {
    name: { zh: '市舶新政', en: 'New Maritime Edict' },
    desc: {
      zh: '福建市舶司新政颁布！瓷土、铜矿、青瓷器、紫铜镜加入行情；福州港、高丽港正式开埠；陶匠与铜匠加入劳务市场；新的福缘与战船改装随之而来。',
      en: 'A new edict from the Fujian Maritime Trade Bureau! Porcelain Clay, Copper Ore, Celadon Porcelain and Bronze Mirror enter the market; Fuzhou and Goryeo ports open; Potters and Coppersmiths join the labor market; new Fortunes and ship modules become available.',
    },
  },
  tier2: {
    name: { zh: '万国通商', en: 'Ten Thousand Kingdoms Trade' },
    desc: {
      zh: '万国通商盛况空前！香料、珍珠、蕃香脂、珠链加入行情；三佛齐港、大食港正式开埠；香料师与珠宝匠加入劳务市场；更多福缘与战船改装随之而来。',
      en: 'Trade opens with ten thousand kingdoms! Spices, Pearls, Foreign Perfume Oil and Pearl Necklaces enter the market; Srivijaya and Dashi ports open; Perfumers and Jewelers join the labor market; more Fortunes and ship modules arrive.',
    },
  },
};

export function charterName(c: CharterEvent | null | undefined, lang: Lang): string {
  const t = c ? CHARTER_TEXT[c.id] : undefined;
  return t ? pf(t.name, lang) : c?.name || '';
}
export function charterDesc(c: CharterEvent | null | undefined, lang: Lang): string {
  const t = c ? CHARTER_TEXT[c.id] : undefined;
  return t ? pf(t.desc, lang) : c?.desc || '';
}

interface FlagLabel {
  icon: string;
  id: string;
}

// The server sends the chosen Fortune as modifierFlags; this looks the name back up to display
// the buff badge. Keys are camelCase here (matching BoonModifiers, packages/shared/src/data/
// boons.ts) rather than the original's snake_case wire keys (transport_silk_discount etc.) --
// the wire protocol for this port already uses camelCase field names throughout, a decision
// made when BoonModifiers was first ported.
export const FLAG_LABELS: Partial<Record<keyof BoonModifiers, FlagLabel>> = {
  transportSilkDiscount: { icon: '🌬️', id: 'silk_wind' },
  transportFlatDiscount: { icon: '🌊', id: 'favorable_tides' },
  purchaseDiscount: { icon: '✨', id: 'merchant_charm' },
  workerBonusProduction: { icon: '🔨', id: 'artisan_inspiration' },
  instantGold: { icon: '💰', id: 'emergency_loan' },
  incomeTaxOverride: { icon: '📜', id: 'tax_shelter' },
  hempPriceReduction: { icon: '🧶', id: 'hemp_monopoly' },
  hireDiscount: { icon: '🎓', id: 'master_apprentice' },
  freeIntel: { icon: '🔮', id: 'farsight' },
  vatDiscount: { icon: '🧾', id: 'frontier_tariff_relief' },
  escortDiscount: { icon: '🛡️', id: 'deep_sea_escort_pact' },
  extraOrder: { icon: '🛍️', id: 'merchants_converge' },
};

export function activeFlagLabels(flags: BoonModifiers): FlagLabel[] {
  return (Object.keys(flags) as (keyof BoonModifiers)[])
    .filter((k) => flags[k])
    .map((k) => FLAG_LABELS[k])
    .filter((l): l is FlagLabel => l !== undefined);
}
