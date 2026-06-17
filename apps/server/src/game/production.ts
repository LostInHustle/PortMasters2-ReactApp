import {
  WAGES,
  type BoonModifiers,
  type ItemId,
  type ShipModule,
  type Worker,
  type WorkerTypeId,
} from '@pm2/shared';
import { hasModule } from './costCalculations.js';
import { resolvePirateHazard, type ResolvePirateHazardContext } from './pirateHazard.js';
import type { Rng } from './randomUtil.js';

export interface ProcessProductionContext {
  workers: Record<WorkerTypeId, Worker[]>;
  modifierFlags: BoonModifiers;
  equippedModules: readonly ShipModule[];
  inventory: Record<ItemId, number>;
}

// Ported verbatim from PortMasters2/server.py process_production (lines 920-935).
export function processProduction(ctx: ProcessProductionContext): void {
  const bonus = ctx.modifierFlags.workerBonusProduction ?? 0;
  for (const list of Object.values(ctx.workers)) {
    for (const w of list) {
      if (w.task) {
        const base = w.isSkilled ? 2 : 1;
        let amt = base + bonus;
        if (hasModule(ctx, 'artisans_workshop')) amt += 1;
        ctx.inventory[w.task] += amt;
        w.producedCount += amt;
        if (w.producedCount >= 2 && !w.isSkilled) {
          w.isSkilled = true;
        }
        w.task = null;
        w.progress = 0;
      }
    }
  }
}

export interface PayWagesContext {
  workers: Record<WorkerTypeId, Worker[]>;
  equippedModules: readonly ShipModule[];
  money: number;
  workerWages: number;
  roundCosts: number;
  log(message: string): void;
}

// Ported verbatim from PortMasters2/server.py pay_wages (lines 937-956).
export function payWages(ctx: PayWagesContext): boolean {
  let total = 0;
  for (const [wtype, list] of Object.entries(ctx.workers) as [WorkerTypeId, Worker[]][]) {
    let wage = WAGES[wtype];
    if (hasModule(ctx, 'artisans_workshop')) wage = Math.trunc(wage * 1.2);
    total += wage * list.length;
  }
  if (total === 0) return true;
  if (ctx.money >= total) {
    ctx.money -= total;
    ctx.workerWages += total;
    ctx.roundCosts += total;
    return true;
  }
  ctx.log(`⚠️ 工资不足，${total}金币`);
  return false;
}

export interface PayMaintenanceContext extends ResolvePirateHazardContext {
  fixedCost: number;
  maintenancePenalty: number;
  maintenanceCosts: number;
}

// Ported verbatim from PortMasters2/server.py pay_maintenance (lines 958-970).
export function payMaintenance(ctx: PayMaintenanceContext, rng: Rng): boolean {
  const cost = ctx.fixedCost + ctx.maintenancePenalty;
  resolvePirateHazard(ctx, rng);
  if (ctx.money >= cost) {
    ctx.money -= cost;
    ctx.maintenanceCosts += cost;
    ctx.roundCosts += cost;
    ctx.totalCosts += cost;
    return true;
  }
  ctx.money = 0;
  ctx.log('⚠️ 维护费不足，破产');
  return false;
}
