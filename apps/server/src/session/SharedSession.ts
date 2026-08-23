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
// voyage (`started === true`). A 1:1 invite is just the degenerate case, a room of size 2 that
// calls start() immediately instead of waiting in the lobby, so the two flows share this one
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
  // Set while every member is offline, counting down to recycling the voyage. A page refresh
  // briefly takes the last player offline, so the session has to outlive that gap.
  reapTimer: ReturnType<typeof setTimeout> | null = null;
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
  // Builds fresh per player game state from the current roster and moves the room from lobby to
  // live play. Every field that describes progress through a voyage is reset here, so this is
  // also the whole of what a restart needs to do.
  //
  // The end session votes matter most: they are the one piece of session state that decides
  // whether the room is disbanded, and they used to survive a restart. In a room of three where
  // two captains had voted to end before the last game finished, the very first vote in the new
  // game completed the quorum and threw everyone back to the lobby mid voyage.
  //
  // The monsoon cache is cleared before the sync below rather than after it, so the new voyage
  // rolls its own weather instead of reading a cycle the previous one had already decided.
  start(): void {
    this.games = this.players.map((_, i) => {
      const game = new PlayerGame(this.difficulty);
      game.slot = i + 1;
      return game;
    });
    this.tradeReady = this.players.map(() => false);
    this.tradeOrders = [];
    this.ready.clear();
    this.endVotes.clear();
    this.monsoonCycleCache = {};
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

  // A restart keeps the difficulty and roster the room originally agreed on, and is otherwise
  // exactly a fresh start. Keeping the reset list in one place is the point: the previous split
  // between the two is how the end session votes came to be missed.
  restart(): void {
    this.start();
  }

  // ---------- End-session vote ----------
  // Unlike gateComplete, a bankrupt/finished player is NOT auto-counted here, disbanding the
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
    targetSlot?: unknown,
  ): TradeOrder | undefined {
    return createTradeOrder(this, sellerSlot, sellItems, buyItems, targetSlot);
  }
  acceptTrade(orderId: unknown, buyerSlot: number): boolean {
    return acceptTrade(this, orderId, buyerSlot);
  }
  rejectTrade(orderId: unknown, rejecterSlot: number): TradeOrder | undefined {
    return rejectTrade(this, orderId, rejecterSlot);
  }

  // ---------- Chat ----------
  addChat(sender: string, message: string): void {
    this.chatHistory.push({ from: sender, message });
    if (this.chatHistory.length > CHAT_HISTORY_LIMIT) {
      this.chatHistory.shift();
    }
  }
}
