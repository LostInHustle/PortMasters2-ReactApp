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
  games: readonly [MonsoonSyncGame, MonsoonSyncGame];
  tierUnlock: Record<number, number>;
  monsoonCycleCache: Record<number, MonsoonState>;
}

// Ported verbatim from PortMasters2/server.py SharedSession.sync_monsoon_state (lines 1248-1261).
// Rounds 1-2 (cycle 0) always keep the original Spring Current opening; every later 2-round
// cycle randomly picks one monsoon state and caches it, so both rounds in a cycle (and both
// players) see the same weather, and re-syncing later doesn't re-roll an already-seen cycle.
export function syncMonsoonState(ctx: MonsoonSyncContext, rng: Rng): void {
  const activeGame = ctx.games.find((g) => !g.gameOver) ?? ctx.games[0];
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
