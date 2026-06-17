import type { ItemId, GOLD } from '@pm2/shared';
import type { Bilingual, Lang } from './LangContext.js';
import { pf } from './LangContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html ICONS/COLORS/ITEM_TIPS
// (lines 1401-1449): per-item emoji, swatch color, and the bilingual tooltip shown on hover.
// RESOURCES/PRODUCTS/WAGES from the same block aren't re-ported here -- they duplicate
// packages/shared/src/data (resources.ts/products.ts/wages-workers.ts), the single source of
// truth both client and server already import.
export const ITEM_ICONS: Record<ItemId | typeof GOLD, string> = {
  麻布: '🧶',
  丝绸: '👘',
  茶叶: '🍵',
  瓷土: '🧱',
  铜矿: '⛏️',
  香料: '🌶️',
  珍珠: '🦪',
  麻衣: '👔',
  布衣: '👕',
  绫罗绸缎: '👗',
  香囊: '🌸',
  紫铜镜: '🪞',
  青瓷器: '🏺',
  蕃香脂: '🧴',
  珠链: '📿',
  金币: '💰',
};

export const ITEM_COLORS: Record<ItemId, string> = {
  麻布: '#8B7355',
  丝绸: '#DC143C',
  茶叶: '#228B22',
  瓷土: '#A0826D',
  铜矿: '#B87333',
  香料: '#E25822',
  珍珠: '#7B6F8E',
  麻衣: '#D2691E',
  布衣: '#4169E1',
  绫罗绸缎: '#8B008B',
  香囊: '#FF1493',
  紫铜镜: '#8C5E3C',
  青瓷器: '#6B8E7F',
  蕃香脂: '#BA55D3',
  珠链: '#D4AF37',
};

export const ITEM_TIPS: Record<ItemId, Bilingual> = {
  麻布: {
    zh: '基础原料。可由织女制成麻衣（×2）或布衣（×2，另需丝绸×1）',
    en: 'Basic material. Weavers turn it into Hemp Garb (×2) or Cloth Tunics (×2, plus Silk ×1)',
  },
  丝绸: {
    zh: '高级原料。用于布衣、绫罗绸缎（×3）、香囊（×1）',
    en: 'Premium material. Used in Cloth Tunics, Fine Brocade (×3) and Sachets (×1)',
  },
  茶叶: {
    zh: '香囊原料（×2）。也可直接完成原料订单出售',
    en: 'Sachet ingredient (×2). Can also be sold directly on raw-material orders',
  },
  麻衣: {
    zh: '成品 · 基准产值 15。由织女 / 大师制作（麻布×2）',
    en: 'Product · base value 15. Made by Weavers / Masters (Hemp Cloth ×2)',
  },
  布衣: {
    zh: '成品 · 基准产值 35。由织女 / 大师制作（麻布×2 + 丝绸×1）',
    en: 'Product · base value 35. Made by Weavers / Masters (Hemp Cloth ×2 + Silk ×1)',
  },
  绫罗绸缎: {
    zh: '高级成品 · 基准产值 60。仅纺织大师可制作（丝绸×3）',
    en: 'Premium product · base value 60. Master Weavers only (Silk ×3)',
  },
  香囊: {
    zh: '顶级成品 · 基准产值 80。仅香囊师可制作（丝绸×1 + 茶叶×2）',
    en: 'Top-tier product · base value 80. Sachet Makers only (Silk ×1 + Tea ×2)',
  },
  瓷土: {
    zh: '基础原料。可由陶匠制成青瓷器（×3）',
    en: 'Basic material. Potters turn it into Celadon Porcelain (×3)',
  },
  铜矿: {
    zh: '基础原料。可由铜匠制成紫铜镜（×3）',
    en: 'Basic material. Coppersmiths turn it into Bronze Mirror (×3)',
  },
  香料: {
    zh: '高级原料。用于蕃香脂（×2，另需丝绸×1）',
    en: 'Premium material. Used in Foreign Perfume Oil (×2, plus Silk ×1)',
  },
  珍珠: {
    zh: '高级原料。用于珠链（×2，另需丝绸×1）',
    en: 'Premium material. Used in Pearl Necklace (×2, plus Silk ×1)',
  },
  紫铜镜: {
    zh: '成品 · 基准产值 45。由铜匠制作（铜矿×3）',
    en: 'Product · base value 45. Made by Coppersmiths (Copper Ore ×3)',
  },
  青瓷器: {
    zh: '成品 · 基准产值 65。由陶匠制作（瓷土×3）',
    en: 'Product · base value 65. Made by Potters (Porcelain Clay ×3)',
  },
  蕃香脂: {
    zh: '顶级成品 · 基准产值 85。仅香料师可制作（香料×2 + 丝绸×1）',
    en: 'Top-tier product · base value 85. Perfumers only (Spices ×2 + Silk ×1)',
  },
  珠链: {
    zh: '顶级成品 · 基准产值 105。仅珠宝匠可制作（珍珠×2 + 丝绸×1）',
    en: 'Top-tier product · base value 105. Jewelers only (Pearls ×2 + Silk ×1)',
  },
};

export function itemTip(item: ItemId, lang: Lang): string {
  return pf(ITEM_TIPS[item], lang) || '';
}
