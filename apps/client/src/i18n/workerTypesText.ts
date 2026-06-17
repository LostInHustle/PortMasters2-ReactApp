import type { ProductId, WorkerAttr, WorkerTypeId } from '@pm2/shared';
import type { Bilingual, Lang } from './LangContext.js';
import { pf } from './LangContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html WORKER_TYPES (lines 1571-1593):
// display text and the product list each artisan type can craft, in tier order.
export interface WorkerTypeInfo {
  key: WorkerTypeId;
  icon: string;
  listKey: WorkerAttr;
  can: ProductId[];
  name: Bilingual;
  tip: Bilingual;
}

export const WORKER_TYPES: WorkerTypeInfo[] = [
  {
    key: 'weaver',
    icon: '👩‍🔧',
    listKey: 'weavers',
    can: ['麻衣', '布衣'],
    name: { zh: '织女', en: 'Weaver' },
    tip: {
      zh: '工资8金币/回合，可制作麻衣、布衣',
      en: 'Wage 8 gold/round. Crafts Hemp Garb and Cloth Tunics',
    },
  },
  {
    key: 'master',
    icon: '👩‍🎨',
    listKey: 'masterWeavers',
    can: ['麻衣', '布衣', '绫罗绸缎'],
    name: { zh: '纺织大师', en: 'Master Weaver' },
    tip: {
      zh: '工资12金币/回合，额外可制作绫罗绸缎',
      en: 'Wage 12 gold/round. Additionally crafts Fine Brocade',
    },
  },
  {
    key: 'sachet_maker',
    icon: '🌸',
    listKey: 'sachetMakers',
    can: ['香囊'],
    name: { zh: '香囊师', en: 'Sachet Maker' },
    tip: {
      zh: '工资20金币/回合，唯一可制作香囊的工匠',
      en: 'Wage 20 gold/round. The only artisan who can craft Sachets',
    },
  },
  {
    key: 'coppersmith',
    icon: '🪞',
    listKey: 'coppersmiths',
    can: ['紫铜镜'],
    name: { zh: '铜匠', en: 'Coppersmith' },
    tip: { zh: '工资12金币/回合，可制作紫铜镜', en: 'Wage 12 gold/round. Crafts Bronze Mirrors' },
  },
  {
    key: 'potter',
    icon: '🏺',
    listKey: 'potters',
    can: ['青瓷器'],
    name: { zh: '陶匠', en: 'Potter' },
    tip: {
      zh: '工资14金币/回合，可制作青瓷器',
      en: 'Wage 14 gold/round. Crafts Celadon Porcelain',
    },
  },
  {
    key: 'perfumer',
    icon: '🧴',
    listKey: 'perfumers',
    can: ['蕃香脂'],
    name: { zh: '香料师', en: 'Perfumer' },
    tip: {
      zh: '工资18金币/回合，唯一可制作蕃香脂的工匠',
      en: 'Wage 18 gold/round. The only artisan who can craft Foreign Perfume Oil',
    },
  },
  {
    key: 'jeweler',
    icon: '📿',
    listKey: 'jewelers',
    can: ['珠链'],
    name: { zh: '珠宝匠', en: 'Jeweler' },
    tip: {
      zh: '工资24金币/回合，唯一可制作珠链的工匠',
      en: 'Wage 24 gold/round. The only artisan who can craft Pearl Necklaces',
    },
  },
];

// Accepts a plain string (not narrowed to WorkerTypeId) since callers include values lifted
// out of regex-matched log text (serverTextRules.ts), which can't be statically known to be a
// valid worker type id -- falls back to the raw key, exactly like the original.
export function wName(key: string, lang: Lang): string {
  const info = WORKER_TYPES.find((w) => w.key === key);
  return (info && pf(info.name, lang)) || key;
}
