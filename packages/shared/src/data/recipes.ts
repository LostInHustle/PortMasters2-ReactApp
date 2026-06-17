import type { ResourceId } from './resources.js';
import type { ProductId } from './products.js';
import type { WorkerTypeId } from './wages-workers.js';

// Ported verbatim from PortMasters2/server.py RECIPES (lines 304-313).
export interface Recipe {
  materials: Partial<Record<ResourceId, number>>;
  value: number;
  workerType: WorkerTypeId;
}

export const RECIPES: Record<ProductId, Recipe> = {
  麻衣: { materials: { 麻布: 2 }, value: 15, workerType: 'weaver' },
  布衣: { materials: { 麻布: 2, 丝绸: 1 }, value: 35, workerType: 'weaver' },
  绫罗绸缎: { materials: { 丝绸: 3 }, value: 60, workerType: 'master' },
  香囊: { materials: { 丝绸: 1, 茶叶: 2 }, value: 80, workerType: 'sachet_maker' },
  紫铜镜: { materials: { 铜矿: 3 }, value: 45, workerType: 'coppersmith' },
  青瓷器: { materials: { 瓷土: 3 }, value: 65, workerType: 'potter' },
  蕃香脂: { materials: { 香料: 2, 丝绸: 1 }, value: 85, workerType: 'perfumer' },
  珠链: { materials: { 珍珠: 2, 丝绸: 1 }, value: 105, workerType: 'jeweler' },
};
