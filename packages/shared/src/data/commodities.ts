import type { ResourceId } from './resources.js';
import { RESOURCES } from './resources.js';
import type { ProductId } from './products.js';
import { PRODUCTS } from './products.js';
import type { PortId } from './ports.js';

export type PriceRange = readonly [number, number];

export interface Commodity {
  ports: readonly PortId[];
  basePrice: PriceRange;
}

// Ported verbatim from PortMasters2/server.py COMMODITIES (lines 315-323).
export const COMMODITIES: Record<ResourceId, Commodity> = {
  麻布: { ports: ['泉州港', '宁波港'], basePrice: [3, 6] },
  丝绸: { ports: ['杭州港', '扬州港'], basePrice: [6, 10] },
  茶叶: { ports: ['广州港', '泉州港'], basePrice: [10, 14] },
  瓷土: { ports: ['泉州港', '福州港'], basePrice: [8, 12] },
  铜矿: { ports: ['广州港', '高丽港'], basePrice: [10, 15] },
  香料: { ports: ['三佛齐港', '大食港'], basePrice: [14, 20] },
  珍珠: { ports: ['广州港', '三佛齐港'], basePrice: [16, 24] },
};

// Ported verbatim from PortMasters2/server.py PRODUCT_PRICES (lines 325-330).
export const PRODUCT_PRICES: Record<ProductId, PriceRange> = {
  麻衣: [30, 42],
  布衣: [50, 65],
  绫罗绸缎: [70, 90],
  香囊: [95, 120],
  紫铜镜: [55, 72],
  青瓷器: [78, 100],
  蕃香脂: [100, 130],
  珠链: [125, 160],
};

// Ported verbatim from PortMasters2/server.py RESOURCE_PROBS (line 332).
export const RESOURCE_PROBS: Record<ResourceId, number> = {
  麻布: 0.3,
  丝绸: 0.26,
  茶叶: 0.18,
  瓷土: 0.14,
  铜矿: 0.12,
  香料: 0.08,
  珍珠: 0.06,
};

/** Union of every tradable item id (resources + products), i.e. RESOURCES + PRODUCTS. */
export type ItemId = ResourceId | ProductId;
export const ITEM_IDS: readonly ItemId[] = [...RESOURCES, ...PRODUCTS];
