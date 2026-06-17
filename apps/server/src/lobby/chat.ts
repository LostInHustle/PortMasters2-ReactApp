import { sendToUser } from '../ws/send.js';
import type { ServerState } from './onlineRegistry.js';

// Ported verbatim from PortMasters2/server.py handle_send_chat (lines 1567-1580).
export function handleSendChat(state: ServerState, sender: string, message: unknown): void {
  const sess = state.sessions.get(sender);
  if (sess === undefined) {
    sendToUser(state, sender, {
      type: 'system_message',
      message: '你还没有游戏伙伴，无法发送消息',
    });
    return;
  }
  const partner = sess.partnerOf(sender);
  if (!state.online.has(partner)) {
    sendToUser(state, sender, { type: 'system_message', message: '对方已离线，无法发送消息' });
    return;
  }
  const trimmed = String(message).trim().slice(0, 500);
  if (!trimmed) return;
  sess.addChat(sender, trimmed);
  sendToUser(state, partner, { type: 'chat_message', from: sender, message: trimmed });
}
