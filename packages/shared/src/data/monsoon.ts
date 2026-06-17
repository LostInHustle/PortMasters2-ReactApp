import type { PortId } from './ports.js';
import type { ResourceId } from './resources.js';

export interface MonsoonState {
  id: string;
  name: string;
  icon: string;
  desc: string;
  rewardPorts: readonly PortId[];
  rewardMultiplier: number;
  resource: ResourceId;
  purchaseMultiplier: number;
  pirateRisk: number;
}

// Ported verbatim from PortMasters2/server.py MONSOON_TIER0 (lines 205-250).
export const MONSOON_TIER0 = [
  {
    id: 'spring_current',
    name: '春潮顺流',
    icon: '🌦️',
    desc: '泉州港与广州港订单报酬提高15%，茶叶采购价降低10%。海盗风险较低。',
    rewardPorts: ['泉州港', '广州港'],
    rewardMultiplier: 1.15,
    resource: '茶叶',
    purchaseMultiplier: 0.9,
    pirateRisk: 0.1,
  },
  {
    id: 'summer_monsoon',
    name: '盛夏季风',
    icon: '⛈️',
    desc: '杭州港与扬州港订单报酬提高20%，丝绸采购价提高15%。海盗风险升高。',
    rewardPorts: ['杭州港', '扬州港'],
    rewardMultiplier: 1.2,
    resource: '丝绸',
    purchaseMultiplier: 1.15,
    pirateRisk: 0.25,
  },
  {
    id: 'autumn_gales',
    name: '秋汛乱流',
    icon: '🍂',
    desc: '宁波港与泉州港订单报酬提高18%，麻布采购价降低15%。海盗风险中等。',
    rewardPorts: ['宁波港', '泉州港'],
    rewardMultiplier: 1.18,
    resource: '麻布',
    purchaseMultiplier: 0.85,
    pirateRisk: 0.18,
  },
  {
    id: 'winter_blockade',
    name: '冬海封锁',
    icon: '❄️',
    desc: '广州港与杭州港订单报酬提高25%，茶叶采购价提高15%。海盗风险最高。',
    rewardPorts: ['广州港', '杭州港'],
    rewardMultiplier: 1.25,
    resource: '茶叶',
    purchaseMultiplier: 1.15,
    pirateRisk: 0.3,
  },
] as const satisfies readonly MonsoonState[];

// Ported verbatim from PortMasters2/server.py MONSOON_TIER1 (lines 252-275).
export const MONSOON_TIER1 = [
  {
    id: 'fujian_kiln_smoke',
    name: '闽江窑烟',
    icon: '🌫️',
    desc: '福州港与泉州港订单报酬提高18%，瓷土采购价降低12%。海盗风险中等。',
    rewardPorts: ['福州港', '泉州港'],
    rewardMultiplier: 1.18,
    resource: '瓷土',
    purchaseMultiplier: 0.88,
    pirateRisk: 0.15,
  },
  {
    id: 'goryeo_dawn_route',
    name: '高丽晓航',
    icon: '🌅',
    desc: '高丽港与广州港订单报酬提高20%，铜矿采购价降低10%。海盗风险较高。',
    rewardPorts: ['高丽港', '广州港'],
    rewardMultiplier: 1.2,
    resource: '铜矿',
    purchaseMultiplier: 0.9,
    pirateRisk: 0.2,
  },
] as const satisfies readonly MonsoonState[];

// Ported verbatim from PortMasters2/server.py MONSOON_TIER2 (lines 277-300).
export const MONSOON_TIER2 = [
  {
    id: 'srivijaya_spice_breeze',
    name: '三佛齐香风',
    icon: '🌴',
    desc: '三佛齐港与大食港订单报酬提高22%，香料采购价降低15%。海盗风险较高。',
    rewardPorts: ['三佛齐港', '大食港'],
    rewardMultiplier: 1.22,
    resource: '香料',
    purchaseMultiplier: 0.85,
    pirateRisk: 0.22,
  },
  {
    id: 'dashi_pearl_moon',
    name: '大食珠月',
    icon: '🌙',
    desc: '大食港与三佛齐港订单报酬提高25%，珍珠采购价降低15%。海盗风险最高。',
    rewardPorts: ['大食港', '三佛齐港'],
    rewardMultiplier: 1.25,
    resource: '珍珠',
    purchaseMultiplier: 0.85,
    pirateRisk: 0.25,
  },
] as const satisfies readonly MonsoonState[];

export const MONSOON_STATES = [
  ...MONSOON_TIER0,
  ...MONSOON_TIER1,
  ...MONSOON_TIER2,
] as const satisfies readonly MonsoonState[];

export type MonsoonId = (typeof MONSOON_STATES)[number]['id'];
