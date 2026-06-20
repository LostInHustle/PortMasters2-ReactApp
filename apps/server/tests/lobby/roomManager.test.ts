import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UserStore } from '../../src/auth/UserStore.js';
import {
  createServerState,
  type Sendable,
  type ServerState,
} from '../../src/lobby/onlineRegistry.js';
import {
  handleCreateRoom,
  handleJoinRoom,
  handleLeaveRoom,
  handleStartRoom,
} from '../../src/lobby/roomManager.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py handle_create_room/
// handle_join_room/handle_leave_room/handle_start_room (the prototype's ROOMS-backed lobby for
// 2-5 players), adapted to this codebase's ServerState.rooms/sessions split.
class FakeSocket implements Sendable {
  sent: unknown[] = [];
  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }
}

function lastOfType(sock: FakeSocket, type: string): unknown {
  return [...sock.sent].reverse().find((m) => (m as { type: string }).type === type);
}

describe('roomManager', () => {
  let dir: string;
  let state: ServerState;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pm2-roommanager-'));
    state = createServerState(new UserStore(join(dir, 'users.json')));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe('handleCreateRoom', () => {
    it('creates a room clamped to [2,5], tracked in both rooms and sessions', () => {
      const alice = new FakeSocket();
      state.online.set('alice', alice);

      handleCreateRoom(state, 'alice', 99, 'hard');

      const room = state.rooms.get('alice')!;
      expect(room).toBeDefined();
      expect(room.maxPlayers).toBe(5);
      expect(room.difficulty).toBe('hard');
      expect(room.started).toBe(false);
      expect(state.sessions.get('alice')).toBe(room);
      expect(lastOfType(alice, 'room_roster')).toMatchObject({ host: 'alice', maxPlayers: 5 });
    });

    it('refuses to create a room for a player already in a session', () => {
      const alice = new FakeSocket();
      state.online.set('alice', alice);
      state.sessions.set('alice', SharedSession.createPair('alice', 'bob'));

      handleCreateRoom(state, 'alice', 3, 'easy');

      expect(state.rooms.has('alice')).toBe(false);
    });
  });

  describe('handleJoinRoom', () => {
    it('adds the joiner to an open room and broadcasts the updated roster', () => {
      const alice = new FakeSocket();
      const bob = new FakeSocket();
      state.online.set('alice', alice);
      state.online.set('bob', bob);
      handleCreateRoom(state, 'alice', 4, 'easy');

      handleJoinRoom(state, 'bob', 'alice');

      const room = state.rooms.get('alice')!;
      expect(room.players).toEqual(['alice', 'bob']);
      expect(state.sessions.get('bob')).toBe(room);
      expect(lastOfType(bob, 'room_roster')).toMatchObject({
        players: [
          { name: 'alice', online: true, isHost: true },
          { name: 'bob', online: true, isHost: false },
        ],
      });
    });

    it('rejects joining a full room', () => {
      const host = new FakeSocket();
      state.online.set('host', host);
      handleCreateRoom(state, 'host', 2, 'easy');
      handleJoinRoom(state, 'p1', 'host');

      const p2 = new FakeSocket();
      state.online.set('p2', p2);
      handleJoinRoom(state, 'p2', 'host');

      expect(state.rooms.get('host')!.players).toEqual(['host', 'p1']);
      expect(p2.sent).toEqual([{ type: 'system_message', message: '该房间不可加入' }]);
    });

    it('rejects joining a room that has already started', () => {
      const host = new FakeSocket();
      state.online.set('host', host);
      handleCreateRoom(state, 'host', 2, 'easy');
      handleJoinRoom(state, 'p1', 'host');
      handleStartRoom(state, 'host');

      const late = new FakeSocket();
      state.online.set('late', late);
      handleJoinRoom(state, 'late', 'host');

      expect(late.sent).toEqual([{ type: 'system_message', message: '该房间不可加入' }]);
    });
  });

  describe('handleLeaveRoom', () => {
    it('promotes the next player to host when the host leaves', () => {
      const host = new FakeSocket();
      state.online.set('host', host);
      handleCreateRoom(state, 'host', 3, 'easy');
      handleJoinRoom(state, 'p1', 'host');
      handleJoinRoom(state, 'p2', 'host');

      handleLeaveRoom(state, 'host');

      expect(state.rooms.has('host')).toBe(false);
      const room = state.rooms.get('p1')!;
      expect(room).toBeDefined();
      expect(room.host).toBe('p1');
      expect(room.players).toEqual(['p1', 'p2']);
      expect(state.sessions.has('host')).toBe(false);
    });

    it('deletes the room once the last player leaves', () => {
      const host = new FakeSocket();
      state.online.set('host', host);
      handleCreateRoom(state, 'host', 2, 'easy');

      handleLeaveRoom(state, 'host');

      expect(state.rooms.has('host')).toBe(false);
      expect(state.sessions.has('host')).toBe(false);
    });

    it('is a no-op once the room has started (roster is frozen)', () => {
      const host = new FakeSocket();
      state.online.set('host', host);
      handleCreateRoom(state, 'host', 2, 'easy');
      handleJoinRoom(state, 'p1', 'host');
      handleStartRoom(state, 'host');
      const sess = state.sessions.get('host')!;

      handleLeaveRoom(state, 'p1');

      expect(sess.players).toEqual(['host', 'p1']);
      expect(state.sessions.get('p1')).toBe(sess);
    });
  });

  describe('handleStartRoom', () => {
    it('refuses to start for anyone but the host', () => {
      const host = new FakeSocket();
      const p1 = new FakeSocket();
      state.online.set('host', host);
      state.online.set('p1', p1);
      handleCreateRoom(state, 'host', 3, 'easy');
      handleJoinRoom(state, 'p1', 'host');

      handleStartRoom(state, 'p1');

      expect(state.rooms.get('host')!.started).toBe(false);
      expect(lastOfType(p1, 'system_message')).toEqual({
        type: 'system_message',
        message: '只有房主才能开始航程',
      });
    });

    it('refuses to start below the minimum player count', () => {
      const host = new FakeSocket();
      state.online.set('host', host);
      handleCreateRoom(state, 'host', 3, 'easy');

      handleStartRoom(state, 'host');

      expect(state.rooms.get('host')!.started).toBe(false);
      expect(lastOfType(host, 'system_message')).toEqual({
        type: 'system_message',
        message: '至少需要 2 名船长才能起航',
      });
    });

    it('starts the voyage, removes the room from the open list, and notifies every player', () => {
      const host = new FakeSocket();
      const p1 = new FakeSocket();
      state.online.set('host', host);
      state.online.set('p1', p1);
      handleCreateRoom(state, 'host', 2, 'standard');
      handleJoinRoom(state, 'p1', 'host');

      handleStartRoom(state, 'host');

      const sess = state.sessions.get('host')!;
      expect(sess.started).toBe(true);
      expect(sess.games).toHaveLength(2);
      expect(state.rooms.has('host')).toBe(false);
      expect(lastOfType(host, 'room_started')).toEqual({
        type: 'room_started',
        difficulty: 'standard',
      });
      expect(lastOfType(p1, 'room_started')).toEqual({
        type: 'room_started',
        difficulty: 'standard',
      });
    });

    it('also broadcasts the live session state, so clients have yourGame/otherGames to render', () => {
      const host = new FakeSocket();
      const p1 = new FakeSocket();
      state.online.set('host', host);
      state.online.set('p1', p1);
      handleCreateRoom(state, 'host', 2, 'easy');
      handleJoinRoom(state, 'p1', 'host');

      handleStartRoom(state, 'host');

      const hostState = lastOfType(host, 'state') as { data: { otherGames: object } };
      expect(hostState).toBeDefined();
      expect(Object.keys(hostState.data.otherGames)).toEqual(['p1']);
    });
  });
});
