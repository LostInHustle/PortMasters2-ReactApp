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
export function handleReadyForNextPhase(sess: SharedSession, slot: 0 | 1): boolean {
  const game = sess.games[slot];
  if (!READY_GATE_PHASES.includes(game.phase) || sess.ready.has(slot)) return false;
  readyUpAndMaybeAdvance(sess, slot);
  return true;
}

// Ported verbatim from PortMasters2/server.py handle_game_action's restart branch
// (lines 1722-1730): only allows resetting the whole session once the partner has also
// finished (settled or bankrupt), keeping both players in sync.
export function handleRestart(
  state: ServerState,
  sess: SharedSession,
  slot: 0 | 1,
  username: string,
): boolean {
  if (!sess.games[1 - slot]!.gameOver) {
    sendToUser(state, username, {
      type: 'system_message',
      message: '需等待对方完成本局后才能重新起航',
    });
    return false;
  }
  sess.restart();
  const partner = sess.partnerOf(username);
  sendToUser(state, partner, {
    type: 'system_message',
    message: '对方重新开始了游戏，双方进度已重置',
  });
  return true;
}
