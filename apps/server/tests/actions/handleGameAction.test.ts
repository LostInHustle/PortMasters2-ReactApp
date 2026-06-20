import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleGameAction } from '../../src/actions/handleGameAction.js';
import { UserStore } from '../../src/auth/UserStore.js';
import {
  createServerState,
  type Sendable,
  type ServerState,
} from '../../src/lobby/onlineRegistry.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py handle_game_action's top-level
// guards (lines 1583-1596, 1732-1733): no session is a silent no-op, a finished/bankrupt player
// may only join_game or restart, and a "state" broadcast fires only when something changed.
class FakeSocket implements Sendable {
  sent: unknown[] = [];
  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }
}

describe('handleGameAction', () => {
  let dir: string;
  let state: ServerState;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pm2-handlegameaction-'));
    state = createServerState(new UserStore(join(dir, 'users.json')));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('silently ignores a player with no session', () => {
    const alice = new FakeSocket();
    state.online.set('alice', alice);
    expect(() => handleGameAction(state, 'alice', { action: 'join_game' })).not.toThrow();
    expect(alice.sent).toEqual([]);
  });

  it('broadcasts state to both players when an action changes something', () => {
    const alice = new FakeSocket();
    const bob = new FakeSocket();
    state.online.set('alice', alice);
    state.online.set('bob', bob);
    state.sessions.set('alice', SharedSession.createPair('alice', 'bob'));
    state.sessions.set('bob', state.sessions.get('alice')!);

    handleGameAction(state, 'alice', { action: 'join_game' });

    expect(alice.sent).toHaveLength(1);
    expect(bob.sent).toHaveLength(1);
    expect((alice.sent[0] as { type: string }).type).toBe('state');
  });

  it('does not broadcast when the action made no difference (unknown action)', () => {
    const alice = new FakeSocket();
    state.online.set('alice', alice);
    state.sessions.set('alice', SharedSession.createPair('alice', 'bob'));

    handleGameAction(state, 'alice', { action: 'not_a_real_action' });
    expect(alice.sent).toEqual([]);
  });

  it('blocks every action except join_game/restart once this player has finished', () => {
    const alice = new FakeSocket();
    state.online.set('alice', alice);
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.gameOver = true;
    sess.games[0]!.phase = 'bankruptcy';
    state.sessions.set('alice', sess);

    handleGameAction(state, 'alice', { action: 'hireWorker', workerType: 'weaver' });
    expect(alice.sent).toEqual([]);

    handleGameAction(state, 'alice', { action: 'join_game' });
    expect(alice.sent).toHaveLength(1);
  });

  it('routes a real action end-to-end (startBoon) through to a phase change', () => {
    const alice = new FakeSocket();
    const bob = new FakeSocket();
    state.online.set('alice', alice);
    state.online.set('bob', bob);
    const sess = SharedSession.createPair('alice', 'bob');
    state.sessions.set('alice', sess);
    state.sessions.set('bob', sess);

    handleGameAction(state, 'alice', { action: 'startBoon' });
    handleGameAction(state, 'bob', { action: 'startBoon' });

    expect(sess.games[0]!.phase).toBe(5);
  });

  it('allows end_session even for a player who has already finished', () => {
    const alice = new FakeSocket();
    state.online.set('alice', alice);
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.gameOver = true;
    sess.games[0]!.phase = 'bankruptcy';
    state.sessions.set('alice', sess);

    handleGameAction(state, 'alice', { action: 'end_session' });

    expect(sess.endVotes.has(0)).toBe(true);
    expect(alice.sent).toHaveLength(1);
    expect((alice.sent[0] as { type: string }).type).toBe('state');
  });

  it('once every player votes end_session, disbands the room instead of broadcasting state', () => {
    const alice = new FakeSocket();
    const bob = new FakeSocket();
    state.online.set('alice', alice);
    state.online.set('bob', bob);
    const sess = SharedSession.createPair('alice', 'bob');
    state.sessions.set('alice', sess);
    state.sessions.set('bob', sess);

    handleGameAction(state, 'alice', { action: 'end_session' });
    handleGameAction(state, 'bob', { action: 'end_session' });

    expect(alice.sent.at(-1)).toEqual({ type: 'session_ended' });
    expect(bob.sent.at(-1)).toEqual({ type: 'session_ended' });
    expect(state.sessions.has('alice')).toBe(false);
    expect(state.sessions.has('bob')).toBe(false);
  });
});
