import type { CustomerOrder } from '@pm2/shared';
import type { SharedSession } from '../session/SharedSession.js';

// Ported verbatim from PortMasters2/server.py handle_game_action's completeOrder branch
// (lines 1673-1678): changed is set whenever the player is in the Artisans phase, regardless of
// whether a matching, not-yet-completed order was actually found.
export function handleCompleteOrder(
  sess: SharedSession,
  slot: 0 | 1,
  data: Record<string, unknown>,
): boolean {
  const game = sess.games[slot];
  if (game.phase !== 2) return false;
  const order = game.customerCards.find((o) => o.id === data.orderId);
  if (order && !game.completedOrders.has(order.id!)) {
    game.completeOrder(order as CustomerOrder & { id: number });
  }
  return true;
}
