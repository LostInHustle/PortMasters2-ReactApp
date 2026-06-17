import type { BoonModifiers, MonsoonState, ShipModule } from '@pm2/shared';
import { escortCost, hasModule } from './costCalculations.js';
import { pirateLossPct } from './difficultyRules.js';
import { pythonRound } from './mathUtil.js';
import type { Rng } from './randomUtil.js';

export interface PirateRiskContext {
  monsoonState: MonsoonState | null;
  brokerPirateRisk: number;
  pirateImmunity: boolean;
  modifierFlags: BoonModifiers;
  equippedModules: readonly ShipModule[];
}

// Ported verbatim from PortMasters2/server.py pirate_threat (lines 994-996): the raw raid
// chance before mitigation -- the weather plus any corrupt-broker tips.
export function pirateThreat(
  ctx: Pick<PirateRiskContext, 'monsoonState' | 'brokerPirateRisk'>,
): number {
  return (ctx.monsoonState?.pirateRisk ?? 0) + ctx.brokerPirateRisk;
}

// Ported verbatim from PortMasters2/server.py effective_pirate_risk (lines 998-1009): final
// raid probability for this upkeep after escort/compass mitigation, clamped to [0, 1].
export function effectivePirateRisk(ctx: PirateRiskContext): number {
  if (ctx.pirateImmunity) return 0;
  let risk = pirateThreat(ctx);
  if (ctx.modifierFlags.pirateRiskDiscount) {
    risk *= 1 - ctx.modifierFlags.pirateRiskDiscount;
  }
  if (hasModule(ctx, 'persian_dome_compass')) {
    risk *= 0.7;
  }
  return Math.max(0, Math.min(1, risk));
}

export interface ResolvePirateHazardContext extends PirateRiskContext {
  money: number;
  roundCosts: number;
  totalCosts: number;
  difficulty: unknown;
  currentRound: number;
  maxRounds: number;
  log(message: string): void;
}

// Ported verbatim from PortMasters2/server.py resolve_pirate_hazard (lines 1011-1023).
export function resolvePirateHazard(ctx: ResolvePirateHazardContext, rng: Rng): void {
  if (pirateThreat(ctx) <= 0) return;
  if (ctx.pirateImmunity) {
    ctx.log('🛡️ 护航舰队震慑海盗，本程无损');
    return;
  }
  if (rng.random() < effectivePirateRisk(ctx)) {
    const pct = pirateLossPct(ctx.difficulty, ctx.currentRound, ctx.maxRounds);
    const loss = Math.trunc(ctx.money * pct);
    ctx.money -= loss;
    ctx.roundCosts += loss;
    ctx.totalCosts += loss;
    ctx.log(`🏴‍☠️ 海盗袭扰，损失${loss}金币（财富的${pythonRound(pct * 100)}%）`);
  }
}

export interface HireEscortContext {
  pirateImmunity: boolean;
  money: number;
  roundCosts: number;
  totalCosts: number;
  modifierFlags: BoonModifiers;
  log(message: string): void;
}

// Ported verbatim from PortMasters2/server.py hire_escort (lines 979-992).
export function hireEscort(ctx: HireEscortContext): boolean {
  if (ctx.pirateImmunity) {
    ctx.log('🛡️ 护航舰队已就位');
    return false;
  }
  const cost = escortCost(ctx);
  if (ctx.money < cost) {
    ctx.log(`❌ 需要${cost}金币才能雇佣护航`);
    return false;
  }
  ctx.money -= cost;
  ctx.roundCosts += cost;
  ctx.totalCosts += cost;
  ctx.pirateImmunity = true;
  ctx.log(`🛡️ 雇佣护航，花费${cost}金币`);
  return true;
}
