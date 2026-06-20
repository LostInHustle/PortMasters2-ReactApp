import type { ServerState } from '../lobby/onlineRegistry.js';
import { broadcastSessionState } from '../session/broadcastState.js';
import { handleSelectBoon, handleStartBoon } from './boonActions.js';
import { handleCompleteOrder } from './orderActions.js';
import { handlePurchase, handlePurchaseIntel } from './procureActions.js';
import {
  endGameSession,
  handleEndSessionVote,
  handleJoinGame,
  handleReadyForNextPhase,
  handleRestart,
} from './sessionActions.js';
import {
  handleCancelModuleDraft,
  handleDraftModules,
  handleEquipModule,
  handleRerollModuleDraft,
  handleUpgradeShip,
} from './shipyardActions.js';
import {
  handleAcceptTrade,
  handleCreateTradeOrder,
  handleRejectTrade,
  handleSetTradeReady,
} from './tradeActions.js';
import { handleDoMaintenance, handleHireEscort } from './upkeepActions.js';
import { handleAssignTask, handleFireWorker, handleHireWorker } from './workerActions.js';

// Ported verbatim from PortMasters2/server.py handle_game_action (lines 1583-1734): the in-game
// action dispatcher. A player with no session is silently ignored, matching the original's
// `if sess is None: return`. Bankrupt/finished players may only join_game, restart, or
// end_session (read-only spectator + restart + a voice in disbanding the room), matching the
// original's end-state guard as extended by the vote-to-end feature.
export function handleGameAction(
  state: ServerState,
  username: string,
  data: Record<string, unknown>,
): void {
  const sess = state.sessions.get(username);
  if (sess === undefined) return;
  const slot = sess.slotOf(username);
  const game = sess.games[slot]!;
  const action = data.action;

  if (
    game.gameOver &&
    action !== 'join_game' &&
    action !== 'restart' &&
    action !== 'end_session'
  ) {
    return;
  }

  let changed = false;
  switch (action) {
    case 'join_game':
      changed = handleJoinGame();
      break;
    case 'startBoon':
      changed = handleStartBoon(sess, slot);
      break;
    case 'selectBoon':
      changed = handleSelectBoon(sess, slot, data);
      break;
    case 'ready_for_next_phase':
      changed = handleReadyForNextPhase(sess, slot);
      break;
    case 'purchase':
      changed = handlePurchase(sess, slot, data);
      break;
    case 'purchaseIntel':
      changed = handlePurchaseIntel(sess, slot);
      break;
    case 'setTradeReady':
      changed = handleSetTradeReady(sess, slot);
      break;
    case 'createTradeOrder':
      changed = handleCreateTradeOrder(sess, slot, data);
      break;
    case 'acceptTrade':
      changed = handleAcceptTrade(sess, slot, data);
      break;
    case 'rejectTrade':
      changed = handleRejectTrade(state, sess, slot, username, data);
      break;
    case 'hireWorker':
      changed = handleHireWorker(sess, slot, data);
      break;
    case 'fireWorker':
      changed = handleFireWorker(sess, slot, data);
      break;
    case 'assignTask':
      changed = handleAssignTask(sess, slot, data);
      break;
    case 'completeOrder':
      changed = handleCompleteOrder(sess, slot, data);
      break;
    case 'doMaintenance':
      changed = handleDoMaintenance(sess, slot);
      break;
    case 'hireEscort':
      changed = handleHireEscort(sess, slot);
      break;
    case 'upgradeShip':
      changed = handleUpgradeShip(sess, slot);
      break;
    case 'draftModules':
      changed = handleDraftModules(sess, slot);
      break;
    case 'equipModule':
      changed = handleEquipModule(sess, slot, data);
      break;
    case 'cancelModuleDraft':
      changed = handleCancelModuleDraft(sess, slot);
      break;
    case 'rerollModuleDraft':
      changed = handleRerollModuleDraft(sess, slot);
      break;
    case 'restart':
      changed = handleRestart(state, sess, slot, username);
      break;
    case 'end_session':
      changed = handleEndSessionVote(sess, slot);
      break;
  }

  if (!changed) return;
  if (sess.endVoteComplete()) {
    endGameSession(state, sess);
    return;
  }
  broadcastSessionState(state, sess);
}
