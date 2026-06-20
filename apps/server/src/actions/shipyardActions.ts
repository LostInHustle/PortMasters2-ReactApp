import type { SharedSession } from '../session/SharedSession.js';

function isInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

// Ported verbatim from PortMasters2/server.py handle_game_action's upgradeShip branch
// (lines 1693-1699): changed is set whenever the player is in Shipyard with levels remaining,
// regardless of whether they could actually afford the upgrade.
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

// Ported verbatim from PortMasters2/server.py handle_game_action's draftModules branch
// (lines 1700-1703).
export function handleDraftModules(sess: SharedSession, slot: number): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 4) return false;
  game.startModuleDraft();
  return true;
}

// Ported verbatim from PortMasters2/server.py handle_game_action's equipModule branch
// (lines 1704-1713).
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

// Ported verbatim from PortMasters2/server.py handle_game_action's cancelModuleDraft branch
// (lines 1714-1717): hides the panel; the batch persists so reopening can't reroll.
export function handleCancelModuleDraft(sess: SharedSession, slot: number): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 4) return false;
  game.draftOpen = false;
  return true;
}

// Ported verbatim from PortMasters2/server.py handle_game_action's rerollModuleDraft branch
// (lines 1718-1721).
export function handleRerollModuleDraft(sess: SharedSession, slot: number): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 4) return false;
  game.rerollModuleDraft();
  return true;
}
