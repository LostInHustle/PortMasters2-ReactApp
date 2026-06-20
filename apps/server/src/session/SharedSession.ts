import {
  DEFAULT_DIFFICULTY,
  MAX_ROOM_PLAYERS,
  MIN_ROOM_PLAYERS,
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

// Generalizes PortMasters2/server.py's GameSession (the prototype's own merge of its earlier
// SharedSession with room hosting for 2-5 players): one object covers both the pre-voyage lobby
// (`started === false`, players free to join/leave, no PlayerGame instances yet) and the live
// voyage (`started === true`). A 1:1 invite is just the degenerate case -- a room of size 2 that
// calls start() immediately instead of waiting in the lobby -- so the two flows share this one
// class rather than duplicating session construction. The phase state-machine
// (_active_phase/_set_phase/advance), the monsoon resync, and the barter-order bookkeeping each
// live in their own module in apps/server/src/game (phaseAdvance.ts, monsoonSync.ts,
// tradeOrders.ts) since none of them need anything SharedSession-specific beyond the games array.
export class SharedSession {
  players: string[];
  host: string;
  maxPlayers: number;
  started = false;
  difficulty: Difficulty;
  tierUnlock: Record<number, number>;
  games: PlayerGame[] = [];
  tradeOrders: TradeOrder[] = [];
  tradeIdCounter = 0;
  tradeReady: boolean[] = [];
  ready = new Set<number>();
  endVotes = new Set<number>();
  chatHistory: ChatMessage[] = [];
  monsoonCycleCache: Record<number, MonsoonState> = {};
  rng: Rng;

  constructor(
    host: string,
    difficulty: Difficulty = DEFAULT_DIFFICULTY,
    maxPlayers: number = MIN_ROOM_PLAYERS,
    rng: Rng = defaultRng,
  ) {
    this.players = [host];
    this.host = host;
    this.maxPlayers = Math.min(MAX_ROOM_PLAYERS, Math.max(MIN_ROOM_PLAYERS, maxPlayers));
    // The agreed difficulty is the room's single source of truth; every fleet (and any later
    // restart) is built from it, so captains can never drift apart.
    this.difficulty = normalizeDifficulty(difficulty);
    this.tierUnlock = difficultyTierUnlock(this.difficulty);
    this.rng = rng;
  }

  // Convenience for the 1:1 invite fast-path (and tests exercising gameplay rather than room
  // lifecycle): builds a 2-player room and launches it immediately, with no lobby wait.
  static createPair(userA: string, userB: string, difficulty?: Difficulty): SharedSession {
    const sess = new SharedSession(userA, difficulty);
    sess.addPlayer(userB);
    sess.start();
    return sess;
  }

  // ---------- Pre-start room lifecycle ----------
  addPlayer(username: string): void {
    this.players.push(username);
  }
  removePlayer(username: string): void {
    this.players = this.players.filter((p) => p !== username);
    if (this.host === username && this.players.length > 0) {
      this.host = this.players[0]!;
    }
  }
  start(): void {
    this.games = this.players.map((_, i) => {
      const game = new PlayerGame(this.difficulty);
      game.slot = i + 1;
      return game;
    });
    this.tradeReady = this.players.map(() => false);
    this.started = true;
    syncMonsoonState(this, this.rng);
  }

  // ---------- Identity ----------
  // A session is only ever looked up by one of its own current players, so indexOf's -1-on-miss
  // is never observed in practice.
  slotOf(username: string): number {
    return this.players.indexOf(username);
  }
  otherPlayers(username: string): string[] {
    return this.players.filter((p) => p !== username);
  }

  // ---------- Synchronized progression ----------
  advance(): void {
    phaseAdvanceFns.advance(this, this.rng);
  }

  gateComplete(): boolean {
    return this.games.every((g, i) => this.ready.has(i) || g.gameOver);
  }

  tradeGateComplete(): boolean {
    return this.games.every((g, i) => this.tradeReady[i] || g.gameOver);
  }

  phaseReadyCount(): number {
    if (phaseAdvanceFns.activePhase(this.games) === 'trade') {
      return this.games.filter((g, i) => this.tradeReady[i] || g.gameOver).length;
    }
    return this.games.filter((g, i) => this.ready.has(i) || g.gameOver).length;
  }

  completeTradeGate(): void {
    phaseAdvanceFns.setPhase(this.games, 'worker_mgmt');
    this.tradeReady = this.games.map(() => false);
    this.tradeOrders = [];
    this.ready.clear();
  }

  restart(): void {
    // A restart keeps the difficulty and roster the room originally agreed on.
    this.start();
    this.tradeOrders = [];
    this.ready.clear();
    this.monsoonCycleCache = {};
  }

  // ---------- End-session vote ----------
  // Unlike gateComplete, a bankrupt/finished player is NOT auto-counted here -- disbanding the
  // room is a bigger decision than advancing a phase, so every single player must explicitly
  // opt in, matching the prototype's stricter quorum.
  endVoteComplete(): boolean {
    return this.endVotes.size === this.players.length;
  }

  // ---------- Waiting hints ----------
  waitingMessage(slot: number): string | null {
    const game = this.games[slot]!;
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
    sellerSlot: number,
    sellItems: unknown,
    buyItems: unknown,
  ): TradeOrder | undefined {
    return createTradeOrder(this, sellerSlot, sellItems, buyItems);
  }
  acceptTrade(orderId: unknown, buyerSlot: number): boolean {
    return acceptTrade(this, orderId, buyerSlot);
  }
  rejectTrade(orderId: unknown): TradeOrder | undefined {
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
