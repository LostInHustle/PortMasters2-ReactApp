import {
  BROKER_CORRUPTION_CHANCE,
  BROKER_CORRUPTION_RISK,
  type IntelClue,
  type ItemId,
  type PortId,
  type ShipModule,
} from '@pm2/shared';
import { hasModule } from './costCalculations.js';
import { difficultyBrokerCorruption } from './difficultyRules.js';
import { pythonRound } from './mathUtil.js';
import type { Rng } from './randomUtil.js';

export interface BrokerIntelContext {
  phase2DemandTags: ItemId[];
  revealedIntel: IntelClue[];
  unlockedPorts(): PortId[];
  money: number;
  intelCost: number;
  equippedModules: readonly ShipModule[];
  difficulty: unknown;
  brokerPirateRisk: number;
  log(message: string): void;
}

// Ported verbatim from PortMasters2/server.py _reveal_intel (lines 837-848).
function revealIntel(ctx: BrokerIntelContext, rng: Rng, count: number): number {
  let revealed = 0;
  for (let i = 0; i < count; i++) {
    if (ctx.phase2DemandTags.length === 0) break;
    const item = rng.choice(ctx.phase2DemandTags);
    ctx.phase2DemandTags.splice(ctx.phase2DemandTags.indexOf(item), 1);
    const port = rng.choice(ctx.unlockedPorts());
    ctx.revealedIntel.push({ item, port, used: false });
    ctx.log(`🗣️ 牙行密语：'来自${port}的消息，对${item}的需求很大！'`);
    revealed += 1;
  }
  return revealed;
}

// Ported verbatim from PortMasters2/server.py purchase_intel (lines 850-864): Broker's Network
// reveals 2 clues per purchase instead of 1, and Ocean-Going Interpreter adds 1 more on top.
export function purchaseIntel(ctx: BrokerIntelContext, rng: Rng): boolean {
  if (ctx.phase2DemandTags.length === 0) {
    ctx.log('🔮 牙行已无更多密语...');
    return false;
  }
  if (ctx.money < ctx.intelCost) {
    ctx.log(`❌ 需要${ctx.intelCost}金币才能购买消息`);
    return false;
  }
  let count = hasModule(ctx, 'brokers_network') ? 2 : 1;
  if (hasModule(ctx, 'ocean_relay')) count += 1;
  ctx.money -= ctx.intelCost;
  revealIntel(ctx, rng, count);
  maybeCorruptBroker(ctx, rng);
  return true;
}

// Ported verbatim from PortMasters2/server.py _maybe_corrupt_broker (lines 866-874): in modes
// with the hazard enabled, a paid whisper may come from a corrupt broker who tips off pirates,
// raising this round's raid chance. Tips stack across the round.
function maybeCorruptBroker(ctx: BrokerIntelContext, rng: Rng): void {
  if (!difficultyBrokerCorruption(ctx.difficulty)) return;
  if (rng.random() < BROKER_CORRUPTION_CHANCE) {
    ctx.brokerPirateRisk += BROKER_CORRUPTION_RISK;
    ctx.log(
      `🕵️ 这名牙行形迹可疑，疑似走漏了你的行踪，本程海盗风险上升${pythonRound(BROKER_CORRUPTION_RISK * 100)}%！`,
    );
  }
}
