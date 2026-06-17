import {
  DEFAULT_DIFFICULTY,
  type ChatMessage,
  type Difficulty,
  type MonsoonState,
  type TradeOrder,
} from '@pm2/shared';
import { difficultyTierUnlock, normalizeDifficulty } from '../game/difficultyRules.js';
import { syncMonsoonState } from '../game/monsoonSync.js';
import * as phaseAdvanceFns from '../game/phaseAdvance.js';
import { PlayerGame } from '../game/PlayerGame.js';
import { defaultRng, type Rng } from '../game/randomUtil.js';
import { acceptTrade, createTradeOrder, rejectTrade } from '../game/tradeOrders.js';

const CHAT_HISTORY_LIMIT = 200;

// Ported verbatim from PortMasters2/server.py SharedSession (lines 1208-1447). The phase
// state-machine (_active_phase/_set_phase/advance), the monsoon resync, and the barter-order
// bookkeeping each ported into their own module in apps/server/src/game (phaseAdvance.ts,
// monsoonSync.ts, tradeOrders.ts) since none of them need anything SharedSession-specific beyond
// the two PlayerGame instances -- this class is the thin orchestrator the plan calls for,
// wiring those modules together rather than re-implementing them.
export class SharedSession {
  players: readonly [string, string];
  difficulty: Difficulty;
  tierUnlock: Record<number, number>;
  games: [PlayerGame, PlayerGame];
  tradeOrders: TradeOrder[] = [];
  tradeIdCounter = 0;
  tradeReady: [boolean, boolean] = [false, false];
  ready = new Set<number>();
  chatHistory: ChatMessage[] = [];
  monsoonCycleCache: Record<number, MonsoonState> = {};
  rng: Rng;

  constructor(
    userA: string,
    userB: string,
    difficulty: Difficulty = DEFAULT_DIFFICULTY,
    rng: Rng = defaultRng,
  ) {
    this.players = [userA, userB];
    // The agreed difficulty is the session's single source of truth; both fleets and any later
    // restart are built from it, so the two captains can never drift apart.
    this.difficulty = normalizeDifficulty(difficulty);
    this.tierUnlock = difficultyTierUnlock(this.difficulty);
    this.games = [new PlayerGame(this.difficulty), new PlayerGame(this.difficulty)];
    this.games[0].slot = 1;
    this.games[1].slot = 2;
    this.rng = rng;
    syncMonsoonState(this, rng);
  }

  // ---------- Identity ----------
  // Python's list.index() raises on an unknown username; a session is only ever looked up by
  // one of its own two authenticated players, so that case can't happen here either -- indexOf's
  // -1-on-miss is never observed in practice.
  slotOf(username: string): 0 | 1 {
    return this.players.indexOf(username) as 0 | 1;
  }
  partnerOf(username: string): string {
    return this.players[1 - this.slotOf(username)]!;
  }

  // ---------- Synchronized progression ----------
  advance(): void {
    phaseAdvanceFns.advance(this, this.rng);
  }

  gateComplete(): boolean {
    return [0, 1].every((i) => this.ready.has(i) || this.games[i]!.gameOver);
  }

  tradeGateComplete(): boolean {
    return [0, 1].every((i) => this.tradeReady[i] || this.games[i]!.gameOver);
  }

  phaseReadyCount(): number {
    if (phaseAdvanceFns.activePhase(this.games) === 'trade') {
      return [0, 1].filter((i) => this.tradeReady[i] || this.games[i]!.gameOver).length;
    }
    return [0, 1].filter((i) => this.ready.has(i) || this.games[i]!.gameOver).length;
  }

  completeTradeGate(): void {
    phaseAdvanceFns.setPhase(this.games, 'worker_mgmt');
    this.tradeReady = [false, false];
    this.tradeOrders = [];
    this.ready.clear();
  }

  restart(): void {
    // A restart keeps the difficulty the two captains originally agreed on.
    this.games = [new PlayerGame(this.difficulty), new PlayerGame(this.difficulty)];
    this.games[0].slot = 1;
    this.games[1].slot = 2;
    this.tradeOrders = [];
    this.tradeReady = [false, false];
    this.ready.clear();
    this.monsoonCycleCache = {};
    syncMonsoonState(this, this.rng);
  }

  // ---------- Waiting hints ----------
  waitingMessage(slot: 0 | 1): string | null {
    const game = this.games[slot];
    if (game.phase === 'trade') {
      if (!this.tradeReady[slot]) return '请点击“准备就绪”以进入工匠管理';
      if (!this.tradeGateComplete()) return '等待对方也点击准备就绪...';
      return null;
    }
    if (this.ready.has(slot) && !this.gateComplete()) {
      return '已准备，等待对方点击继续...';
    }
    return null;
  }

  // ---------- Barter trades ----------
  createTradeOrder(
    sellerSlot: 0 | 1,
    sellItems: unknown,
    buyItems: unknown,
  ): TradeOrder | undefined {
    return createTradeOrder(this, sellerSlot, sellItems, buyItems);
  }
  acceptTrade(orderId: string, buyerSlot: 0 | 1): boolean {
    return acceptTrade(this, orderId, buyerSlot);
  }
  rejectTrade(orderId: string): TradeOrder | undefined {
    return rejectTrade(this, orderId);
  }

  // ---------- Chat ----------
  addChat(sender: string, message: string): void {
    this.chatHistory.push({ from: sender, message });
    if (this.chatHistory.length > CHAT_HISTORY_LIMIT) {
      this.chatHistory.shift();
    }
  }
}
