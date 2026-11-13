import { BOONS } from '@pm2/shared';
import type { SharedSession } from '../session/SharedSession.js';
import { readyUpAndMaybeAdvance } from './readyGate.js';

// Mirrors PortMasters2/server.py handle_game_action's startBoon branch
export function handleStartBoon(sess: SharedSession, slot: number): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 0 || sess.ready.has(slot)) return false;
  readyUpAndMaybeAdvance(sess, slot);
  return true;
}

// Mirrors PortMasters2/server.py handle_game_action's selectBoon branch. Falls back to the full
// boon pool if boonChoices is empty, matching Python's `game.boonChoices or BOONS`.
export function handleSelectBoon(
  sess: SharedSession,
  slot: number,
  data: Record<string, unknown>,
): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 5 || sess.ready.has(slot)) return false;
  const pool = game.boonChoices.length > 0 ? game.boonChoices : BOONS;
  const boon = pool.find((b) => b.id === data.boonId);
  if (!boon) return false;
  game.applyBoon(boon);
  readyUpAndMaybeAdvance(sess, slot);
  return true;
}
