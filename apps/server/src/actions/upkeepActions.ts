import type { SharedSession } from '../session/SharedSession.js';
import { readyUpAndMaybeAdvance } from './readyGate.js';

// Ported verbatim from PortMasters2/server.py handle_game_action's doMaintenance branch
// (lines 1679-1688): a failed maintenance payment ends the game right here, bankrupt, before
// this player is marked ready (so the bankrupt game still counts as auto-ready via gameOver).
export function handleDoMaintenance(sess: SharedSession, slot: 0 | 1): boolean {
  const game = sess.games[slot];
  if (game.phase !== 3 || sess.ready.has(slot)) return false;
  if (!game.payMaintenance()) {
    game.gameOver = true;
    game.bankrupt = true;
    game.phase = 'bankruptcy';
  }
  readyUpAndMaybeAdvance(sess, slot);
  return true;
}

// Ported verbatim from PortMasters2/server.py handle_game_action's hireEscort branch
// (lines 1689-1692): gated on the same not-yet-ready check as doMaintenance, so a player can no
// longer hire an escort once they've clicked through Upkeep.
export function handleHireEscort(sess: SharedSession, slot: 0 | 1): boolean {
  const game = sess.games[slot];
  if (game.phase !== 3 || sess.ready.has(slot)) return false;
  game.hireEscort();
  return true;
}
