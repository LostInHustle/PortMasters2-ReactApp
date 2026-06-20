import type { ServerState } from '../lobby/onlineRegistry.js';
import type { SharedSession } from '../session/SharedSession.js';
import { sendToUser } from '../ws/send.js';

// Ported verbatim from PortMasters2/server.py handle_game_action's setTradeReady branch
// (lines 1632-1637).
export function handleSetTradeReady(sess: SharedSession, slot: number): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 'trade') return false;
  sess.tradeReady[slot] = true;
  if (sess.tradeGateComplete()) {
    sess.completeTradeGate();
  }
  return true;
}

// Ported verbatim from PortMasters2/server.py handle_game_action's createTradeOrder branch
// (lines 1638-1643).
export function handleCreateTradeOrder(
  sess: SharedSession,
  slot: number,
  data: Record<string, unknown>,
): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 'trade') return false;
  sess.createTradeOrder(slot, data.sell ?? [], data.buy ?? []);
  return true;
}

// Ported verbatim from PortMasters2/server.py handle_game_action's acceptTrade branch
// (lines 1644-1647).
export function handleAcceptTrade(
  sess: SharedSession,
  slot: number,
  data: Record<string, unknown>,
): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 'trade') return false;
  sess.acceptTrade(data.orderId, slot);
  return true;
}

// Ported verbatim from PortMasters2/server.py handle_game_action's rejectTrade branch
// (lines 1648-1660): notifies the seller only when they aren't the one who rejected their own
// order (a player can reject an order they themselves proposed).
export function handleRejectTrade(
  state: ServerState,
  sess: SharedSession,
  slot: number,
  username: string,
  data: Record<string, unknown>,
): boolean {
  const game = sess.games[slot]!;
  if (game.phase !== 'trade') return false;
  const order = sess.rejectTrade(data.orderId);
  if (order) {
    const seller = sess.players[order.sellerSlot]!;
    if (seller !== username) {
      const sellTxt = order.sell.map((i) => `${i.type}×${i.quantity}`).join('、');
      const buyTxt = order.buy.map((i) => `${i.type}×${i.quantity}`).join('、');
      sendToUser(state, seller, {
        type: 'system_message',
        message: `❌ 对方拒绝了你的互市提案（出 ${sellTxt} ⇄ 换 ${buyTxt}）`,
      });
    }
  }
  return true;
}
