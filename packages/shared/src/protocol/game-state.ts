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

// Ported from PortMasters2/server.py's MIN_ROOM_PLAYERS/MAX_ROOM_PLAYERS module constants:
// shared by the server (clamping/validating room size) and the client (the create-room and
// roster UI), so the allowed range only ever needs to change in one place.
export const MIN_ROOM_PLAYERS = 2;
export const MAX_ROOM_PLAYERS = 5;

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
  /**
   * Not part of the original port: what payWages will actually charge for the current roster at
   * the next Upkeep (every worker type, with artisans_workshop's wage markup applied), so the
   * Procure/Artisans "Due This Round" preview never has to re-derive this and risk drifting from
   * the real charge. workerWages above stays the original's post-settlement bookkeeping field
   * (0 until Upkeep actually runs); this is the live, forward-looking figure shown before that.
   */
  estimatedWages: number;
  roundRevenue: number;
  roundCosts: number;
  shipUpgradeCost: readonly [number, number, number];
  shipUpgradePenalty: number;
  logs: string[];
  logSeq: number;
  slot: number | null;
}

// A captain's entry in the room roster -- name, online status, and whether they're the host (who
// alone may start the voyage while the room hasn't launched yet).
export interface RosterPlayer {
  name: string;
  online: boolean;
  isHost: boolean;
}

// Ported from PortMasters2/server.py GameSession.broadcast_state's per-recipient state dict,
// generalized from a single partner to a room of 2-5: otherGames/players replace the old
// singular otherGame/partnerName/partnerOnline now that there can be more than one fellow
// captain, and the end-session vote tally rides along so every client can show live consensus.
export interface SessionStateMessage {
  tradeOrders: TradeOrder[];
  tradeReady: boolean[];
  phaseReadyCount: number;
  phaseTotalCount: number;
  yourGame: PlayerGameState;
  otherGames: Record<string, PlayerGameState>;
  waitingForOther: string | null;
  youReady: boolean;
  yourSlot: number;
  host: string;
  maxPlayers: number;
  players: RosterPlayer[];
  endSessionVotes: number;
  endSessionTotal: number;
  youVotedEnd: boolean;
}

// The roster of a room, broadcast to its current members both before and after it starts --
// the pre-start "Host a voyage" lobby view and the in-game roster panel read the same shape.
export interface RoomRosterMessage {
  host: string;
  difficulty: Difficulty;
  maxPlayers: number;
  started: boolean;
  players: RosterPlayer[];
}

// One row of the lobby's "Open rooms" browse list -- every online player sees this for every
// room that hasn't started yet, so they can pick one to join.
export interface OpenRoomSummary {
  host: string;
  difficulty: Difficulty;
  count: number;
  maxPlayers: number;
}

// Reply to the unauthenticated `resume_token` action -- a separate message type from
// login_result (rather than reusing it) so the client can tell a silent, automatic resume
// attempt apart from an interactive login the player actually typed: a failed interactive login
// should show "wrong password," but a failed silent resume (an unknown/expired/already-revoked
// token) should just fall back to the ordinary login screen with no alarming message.
export interface ResumeResultMessage {
  success: boolean;
  username?: string;
}
