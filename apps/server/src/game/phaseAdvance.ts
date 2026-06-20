import type {
  Boon,
  BoonModifiers,
  CustomerOrder,
  ItemId,
  MarketCard,
  Phase,
  ProductId,
  ResourceId,
  TradeOrder,
} from '@pm2/shared';
import { revealIntel, type BrokerIntelContext } from './brokerIntel.js';
import { emperorMandateSize, phaseOptionCount } from './difficultyRules.js';
import { syncMonsoonState, type MonsoonSyncContext, type MonsoonSyncGame } from './monsoonSync.js';
import { boonPool } from './poolSelectors.js';
import type { Rng } from './randomUtil.js';

// The per-game surface advance() needs, layered on the two narrower contexts it delegates to
// (BrokerIntelContext for the free-intel reveal, MonsoonSyncGame for the weather resync).
export interface PhaseAdvanceGame extends BrokerIntelContext, MonsoonSyncGame {
  bankrupt: boolean;
  phase: Phase;
  tierUnlock: Record<number, number>;
  modifierFlags: BoonModifiers;
  boonChoices: Boon[];
  resourceCards: MarketCard[];
  customerCards: CustomerOrder[];
  rng: Rng;
  unlockedResources(): ResourceId[];
  unlockedProducts(): ProductId[];
  genResourceCard(): MarketCard;
  genEmperorMandateOrder(size: number): CustomerOrder;
  genMixedOrder(): CustomerOrder;
  processProduction(): void;
  payWages(): boolean;
  endRound(): void;
}

export interface PhaseAdvanceContext extends MonsoonSyncContext {
  games: readonly PhaseAdvanceGame[];
  tradeReady: boolean[];
  tradeOrders: TradeOrder[];
  ready: Set<number>;
}

// Ported verbatim from PortMasters2/server.py SharedSession._active_phase (lines 1236-1240):
// the session follows whichever player is still playing; if everyone has finished, it doesn't
// matter which, so it falls back to games[0].
export function activePhase(games: readonly PhaseAdvanceGame[]): Phase {
  for (const g of games) {
    if (!g.gameOver) return g.phase;
  }
  return games[0]!.phase;
}

// Ported verbatim from PortMasters2/server.py SharedSession._set_phase (lines 1242-1246):
// players in an end state (bankrupt/finished) stay on their own end-game page and stop
// following the session's phase progression.
export function setPhase(games: readonly PhaseAdvanceGame[], phase: Phase): void {
  for (const g of games) {
    if (!g.gameOver) g.phase = phase;
  }
}

// Ported verbatim from PortMasters2/server.py SharedSession.advance (lines 1275-1345): once
// both players are ready, the whole session advances to the next phase together. This is the
// plan's named file-size-ceiling exception -- one linear phase-sequencing function, kept as a
// single if/else-if chain mirroring the Python if/elif chain branch-for-branch, since splitting
// it further would scatter genuinely cohesive sequencing logic across files.
export function advance(ctx: PhaseAdvanceContext, rng: Rng): void {
  const phase = activePhase(ctx.games);

  if (phase === 0) {
    // Fortune Tides open: resync the monsoon, then each player independently draws 4 random
    // Fortunes from the pool (hidden from and different between players).
    syncMonsoonState(ctx, rng);
    setPhase(ctx.games, 5);
    for (const g of ctx.games) {
      if (g.gameOver) continue;
      const pool = [...boonPool(g.currentRound, g.tierUnlock)];
      g.rng.shuffle(pool);
      g.boonChoices = pool.slice(0, 4);
    }
  } else if (phase === 5) {
    // Procure: deal this round's resource hand, roll fresh demand-intel tags, and reveal any
    // free intel a boon granted.
    setPhase(ctx.games, 1);
    for (const g of ctx.games) {
      if (g.gameOver) continue;
      g.resourceCards = [];
      const optionCount = phaseOptionCount(g.currentRound, g.tierUnlock);
      for (let i = 0; i < optionCount; i++) {
        const c = g.genResourceCard();
        c.id = i;
        g.resourceCards.push(c);
      }
      const demandPool: ItemId[] = [...g.unlockedResources(), ...g.unlockedProducts()];
      g.rng.shuffle(demandPool);
      g.phase2DemandTags = demandPool.slice(0, Math.min(optionCount, demandPool.length));
      g.revealedIntel = [];
      const freeIntel = g.modifierFlags.freeIntel ?? 0;
      if (freeIntel) {
        revealIntel(g, g.rng, freeIntel);
      }
    }
  } else if (phase === 1) {
    // Procure closes, Barter opens: a fresh trade board for this round.
    setPhase(ctx.games, 'trade');
    ctx.tradeReady = ctx.games.map(() => false);
    ctx.tradeOrders = [];
  } else if (phase === 'worker_mgmt') {
    // Barter closes, Artisans opens: deal this round's customer orders, Emperor Mandate first
    // if one is scheduled.
    setPhase(ctx.games, 2);
    for (const g of ctx.games) {
      if (g.gameOver) continue;
      g.customerCards = [];
      let nextId = 0;
      const mandateSize = emperorMandateSize(g.difficulty, g.currentRound);
      if (mandateSize !== undefined) {
        const o = g.genEmperorMandateOrder(mandateSize);
        o.id = nextId;
        g.customerCards.push(o);
        nextId += 1;
      }
      const orderCount =
        phaseOptionCount(g.currentRound, g.tierUnlock) + (g.modifierFlags.extraOrder ?? 0);
      for (let i = nextId; i < orderCount; i++) {
        const o = g.genMixedOrder();
        o.id = i;
        g.customerCards.push(o);
      }
    }
  } else if (phase === 2) {
    // Artisans closes, Upkeep opens: production runs, then wages -- a game that can't pay
    // wages ends right here, bankrupt.
    setPhase(ctx.games, 3);
    for (const g of ctx.games) {
      if (g.gameOver) continue;
      g.processProduction();
      if (!g.payWages()) {
        g.gameOver = true;
        g.bankrupt = true;
        g.phase = 'bankruptcy';
      }
    }
  } else if (phase === 3) {
    for (const g of ctx.games) {
      if (!g.gameOver) g.phase = 4;
    }
  } else if (phase === 4) {
    // Shipyard closes the round: settle income tax and reset per-round counters, then either
    // start the next round or end the game.
    for (const g of ctx.games) {
      if (!g.gameOver) {
        g.endRound();
        g.phase = g.gameOver ? 'endgame' : 0;
      } else if (g.bankrupt) {
        g.phase = 'bankruptcy';
      }
    }
  }

  ctx.ready.clear();
}
