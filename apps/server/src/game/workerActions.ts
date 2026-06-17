import {
  RECIPES,
  WAGES,
  type ItemId,
  type ProductId,
  type ResourceId,
  type Worker,
  type WorkerTypeId,
} from '@pm2/shared';
import { getHireCost } from './costCalculations.js';
import { unlockedWorkerTypes } from './poolSelectors.js';
import type { BoonModifiers } from '@pm2/shared';

export interface WorkerActionContext {
  workers: Record<WorkerTypeId, Worker[]>;
  currentRound: number;
  tierUnlock: Record<number, number>;
  money: number;
  modifierFlags: BoonModifiers;
  inventory: Record<ItemId, number>;
  log(message: string): void;
}

// Ported verbatim from PortMasters2/server.py hire_worker (lines 876-887).
export function hireWorker(ctx: WorkerActionContext, wtype: WorkerTypeId): boolean {
  if (!unlockedWorkerTypes(ctx.currentRound, ctx.tierUnlock).includes(wtype)) {
    ctx.log('❌ 该工种尚未开放');
    return false;
  }
  const wage = getHireCost(ctx, wtype);
  if (ctx.money < wage) {
    ctx.log('❌ 资金不足，无法雇佣');
    return false;
  }
  ctx.workers[wtype].push({ task: null, progress: 0, producedCount: 0, isSkilled: false });
  ctx.log(`👥 雇佣了新工匠（${wtype}）`);
  return true;
}

// Ported verbatim from PortMasters2/server.py fire_worker (lines 889-900): firing still costs
// a wage payment (severance), and the firing fails outright if it can't be afforded.
export function fireWorker(ctx: WorkerActionContext, wtype: WorkerTypeId, idx: number): boolean {
  const lst = ctx.workers[wtype];
  if (idx < 0 || idx >= lst.length) return false;
  const wage = WAGES[wtype];
  if (ctx.money < wage) {
    ctx.log('❌ 资金不足，无法解雇');
    return false;
  }
  ctx.money -= wage;
  lst.splice(idx, 1);
  ctx.log(`💔 解雇了${wtype}，支付${wage}金币`);
  return true;
}

// Ported verbatim from PortMasters2/server.py assign_task (lines 902-918): assigns the first
// idle worker of this type, consuming materials up front.
export function assignTask(
  ctx: WorkerActionContext,
  wtype: WorkerTypeId,
  task: ProductId,
): boolean {
  const lst = ctx.workers[wtype];
  const recipe = RECIPES[task];
  for (const worker of lst) {
    if (worker.task === null) {
      for (const [material, amount] of Object.entries(recipe.materials) as [ResourceId, number][]) {
        if (ctx.inventory[material] < amount) {
          ctx.log(`❌ 材料不足，无法生产${task}`);
          return false;
        }
      }
      for (const [material, amount] of Object.entries(recipe.materials) as [ResourceId, number][]) {
        ctx.inventory[material] -= amount;
      }
      worker.task = task;
      worker.progress = 0;
      ctx.log(`📋 分配任务：生产${task}`);
      return true;
    }
  }
  ctx.log('❌ 所有工匠都在忙');
  return false;
}
