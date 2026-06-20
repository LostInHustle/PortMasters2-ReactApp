import {
  MAX_ROOM_PLAYERS,
  MIN_ROOM_PLAYERS,
  type OpenRoomSummary,
  type RoomRosterMessage,
  type RosterPlayer,
} from '@pm2/shared';
import { normalizeDifficulty } from '../game/difficultyRules.js';
import { SharedSession } from '../session/SharedSession.js';
import { sendJson, sendToUser } from '../ws/send.js';
import type { ServerState } from './onlineRegistry.js';

// Generalizes PortMasters2/server.py's handle_create_room/handle_join_room/handle_leave_room/
// handle_start_room (ROOMS-backed lobby for 2-5 players, coexisting with the 1:1 invite fast
// path in inviteManager.ts). A room is just a SharedSession with `started === false`: it lives
// in both `state.rooms` (so the lobby's "open rooms" list can find it) and `state.sessions` (so
// every other handler that looks a player up by username keeps working unchanged).

function rosterOf(state: ServerState, sess: SharedSession): RosterPlayer[] {
  return sess.players.map((name) => ({
    name,
    online: state.online.has(name),
    isHost: name === sess.host,
  }));
}

function rosterMessage(state: ServerState, sess: SharedSession): RoomRosterMessage {
  return {
    host: sess.host,
    difficulty: sess.difficulty,
    maxPlayers: sess.maxPlayers,
    started: sess.started,
    players: rosterOf(state, sess),
  };
}

export function broadcastRoomRoster(state: ServerState, sess: SharedSession): void {
  const msg = { type: 'room_roster', ...rosterMessage(state, sess) };
  for (const player of sess.players) {
    sendToUser(state, player, msg);
  }
}

export function broadcastOpenRooms(state: ServerState): void {
  const openRooms: OpenRoomSummary[] = [...state.rooms.values()].map((sess) => ({
    host: sess.host,
    difficulty: sess.difficulty,
    count: sess.players.length,
    maxPlayers: sess.maxPlayers,
  }));
  for (const ws of state.online.values()) {
    sendJson(ws, { type: 'open_rooms_update', rooms: openRooms });
  }
}

export function handleCreateRoom(
  state: ServerState,
  username: string,
  maxPlayers: unknown,
  difficulty: unknown,
): void {
  if (state.sessions.has(username)) {
    sendToUser(state, username, {
      type: 'system_message',
      message: '你已在游戏会话中，无法创建房间',
    });
    return;
  }
  const clampedMax = Math.min(
    MAX_ROOM_PLAYERS,
    Math.max(MIN_ROOM_PLAYERS, Number(maxPlayers) || MIN_ROOM_PLAYERS),
  );
  const sess = new SharedSession(username, normalizeDifficulty(difficulty), clampedMax);
  state.rooms.set(username, sess);
  state.sessions.set(username, sess);
  broadcastRoomRoster(state, sess);
  broadcastOpenRooms(state);
}

export function handleJoinRoom(state: ServerState, username: string, host: string): void {
  if (state.sessions.has(username)) {
    sendToUser(state, username, {
      type: 'system_message',
      message: '你已在游戏会话中，无法加入房间',
    });
    return;
  }
  const room = state.rooms.get(host);
  if (!room || room.started || room.players.length >= room.maxPlayers) {
    sendToUser(state, username, { type: 'system_message', message: '该房间不可加入' });
    return;
  }
  room.addPlayer(username);
  state.sessions.set(username, room);
  broadcastRoomRoster(state, room);
  broadcastOpenRooms(state);
}

// Pre-start only, matching the user's decision to freeze the roster once a voyage launches.
// Also called from connectionHandler.ts's disconnect path when a player in an unstarted room
// drops their connection, so leaving a room lobby behaves the same whether explicit or implicit.
export function handleLeaveRoom(state: ServerState, username: string): void {
  const room = findRoomOf(state, username);
  if (!room) return;
  // state.rooms is keyed by the room's current host; capture that key before removePlayer can
  // promote a new host, so the old entry is the one removed/re-keyed below.
  const oldHostKey = room.host;
  room.removePlayer(username);
  state.sessions.delete(username);
  if (room.players.length === 0) {
    state.rooms.delete(oldHostKey);
  } else {
    if (room.host !== oldHostKey) {
      state.rooms.delete(oldHostKey);
      state.rooms.set(room.host, room);
    }
    broadcastRoomRoster(state, room);
  }
  broadcastOpenRooms(state);
}

function findRoomOf(state: ServerState, username: string): SharedSession | undefined {
  const sess = state.sessions.get(username);
  return sess && !sess.started ? sess : undefined;
}

export function handleStartRoom(state: ServerState, username: string): void {
  const room = state.rooms.get(username);
  if (!room || room.host !== username) {
    sendToUser(state, username, { type: 'system_message', message: '只有房主才能开始航程' });
    return;
  }
  if (room.players.length < MIN_ROOM_PLAYERS) {
    sendToUser(state, username, { type: 'system_message', message: '至少需要 2 名船长才能起航' });
    return;
  }
  state.rooms.delete(username);
  room.start();
  const msg = { type: 'room_started', difficulty: room.difficulty };
  for (const player of room.players) {
    sendToUser(state, player, msg);
  }
  broadcastOpenRooms(state);
}
