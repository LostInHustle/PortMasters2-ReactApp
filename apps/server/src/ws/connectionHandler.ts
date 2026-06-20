import type WebSocket from 'ws';
import { handleGameAction } from '../actions/handleGameAction.js';
import { handleSendChat } from '../lobby/chat.js';
import { handleRespondInvite, handleSendInvite } from '../lobby/inviteManager.js';
import type { Sendable, ServerState } from '../lobby/onlineRegistry.js';
import {
  broadcastOpenRooms,
  handleCreateRoom,
  handleJoinRoom,
  handleLeaveRoom,
  handleStartRoom,
} from '../lobby/roomManager.js';
import { broadcastSessionState } from '../session/broadcastState.js';
import { broadcastOnlineUsers, sendJson, sendToUser } from './send.js';

// Ported verbatim from PortMasters2/server.py handler's not-logged-in branch
// (lines 1750-1778): only register/login are accepted before a connection has claimed a
// username.
function processUnauthenticated(
  state: ServerState,
  ws: Sendable,
  action: unknown,
  data: Record<string, unknown>,
): string | null {
  if (action === 'register') {
    const u = String(data.username ?? '').trim();
    const p = String(data.password ?? '');
    const [ok, msg] = state.users.register(u, p);
    sendJson(ws, { type: 'register_result', success: ok, message: msg });
    return null;
  }
  if (action === 'login') {
    const u = String(data.username ?? '').trim();
    const p = String(data.password ?? '');
    let [ok, msg] = state.users.verify(u, p);
    if (ok && state.online.has(u)) {
      ok = false;
      msg = '该账号已在其他设备登录';
    }
    if (ok) {
      // Claim the account slot before any further work, so two racing logins for the same
      // account cannot both pass the check above.
      state.online.set(u, ws);
    }
    sendJson(ws, { type: 'login_result', success: ok, username: u, message: msg });
    if (!ok) return null;
    broadcastOnlineUsers(state);
    broadcastOpenRooms(state);
    // A pending (not-yet-started) room never survives a disconnect -- handleDisconnect already
    // ran handleLeaveRoom for it -- so any session still on record here is a live voyage.
    const sess = state.sessions.get(u);
    if (sess !== undefined && sess.started) {
      sendJson(ws, { type: 'session_resumed' });
      for (const other of sess.otherPlayers(u)) {
        sendToUser(state, other, { type: 'partner_status', username: u, online: true });
      }
      broadcastSessionState(state, sess);
    }
    return u;
  }
  sendJson(ws, { type: 'error', message: '请先登录' });
  return null;
}

// Ported verbatim from PortMasters2/server.py handler's logged-in branch (lines 1780-1793).
function processAuthenticated(
  state: ServerState,
  ws: Sendable,
  username: string,
  action: unknown,
  data: Record<string, unknown>,
): void {
  switch (action) {
    case 'get_online_users':
      sendJson(ws, {
        type: 'online_users',
        users: [...state.online.keys()].filter((n) => n !== username),
      });
      break;
    case 'send_invite':
      handleSendInvite(state, username, String(data.to ?? ''), data.difficulty);
      break;
    case 'respond_invite':
      handleRespondInvite(state, username, String(data.from ?? ''), Boolean(data.accept));
      break;
    case 'send_chat':
      handleSendChat(state, username, data.message ?? '');
      break;
    case 'create_room':
      handleCreateRoom(state, username, data.maxPlayers, data.difficulty);
      break;
    case 'join_room':
      handleJoinRoom(state, username, String(data.host ?? ''));
      break;
    case 'leave_room':
      handleLeaveRoom(state, username);
      break;
    case 'start_room':
      handleStartRoom(state, username);
      break;
    case 'get_chat_history': {
      const sess = state.sessions.get(username);
      sendJson(ws, { type: 'chat_history', history: sess ? sess.chatHistory : [] });
      break;
    }
    default:
      handleGameAction(state, username, data);
  }
}

// Ported verbatim from PortMasters2/server.py handler (lines 1736-1793): processes one parsed
// message for a connection currently identified as `username` (null before login), returning
// the (possibly newly-claimed) username for the caller to remember on this connection.
export function processMessage(
  state: ServerState,
  ws: Sendable,
  username: string | null,
  data: Record<string, unknown>,
): string | null {
  const action = data.action;
  if (username === null) {
    return processUnauthenticated(state, ws, action, data);
  }
  processAuthenticated(state, ws, username, action, data);
  return username;
}

// Ported verbatim from PortMasters2/server.py handler's finally block (lines 1801-1819), then
// generalized from a single partner to a room of 2-5. The `state.online.get(username) !== ws`
// guard matches Python's `ONLINE.get(username) is websocket`: skip cleanup if this username has
// already been reclaimed by a newer connection.
export function handleDisconnect(state: ServerState, ws: Sendable, username: string | null): void {
  if (username === null || state.online.get(username) !== ws) return;
  state.online.delete(username);
  const inv = state.pendingInvites.get(username);
  if (inv) {
    state.pendingInvites.delete(username);
    clearTimeout(inv.timer);
    sendToUser(state, inv.to, { type: 'invite_cancelled', from: username });
  }
  broadcastOnlineUsers(state);
  const sess = state.sessions.get(username);
  if (sess === undefined) return;
  // Per the user's decision, a room's roster only changes pre-start: dropping a connection
  // mid-lobby is equivalent to an explicit leave_room, while a live voyage just flags the slot
  // offline and holds it open for reconnection.
  if (!sess.started) {
    handleLeaveRoom(state, username);
    return;
  }
  const others = sess.otherPlayers(username);
  const onlineOthers = others.filter((p) => state.online.has(p));
  for (const other of onlineOthers) {
    sendToUser(state, other, { type: 'partner_status', username, online: false });
  }
  if (onlineOthers.length > 0) {
    broadcastSessionState(state, sess);
  } else {
    for (const player of sess.players) {
      state.sessions.delete(player);
    }
  }
}

// Wires a real `ws` WebSocket connection to processMessage/handleDisconnect. Node's `ws` library
// delivers messages via events rather than Python's `async for` + ConnectionClosed exception, so
// the loop becomes a message/close listener pair; each message is still isolated in its own
// try/catch so one bad message can never tear down the connection or strand a session partner.
export function handleConnection(state: ServerState, ws: WebSocket): void {
  let username: string | null = null;

  ws.on('message', (raw) => {
    let data: unknown;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (typeof data !== 'object' || data === null) return;
    try {
      username = processMessage(state, ws, username, data as Record<string, unknown>);
    } catch (err) {
      console.error(err);
    }
  });

  ws.on('close', () => {
    handleDisconnect(state, ws, username);
  });
}
