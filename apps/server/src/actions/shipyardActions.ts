import type { SharedSession } from '../session/SharedSession.js';

function isInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

// Mirrors PortMasters2/server.py handle_game_action's upgradeShip branch: changed is set whenever
// the player is in Shipyard with levels remaining, regardless of whether they could actually
// afford the upgrade.
export function handleUpgradeShip(sess: SharedSession, slot: number): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 4 || game.shipLevel >= 3) return false;
  const cost = game.shipUpgradeCost[game.shipLevel]! + game.shipUpgradePenalty;
  if (game.money >= cost) {
    game.money -= cost;
    game.shipLevel += 1;
  }
  return true;
}

// Mirrors PortMasters2/server.py handle_game_action's draftModules branch
export function handleDraftModules(sess: SharedSession, slot: number): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 4) return false;
  game.startModuleDraft();
  return true;
}

// Mirrors PortMasters2/server.py handle_game_action's equipModule branch
export function handleEquipModule(
  sess: SharedSession,
  slot: number,
  data: Record<string, unknown>,
): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 4) return false;
  const idx = data.choiceIndex;
  if (isInt(idx) && idx >= 0 && idx < game.draftChoices.length) {
    const mod = game.draftChoices[idx]!;
    const swapIdx = data.swapIndex;
    const validSwap = isInt(swapIdx) && swapIdx >= 0 && swapIdx < game.equippedModules.length;
    game.equipModule(mod, validSwap ? swapIdx : undefined);
  }
  return true;
}

// Mirrors PortMasters2/server.py handle_game_action's cancelModuleDraft branch hides the panel; the batch persists so reopening can't reroll.
export function handleCancelModuleDraft(sess: SharedSession, slot: number): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 4) return false;
  game.draftOpen = false;
  return true;
}

// Mirrors PortMasters2/server.py handle_game_action's rerollModuleDraft branch
export function handleRerollModuleDraft(sess: SharedSession, slot: number): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 4) return false;
  game.rerollModuleDraft();
  return true;
}
