import { sendToUser } from '../ws/send.js';
import type { ServerState } from './onlineRegistry.js';

// Generalizes PortMasters2/server.py handle_send_chat (lines 1567-1580) from a 1:1 DM to a room
// broadcast: with up to 5 captains, there's no single "partner" to address, so the message goes
// to every other online room member instead.
export function handleSendChat(state: ServerState, sender: string, message: unknown): void {
  const sess = state.sessions.get(sender);
  if (sess === undefined) {
    sendToUser(state, sender, {
      type: 'system_message',
      message: '你还没有游戏伙伴，无法发送消息',
    });
    return;
  }
  const others = sess.otherPlayers(sender).filter((p) => state.online.has(p));
  if (others.length === 0) {
    sendToUser(state, sender, { type: 'system_message', message: '对方已离线，无法发送消息' });
    return;
  }
  const trimmed = String(message).trim().slice(0, 500);
  if (!trimmed) return;
  sess.addChat(sender, trimmed);
  for (const other of others) {
    sendToUser(state, other, { type: 'chat_message', from: sender, message: trimmed });
  }
}
