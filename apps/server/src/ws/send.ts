import type { Sendable } from '../lobby/onlineRegistry.js';

// Ported from PortMasters2/server.py send_json/send_to_user/broadcast_online_users
// (lines 1480-1494). Python's `websockets` library makes `ws.send()` an async call the original
// awaits; the `ws` package used here sends synchronously (fire-and-forget, no promise), so these
// drop `async`/`await` entirely -- a zero-behavior-change adaptation to the library, not a
// fidelity deviation.
export function sendJson(ws: Sendable, obj: unknown): void {
  try {
    ws.send(JSON.stringify(obj));
  } catch {
    // a failed send must never crash the caller, mirroring the original's `except Exception: pass`
  }
}

export interface OnlineRegistry {
  online: Map<string, Sendable>;
}

export function sendToUser(state: OnlineRegistry, username: string, obj: unknown): void {
  const ws = state.online.get(username);
  if (ws !== undefined) sendJson(ws, obj);
}

export function broadcastOnlineUsers(state: OnlineRegistry): void {
  const names = [...state.online.keys()];
  for (const [uname, ws] of state.online) {
    sendJson(ws, { type: 'online_users_update', users: names.filter((n) => n !== uname) });
  }
}
