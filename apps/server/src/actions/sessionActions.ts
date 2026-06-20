import type { Phase } from '@pm2/shared';
import type { ServerState } from '../lobby/onlineRegistry.js';
import type { SharedSession } from '../session/SharedSession.js';
import { sendToUser } from '../ws/send.js';
import { readyUpAndMaybeAdvance } from './readyGate.js';

// Ported verbatim from PortMasters2/server.py handle_game_action's join_game branch
// (lines 1597-1598): a pure refresh signal with no state mutation beyond requesting a
// rebroadcast.
export function handleJoinGame(): boolean {
  return true;
}

const READY_GATE_PHASES: readonly Phase[] = [1, 'worker_mgmt', 2, 4];

// Ported verbatim from PortMasters2/server.py handle_game_action's ready_for_next_phase branch
// (lines 1616-1621).
export function handleReadyForNextPhase(sess: SharedSession, slot: number): boolean {
  const game = sess.games[slot]!;
  if (!READY_GATE_PHASES.includes(game.phase) || sess.ready.has(slot)) return false;
  readyUpAndMaybeAdvance(sess, slot);
  return true;
}

// Ported verbatim from PortMasters2/server.py handle_game_action's restart branch
// (lines 1722-1730): only allows resetting the whole room once every other captain has also
// finished (settled or bankrupt), keeping the whole roster in sync. Generalized from a single
// partner check to every other player's game.
export function handleRestart(
  state: ServerState,
  sess: SharedSession,
  slot: number,
  username: string,
): boolean {
  if (!sess.games.every((g, i) => i === slot || g.gameOver)) {
    sendToUser(state, username, {
      type: 'system_message',
      message: '需等待对方完成本局后才能重新起航',
    });
    return false;
  }
  sess.restart();
  for (const other of sess.otherPlayers(username)) {
    sendToUser(state, other, {
      type: 'system_message',
      message: '对方重新开始了游戏，双方进度已重置',
    });
  }
  return true;
}

// New: each captain votes to disband the room and return everyone to the lobby. Every single
// player must explicitly vote (sess.endVoteComplete() does not auto-count bankrupt/finished
// players) -- this is wired into handleGameAction.ts, which (unlike most actions) allows a
// gameOver player to call it.
export function handleEndSessionVote(sess: SharedSession, slot: number): boolean {
  sess.endVotes.add(slot);
  return true;
}

// Disbands a room once endVoteComplete() passes: every member is told the session ended and
// dropped from state.sessions, with no resumable state kept -- unlike bankruptcy/restart, which
// preserve the session, voting to end it is final.
export function endGameSession(state: ServerState, sess: SharedSession): void {
  for (const player of sess.players) {
    state.sessions.delete(player);
    sendToUser(state, player, { type: 'session_ended' });
  }
}
