import { WORKER_TYPES_BACKEND, type MarketCard, type PlayerGameState, type Worker } from '@pm2/shared';
import type { PlayerGame } from './PlayerGame.js';
import { difficultyBrokerCorruption, pirateLossPct } from './difficultyRules.js';
import { charterEvent } from './poolSelectors.js';

type WorkerRosterFields = Pick<
  PlayerGameState,
  | 'weavers'
  | 'masterWeavers'
  | 'sachetMakers'
  | 'coppersmiths'
  | 'potters'
  | 'perfumers'
  | 'jewelers'
>;

function flattenWorkerRosters(game: PlayerGame): WorkerRosterFields {
  return Object.fromEntries(
    WORKER_TYPES_BACKEND.map((w): [string, Worker[]] => [w.attr, game.workers[w.id]]),
  ) as WorkerRosterFields;
}

// Stamps each Procure card with what it actually costs right now, given this player's active
// boons and modules, so the client never has to re-derive (and risk drifting from) the discount
// math that already lives in costCalculations.ts. game.resourceCards itself is left untouched --
// this only shapes the copy that goes out over the wire.
function withCardPricing(game: PlayerGame, card: MarketCard): MarketCard {
  const unitPrices = game.getCardResourceUnitPrices(card);
  return {
    ...card,
    effectiveCost: game.getCardFinalCost(card),
    resources: card.resources.map((r, i) => ({ ...r, effectivePrice: unitPrices[i] })),
  };
}

// Ported verbatim from PortMasters2/server.py PlayerGame.to_dict() (lines 1073-1129): the literal
// wire contract for this player's "state" payload. Two fields are deliberately NOT raw references
// to internal state -- intelRemaining exposes only the length of phase2DemandTags (the tags
// themselves are server-side fog of war), and logs sends only the last 10 entries, matching
// self.lastLogs[-10:] exactly.
export function serializePlayerGame(game: PlayerGame): PlayerGameState {
  return {
    inventory: game.inventory,
    money: game.money,
    score: game.score,
    currentRound: game.currentRound,
    maxRounds: game.maxRounds,
    difficulty: game.difficulty,
    charterEvent: charterEvent(game.currentRound, game.tierUnlock) ?? null,
    unlockedResources: game.unlockedResources(),
    unlockedProducts: game.unlockedProducts(),
    unlockedPorts: game.unlockedPorts(),
    unlockedWorkerTypes: game.unlockedWorkerTypes(),
    shipLevel: game.shipLevel,
    equippedModules: game.equippedModules,
    draftChoices: game.draftChoices,
    draftOpen: game.draftOpen,
    draftRerolled: game.draftRerolled,
    phase: game.phase,
    resourceCards: game.resourceCards.map((card) => withCardPricing(game, card)),
    customerCards: game.customerCards,
    purchaseCount: game.purchaseCount,
    orderCount: game.orderCount,
    purchasedCards: [...game.purchasedCards],
    completedOrders: [...game.completedOrders],
    ...flattenWorkerRosters(game),
    modifierFlags: game.modifierFlags,
    monsoon_state: game.monsoonState,
    pirate_immunity: game.pirateImmunity,
    pirateLossPct: pirateLossPct(game.difficulty, game.currentRound, game.maxRounds),
    pirateRiskEffective: game.effectivePirateRisk(),
    brokerCorruption: difficultyBrokerCorruption(game.difficulty),
    escortCost: game.escortCost(),
    intelCost: game.intelCost,
    revealedIntel: game.revealedIntel,
    intelRemaining: game.phase2DemandTags.length,
    boonChoices: game.boonChoices,
    lastRoundSummary: game.lastRoundSummary,
    gameOver: game.gameOver,
    bankrupt: game.bankrupt,
    fixedCost: game.fixedCost,
    maintenancePenalty: game.maintenancePenalty,
    workerWages: game.workerWages,
    estimatedWages: game.estimatedWages(),
    roundRevenue: game.roundRevenue,
    roundCosts: game.roundCosts,
    shipUpgradeCost: game.shipUpgradeCost,
    shipUpgradePenalty: game.shipUpgradePenalty,
    logs: game.lastLogs.slice(-10),
    logSeq: game.logSeq,
    slot: game.slot,
  };
}
