export interface ShipModule {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

// Ported verbatim from PortMasters2/server.py MODULES_TIER0 (lines 375-384).
// Module effects are implemented ad hoc in game logic via has_module(id) checks (no
// structured "modifiers" field in the original), so this table is display data only.
export const MODULES_TIER0 = [
  { id: 'smugglers_hold', name: '走私暗舱', icon: '🏴‍☠️', desc: '采购成本-15%。所得税+20%。' },
  {
    id: 'bulk_hauler',
    name: '散货索具',
    icon: '🏗️',
    desc: '每件货物运费-1。船坞升级费用+15金币。',
  },
  { id: 'artisans_workshop', name: '工匠工坊', icon: '🛠️', desc: '工人产量+1。工资+20%。' },
  {
    id: 'tax_evasion',
    name: '避税账本',
    icon: '📒',
    desc: '所得税按增值税后利润计。15%概率在订单完成时罚款20金币(稽查)。',
  },
  {
    id: 'silk_monopoly',
    name: '丝路垄断',
    icon: '🐍',
    desc: '丝绸运费为0。丝绸产品订单收入+20%。',
  },
  {
    id: 'brokers_network',
    name: '牙行网络',
    icon: '🕵️',
    desc: '每次花费2金币。每次购买密语显示2条线索。',
  },
  { id: 'salvage_crane', name: '打捞起重机', icon: '♻️', desc: '30%概率在订单完成时退还运费。' },
  { id: 'overdrive_engine', name: '超载引擎', icon: '⚡', desc: '运费-5金币。维护费+10金币。' },
] as const satisfies readonly ShipModule[];

// Ported verbatim from PortMasters2/server.py MODULES_TIER1 (lines 386-390).
export const MODULES_TIER1 = [
  {
    id: 'bureau_token',
    name: '市舶司令牌',
    icon: '🎫',
    desc: '新航线货品（瓷土、铜矿及其成品）订单收入+10%。',
  },
  { id: 'kiln_cellar', name: '陶土窖', icon: '🔥', desc: '瓷土与铜矿采购单价各降低2金币。' },
  {
    id: 'ocean_relay',
    name: '远洋通译',
    icon: '📡',
    desc: '牙行密语每次额外显示1条线索（不增加花费）。',
  },
] as const satisfies readonly ShipModule[];

// Ported verbatim from PortMasters2/server.py MODULES_TIER2 (lines 392-396).
export const MODULES_TIER2 = [
  {
    id: 'foreign_quarter_pass',
    name: '蕃坊行会证',
    icon: '🪪',
    desc: '香料与珍珠采购单价各降低3金币。',
  },
  { id: 'persian_dome_compass', name: '波斯穹顶罗盘', icon: '🧿', desc: '海盗风险降低30%。' },
  {
    id: 'fleet_of_treasures',
    name: '万宝商船',
    icon: '⛵',
    desc: '「蕃香脂」与「珠链」每件运费降低3金币。',
  },
] as const satisfies readonly ShipModule[];

export const MODULES = [
  ...MODULES_TIER0,
  ...MODULES_TIER1,
  ...MODULES_TIER2,
] as const satisfies readonly ShipModule[];

export type ModuleId = (typeof MODULES)[number]['id'];
