import type { Boon, BoonModifiers } from '../data/boons.js';
import type { CharterEvent } from '../data/charter-events.js';
import type { ItemId } from '../data/commodities.js';
import type { Difficulty } from '../data/difficulties.js';
import type { ShipModule } from '../data/modules.js';
import type { MonsoonState } from '../data/monsoon.js';
import type { PortId } from '../data/ports.js';
import type { ProductId } from '../data/products.js';
import type { ResourceId } from '../data/resources.js';
import type { WorkerTypeId } from '../data/wages-workers.js';
import type { CustomerOrder, MarketCard } from '../domain/cards.js';
import type { IntelClue } from '../domain/intel.js';
import type { TradeOrder } from '../domain/trade.js';
import type { Worker } from '../domain/worker.js';

// Ported verbatim from PortMasters2/server.py PlayerGame.__init__ (line 467): a deliberately
// mixed int/string enum, preserved as-is rather than cleaned into a string union -- see the
// plan's "phase encoding" decision.
export type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 'trade' | 'worker_mgmt' | 'bankruptcy' | 'endgame';

// Ported verbatim from PortMasters2/server.py end_round (lines 1038-1045).
export interface RoundSummary {
  round: number;
  revenue: number;
  costs: number;
  incomeTax: number;
  money: number;
  score: number;
}

// Ported verbatim from PortMasters2/server.py PlayerGame.to_dict() (lines 1073-1129): the
// literal wire contract sent to the client as this player's "state" payload. Field names and
// order mirror the Python dict exactly, including the two snake_case keys (monsoon_state,
// pirate_immunity) the original frontend reads literally -- this is not a typo to "fix".
export interface PlayerGameState {
  inventory: Record<ItemId, number>;
  money: number;
  score: number;
  currentRound: number;
  maxRounds: number;
  difficulty: Difficulty;
  charterEvent: CharterEvent | null;
  unlockedResources: ResourceId[];
  unlockedProducts: ProductId[];
  unlockedPorts: PortId[];
  unlockedWorkerTypes: WorkerTypeId[];
  shipLevel: number;
  equippedModules: ShipModule[];
  draftChoices: ShipModule[];
  draftOpen: boolean;
  draftRerolled: boolean;
  phase: Phase;
  resourceCards: MarketCard[];
  customerCards: CustomerOrder[];
  purchaseCount: number;
  orderCount: number;
  purchasedCards: number[];
  completedOrders: number[];
  weavers: Worker[];
  masterWeavers: Worker[];
  sachetMakers: Worker[];
  coppersmiths: Worker[];
  potters: Worker[];
  perfumers: Worker[];
  jewelers: Worker[];
  modifierFlags: BoonModifiers;
  monsoon_state: MonsoonState | null;
  pirate_immunity: boolean;
  pirateLossPct: number;
  pirateRiskEffective: number;
  brokerCorruption: boolean;
  escortCost: number;
  intelCost: number;
  revealedIntel: IntelClue[];
  intelRemaining: number;
  boonChoices: Boon[];
  lastRoundSummary: RoundSummary | null;
  gameOver: boolean;
  bankrupt: boolean;
  fixedCost: number;
  maintenancePenalty: number;
  workerWages: number;
  roundRevenue: number;
  roundCosts: number;
  shipUpgradeCost: readonly [number, number, number];
  shipUpgradePenalty: number;
  logs: string[];
  logSeq: number;
  slot: 1 | 2 | null;
}

// Ported verbatim from PortMasters2/server.py SharedSession.broadcast_state's per-recipient
// state dict (lines 1458-1469) -- the "state" message payload pushed after every action.
export interface SessionStateMessage {
  tradeOrders: TradeOrder[];
  tradeReady: [boolean, boolean];
  phaseReadyCount: number;
  yourGame: PlayerGameState;
  otherGame: PlayerGameState;
  waitingForOther: string | null;
  youReady: boolean;
  yourSlot: 1 | 2;
  partnerName: string;
  partnerOnline: boolean;
}
