import { RECIPES, WAGES, type ProductId, type WorkerTypeId } from '@pm2/shared';
import type { SharedSession } from '../session/SharedSession.js';

function isWorkerType(value: unknown): value is WorkerTypeId {
  return typeof value === 'string' && value in WAGES;
}

function isProductId(value: unknown): value is ProductId {
  return typeof value === 'string' && value in RECIPES;
}

// Ported verbatim from PortMasters2/server.py handle_game_action's hireWorker branch
// (lines 1661-1664).
export function handleHireWorker(
  sess: SharedSession,
  slot: number,
  data: Record<string, unknown>,
): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 'worker_mgmt' || !isWorkerType(data.workerType)) return false;
  game.hireWorker(data.workerType);
  return true;
}

// Ported verbatim from PortMasters2/server.py handle_game_action's fireWorker branch
// (lines 1665-1668).
export function handleFireWorker(
  sess: SharedSession,
  slot: number,
  data: Record<string, unknown>,
): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 'worker_mgmt' || !isWorkerType(data.workerType)) return false;
  const index = typeof data.index === 'number' ? data.index : -1;
  game.fireWorker(data.workerType, index);
  return true;
}

// Ported verbatim from PortMasters2/server.py handle_game_action's assignTask branch
// (lines 1669-1672).
export function handleAssignTask(
  sess: SharedSession,
  slot: number,
  data: Record<string, unknown>,
): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 'worker_mgmt' || !isWorkerType(data.workerType) || !isProductId(data.task)) {
    return false;
  }
  game.assignTask(data.workerType, data.task);
  return true;
}
