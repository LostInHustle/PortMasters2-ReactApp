import type { MarketCard } from '@pm2/shared';
import type { SharedSession } from '../session/SharedSession.js';

// Ported verbatim from PortMasters2/server.py handle_game_action's purchase branch
// (lines 1622-1627): changed is set whenever the player is in the Procure phase, regardless of
// whether a matching, not-yet-purchased card was actually found.
export function handlePurchase(
  sess: SharedSession,
  slot: 0 | 1,
  data: Record<string, unknown>,
): boolean {
  const game = sess.games[slot];
  if (game.phase !== 1) return false;
  const card = game.resourceCards.find((c) => c.id === data.cardId);
  if (card && !game.purchasedCards.has(card.id!)) {
    game.purchaseCard(card as MarketCard & { id: number });
  }
  return true;
}

// Ported verbatim from PortMasters2/server.py handle_game_action's purchaseIntel branch
// (lines 1628-1631).
export function handlePurchaseIntel(sess: SharedSession, slot: 0 | 1): boolean {
  const game = sess.games[slot];
  if (game.phase !== 1) return false;
  game.purchaseIntel();
  return true;
}
