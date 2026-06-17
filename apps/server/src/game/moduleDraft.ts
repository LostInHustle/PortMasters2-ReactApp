import type { ModuleId, ShipModule } from '@pm2/shared';
import { hasModule } from './costCalculations.js';
import { modulePool } from './poolSelectors.js';
import type { Rng } from './randomUtil.js';

export interface ModuleDraftContext {
  currentRound: number;
  tierUnlock: Record<number, number>;
  shipLevel: number;
  equippedModules: ShipModule[];
  draftChoices: ShipModule[];
  draftOpen: boolean;
  draftRolled: boolean;
  draftRerolled: boolean;
  shipUpgradePenalty: number;
  maintenancePenalty: number;
  intelCost: number;
  log(message: string): void;
}

// Ported verbatim from PortMasters2/server.py _roll_module_batch (lines 772-779): up to 3
// options, preferring modules not yet installed.
function rollModuleBatch(ctx: ModuleDraftContext, rng: Rng): void {
  const tierPool = modulePool(ctx.currentRound, ctx.tierUnlock);
  const available = tierPool.filter((m) => !hasModule(ctx, m.id as ModuleId));
  const pool = available.length >= 3 ? available : tierPool;
  const copy = [...pool];
  rng.shuffle(copy);
  ctx.draftChoices = copy.slice(0, 3);
}

// Ported verbatim from PortMasters2/server.py start_module_draft (lines 781-792): the batch is
// rolled once per round and then fixed, so closing and reopening shows the same options.
export function startModuleDraft(ctx: ModuleDraftContext, rng: Rng): boolean {
  if (ctx.shipLevel === 0) {
    ctx.log('❌ 旗舰尚无模块槽位，请先升级船坞');
    return false;
  }
  if (!ctx.draftRolled) {
    rollModuleBatch(ctx, rng);
    ctx.draftRolled = true;
  }
  ctx.draftOpen = true;
  return true;
}

// Ported verbatim from PortMasters2/server.py reroll_module_draft (lines 794-807): the
// once-per-round "Change Batch."
export function rerollModuleDraft(ctx: ModuleDraftContext, rng: Rng): boolean {
  if (ctx.shipLevel === 0) {
    ctx.log('❌ 旗舰尚无模块槽位，请先升级船坞');
    return false;
  }
  if (ctx.draftRerolled) {
    ctx.log('❌ 本回合的「换一批」已经用过了');
    return false;
  }
  rollModuleBatch(ctx, rng);
  ctx.draftRolled = true;
  ctx.draftRerolled = true;
  ctx.draftOpen = true;
  ctx.log('🔀 已更换一批可选模块');
  return true;
}

// Ported verbatim from PortMasters2/server.py equip_module (lines 809-835).
export function equipModule(ctx: ModuleDraftContext, mod: ShipModule, swapIdx?: number): boolean {
  if (hasModule(ctx, mod.id as ModuleId)) {
    ctx.log('❌ 已经装备了该模块');
    return false;
  }
  if (swapIdx !== undefined) {
    if (swapIdx < 0 || swapIdx >= ctx.equippedModules.length) {
      return false;
    }
    const old = ctx.equippedModules[swapIdx]!;
    if (old.id === 'bulk_hauler') ctx.shipUpgradePenalty -= 15;
    if (old.id === 'overdrive_engine') ctx.maintenancePenalty -= 10;
    if (old.id === 'brokers_network') ctx.intelCost = 5;
    ctx.equippedModules[swapIdx] = mod;
    ctx.log(`🔄 将 ${old.name} 替换为 ${mod.name}！`);
  } else if (ctx.equippedModules.length < ctx.shipLevel) {
    ctx.equippedModules.push(mod);
    ctx.log(`✅ 安装了 ${mod.name}！`);
  } else {
    ctx.log('❌ 没有空置槽位，必须替换现有模块');
    return false;
  }
  if (mod.id === 'bulk_hauler') ctx.shipUpgradePenalty += 15;
  if (mod.id === 'overdrive_engine') ctx.maintenancePenalty += 10;
  if (mod.id === 'brokers_network') ctx.intelCost = 2;
  ctx.draftChoices = ctx.draftChoices.filter((m) => m.id !== mod.id);
  ctx.draftOpen = false;
  return true;
}
