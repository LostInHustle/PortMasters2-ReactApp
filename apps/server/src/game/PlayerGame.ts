import {
  DEFAULT_DIFFICULTY,
  MONSOON_TIER0,
  PRODUCTS,
  RESOURCES,
  WORKER_TYPES_BACKEND,
  type Boon,
  type BoonModifiers,
  type CustomerOrder,
  type Difficulty,
  type IntelClue,
  type ItemId,
  type MarketCard,
  type ModuleId,
  type MonsoonState,
  type OrderResource,
  type Phase,
  type PortId,
  type ProductId,
  type ResourceId,
  type RoundSummary,
  type ShipModule,
  type Worker,
  type WorkerTypeId,
} from '@pm2/shared';
import * as boonFx from './boonEffects.js';
import * as brokerFns from './brokerIntel.js';
import * as cardGen from './cardGeneration.js';
import * as costCalc from './costCalculations.js';
import { difficultyRounds, difficultyTierUnlock, normalizeDifficulty } from './difficultyRules.js';
import * as market from './marketActions.js';
import * as moduleDraftFns from './moduleDraft.js';
import * as pirateFns from './pirateHazard.js';
import * as poolSelectors from './poolSelectors.js';
import * as productionFns from './production.js';
import { defaultRng, type Rng } from './randomUtil.js';
import * as workerFns from './workerActions.js';

function createInitialInventory(): Record<ItemId, number> {
  const inv = Object.fromEntries([...RESOURCES, ...PRODUCTS].map((item) => [item, 0])) as Record<
    ItemId,
    number
  >;
  inv['麻布'] = 8;
  inv['丝绸'] = 5;
  inv['茶叶'] = 3;
  return inv;
}

function createEmptyWorkerRoster(): Record<WorkerTypeId, Worker[]> {
  return Object.fromEntries(
    WORKER_TYPES_BACKEND.map((w): [WorkerTypeId, Worker[]] => [w.id, []]),
  ) as Record<WorkerTypeId, Worker[]>;
}

// Ported verbatim from PortMasters2/server.py PlayerGame (lines 441-1129). State fields mirror
// __init__ (lines 442-493) exactly; methods are thin delegators onto the free functions in this
// directory, each named after its Python counterpart. One deliberate addition not present in the
// original: an injectable `rng` (defaults to real Math.random-backed randomness), the seam the
// plan calls for so tests can run this class against a fixed sequence instead of live randomness.
export class PlayerGame {
  difficulty: Difficulty;
  tierUnlock: Record<number, number>;
  inventory: Record<ItemId, number>;
  money = 100;
  score = 0;
  currentRound = 1;
  maxRounds: number;
  totalRevenue = 0;
  totalCosts = 0;
  materialCosts = 0;
  workerWages = 0;
  maintenanceCosts = 0;
  vatPaid = 0;
  incomeTaxPaid = 0;
  roundRevenue = 0;
  roundCosts = 0;
  workers: Record<WorkerTypeId, Worker[]>;
  fixedCost = 15;
  shipLevel = 0;
  shipUpgradeCost: readonly [number, number, number] = [15, 25, 40];
  shipUpgradePenalty = 0;
  maintenancePenalty = 0;
  phase: Phase = 0;
  resourceCards: MarketCard[] = [];
  customerCards: CustomerOrder[] = [];
  purchasedCards = new Set<number>();
  completedOrders = new Set<number>();
  purchaseCount = 0;
  orderCount = 0;
  gameOver = false;
  bankrupt = false;
  modifierFlags: BoonModifiers = {};
  monsoonState: MonsoonState | null;
  pirateImmunity = false;
  brokerPirateRisk = 0;
  phase2DemandTags: ItemId[] = [];
  revealedIntel: IntelClue[] = [];
  intelCost = 5;
  boonChoices: Boon[] = [];
  equippedModules: ShipModule[] = [];
  draftChoices: ShipModule[] = [];
  draftOpen = false;
  draftRolled = false;
  draftRerolled = false;
  lastRoundSummary: RoundSummary | null = null;
  lastLogs: string[] = [];
  logSeq = 0;
  /** Injected by SharedSession (Phase 3). */
  slot: 1 | 2 | null = null;
  rng: Rng;

  constructor(difficulty: Difficulty = DEFAULT_DIFFICULTY, rng: Rng = defaultRng) {
    this.difficulty = normalizeDifficulty(difficulty);
    this.tierUnlock = difficultyTierUnlock(this.difficulty);
    this.inventory = createInitialInventory();
    this.maxRounds = difficultyRounds(this.difficulty);
    this.workers = createEmptyWorkerRoster();
    this.monsoonState = { ...MONSOON_TIER0[0] };
    this.rng = rng;
  }

  // Ported verbatim from PortMasters2/server.py log (lines 495-499): caps history at 100 lines;
  // to_dict()/serialize.ts only ever sends the last 10 of these.
  log(message: string): void {
    this.lastLogs.push(message);
    this.logSeq += 1;
    if (this.lastLogs.length > 100) {
      this.lastLogs.shift();
    }
  }

  // ---------- Silk Road Charter: content unlocks ----------
  unlockedResources(): ResourceId[] {
    return poolSelectors.unlockedResources(this.currentRound, this.tierUnlock);
  }
  unlockedProducts(): ProductId[] {
    return poolSelectors.unlockedProducts(this.currentRound, this.tierUnlock);
  }
  unlockedPorts(): PortId[] {
    return poolSelectors.unlockedPorts(this.currentRound, this.tierUnlock);
  }
  unlockedWorkerTypes(): WorkerTypeId[] {
    return poolSelectors.unlockedWorkerTypes(this.currentRound, this.tierUnlock);
  }

  // ---------- Cost calculations ----------
  calcTransportCost(
    totalItems: number,
    hasSilk = false,
    resources?: readonly OrderResource[],
  ): number {
    return costCalc.calcTransportCost(this, totalItems, hasSilk, resources);
  }
  calcVat(product: ProductId, sellingPrice: number): number {
    return costCalc.calcVat(this, product, sellingPrice);
  }
  calcIncomeTax(preTax: number): number {
    return costCalc.calcIncomeTax(this, preTax);
  }
  hasModule(moduleId: ModuleId): boolean {
    return costCalc.hasModule(this, moduleId);
  }
  getCardFinalCost(card: MarketCard): number {
    return costCalc.getCardFinalCost(this, card);
  }
  getHireCost(workerType: WorkerTypeId): number {
    return costCalc.getHireCost(this, workerType);
  }
  escortCost(): number {
    return costCalc.escortCost(this);
  }

  // ---------- Monsoon / environment ----------
  // Ported verbatim from PortMasters2/server.py set_monsoon_state (lines 583-584).
  setMonsoonState(state: MonsoonState): void {
    this.monsoonState = { ...state };
  }
  envPurchasePrice(item: ItemId, price: number): number {
    return cardGen.envPurchasePrice(this, item, price);
  }
  envReward(port: PortId, reward: number): number {
    return cardGen.envReward(this, port, reward);
  }

  // ---------- Card generation ----------
  genEmperorMandateOrder(size: number): CustomerOrder {
    return cardGen.genEmperorMandateOrder(this, size);
  }
  genRawOrder(filterItem?: ResourceId): CustomerOrder {
    return cardGen.genRawOrder(this, this.rng, filterItem);
  }
  genProductOrder(filterItem?: ProductId): CustomerOrder {
    return cardGen.genProductOrder(this, this.rng, filterItem);
  }
  genMixedOrder(): CustomerOrder {
    return cardGen.genMixedOrder(this, this.rng);
  }
  genResourceCard(): MarketCard {
    return cardGen.genResourceCard(this, this.rng);
  }
  genProductPurchaseCard(): MarketCard {
    return cardGen.genProductPurchaseCard(this, this.rng);
  }

  // ---------- Boons ----------
  applyBoon(boon: Boon): void {
    boonFx.applyBoon(this, boon);
  }

  // ---------- Market actions ----------
  purchaseCard(card: MarketCard & { id: number }): boolean {
    return market.purchaseCard(this, card);
  }
  completeOrder(order: CustomerOrder & { id: number }): boolean {
    return market.completeOrder(this, order, this.rng);
  }

  // ---------- Shipyard modules ----------
  startModuleDraft(): boolean {
    return moduleDraftFns.startModuleDraft(this, this.rng);
  }
  rerollModuleDraft(): boolean {
    return moduleDraftFns.rerollModuleDraft(this, this.rng);
  }
  equipModule(mod: ShipModule, swapIdx?: number): boolean {
    return moduleDraftFns.equipModule(this, mod, swapIdx);
  }

  // ---------- Broker intel ----------
  purchaseIntel(): boolean {
    return brokerFns.purchaseIntel(this, this.rng);
  }

  // ---------- Workers ----------
  hireWorker(wtype: WorkerTypeId): boolean {
    return workerFns.hireWorker(this, wtype);
  }
  fireWorker(wtype: WorkerTypeId, idx: number): boolean {
    return workerFns.fireWorker(this, wtype, idx);
  }
  assignTask(wtype: WorkerTypeId, task: ProductId): boolean {
    return workerFns.assignTask(this, wtype, task);
  }

  // ---------- Production / wages / maintenance ----------
  processProduction(): void {
    productionFns.processProduction(this);
  }
  payWages(): boolean {
    return productionFns.payWages(this);
  }
  payMaintenance(): boolean {
    return productionFns.payMaintenance(this, this.rng);
  }

  // ---------- Pirates / escort ----------
  pirateThreat(): number {
    return pirateFns.pirateThreat(this);
  }
  effectivePirateRisk(): number {
    return pirateFns.effectivePirateRisk(this);
  }
  resolvePirateHazard(): void {
    pirateFns.resolvePirateHazard(this, this.rng);
  }
  hireEscort(): boolean {
    return pirateFns.hireEscort(this);
  }

  // Ported verbatim from PortMasters2/server.py end_round (lines 1025-1071): settles income tax,
  // snapshots lastRoundSummary, then resets every per-round counter before advancing the round
  // (or flagging gameOver once currentRound exceeds maxRounds).
  endRound(): void {
    const preTax = this.roundRevenue - this.roundCosts - this.maintenanceCosts - this.workerWages;
    const tax = this.calcIncomeTax(preTax);
    let paidTax = 0;
    if (tax > 0 && this.money >= tax) {
      paidTax = tax;
      this.money -= tax;
      this.incomeTaxPaid += tax;
    } else if (tax > 0 && this.money < tax) {
      paidTax = this.money;
      this.incomeTaxPaid += this.money;
      this.money = 0;
    }
    this.lastRoundSummary = {
      round: this.currentRound,
      revenue: this.roundRevenue,
      costs: this.roundCosts,
      incomeTax: paidTax,
      money: this.money,
      score: this.score,
    };
    this.modifierFlags = {};
    this.pirateImmunity = false;
    this.brokerPirateRisk = 0;
    this.phase2DemandTags = [];
    this.revealedIntel = [];
    this.boonChoices = [];
    this.draftChoices = [];
    this.draftOpen = false;
    this.draftRolled = false;
    this.draftRerolled = false;
    this.roundRevenue = 0;
    this.roundCosts = 0;
    this.maintenanceCosts = 0;
    this.materialCosts = 0;
    this.workerWages = 0;
    this.currentRound += 1;
    if (this.currentRound > this.maxRounds) {
      this.gameOver = true;
      return;
    }
    this.phase = 0;
    this.purchaseCount = 0;
    this.orderCount = 0;
    this.resourceCards = [];
    this.customerCards = [];
    this.purchasedCards.clear();
    this.completedOrders.clear();
  }
}
