import { MONSOON_TIER0, type MonsoonState } from '@pm2/shared';
import { monsoonPool } from './poolSelectors.js';
import type { Rng } from './randomUtil.js';

export interface MonsoonSyncGame {
  currentRound: number;
  maxRounds: number;
  gameOver: boolean;
  setMonsoonState(state: MonsoonState): void;
}

export interface MonsoonSyncContext {
  games: readonly MonsoonSyncGame[];
  tierUnlock: Record<number, number>;
  monsoonCycleCache: Record<number, MonsoonState>;
}

// Mirrors PortMasters2/server.py SharedSession.sync_monsoon_state.
// Rounds 1 to 2 (cycle 0) always keep the original Spring Current opening; every later two round
// cycle randomly picks one monsoon state and caches it, so every round in a cycle (and every
// player) sees the same weather, and syncing again later doesn't reroll an already seen cycle.
export function syncMonsoonState(ctx: MonsoonSyncContext, rng: Rng): void {
  const activeGame = ctx.games.find((g) => !g.gameOver) ?? ctx.games[0]!;
  const activeRound = Math.max(1, Math.min(activeGame.currentRound, activeGame.maxRounds));
  const cycle = Math.floor((activeRound - 1) / 2);
  let state: MonsoonState;
  if (cycle === 0) {
    state = MONSOON_TIER0[0];
  } else {
    if (!(cycle in ctx.monsoonCycleCache)) {
      ctx.monsoonCycleCache[cycle] = rng.choice(monsoonPool(activeRound, ctx.tierUnlock));
    }
    state = ctx.monsoonCycleCache[cycle]!;
  }
  for (const g of ctx.games) {
    g.setMonsoonState(state);
  }
}
