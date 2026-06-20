import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  handleJoinGame,
  handleReadyForNextPhase,
  handleRestart,
} from '../../src/actions/sessionActions.js';
import { UserStore } from '../../src/auth/UserStore.js';
import {
  createServerState,
  type Sendable,
  type ServerState,
} from '../../src/lobby/onlineRegistry.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py handle_game_action's
// join_game/ready_for_next_phase/restart branches (lines 1597-1598, 1616-1621, 1722-1730).
class FakeSocket implements Sendable {
  sent: unknown[] = [];
  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }
}

describe('handleJoinGame', () => {
  it('always returns true', () => {
    expect(handleJoinGame()).toBe(true);
  });
});

describe('handleReadyForNextPhase', () => {
  it('returns false outside the gated phases or once already ready', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 0;
    expect(handleReadyForNextPhase(sess, 0)).toBe(false);

    sess.games[0]!.phase = 1;
    sess.ready.add(0);
    expect(handleReadyForNextPhase(sess, 0)).toBe(false);
  });

  it('marks ready and advances once both players are ready, for each gated phase', () => {
    for (const phase of [1, 'worker_mgmt', 2, 4] as const) {
      const sess = SharedSession.createPair('alice', 'bob');
      sess.games[0]!.phase = phase;
      sess.games[1]!.phase = phase;
      expect(handleReadyForNextPhase(sess, 0)).toBe(true);
      expect(handleReadyForNextPhase(sess, 1)).toBe(true);
      expect(sess.games[0]!.phase).not.toBe(phase);
    }
  });
});

describe('handleRestart', () => {
  let dir: string;
  let state: ServerState;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pm2-restart-'));
    state = createServerState(new UserStore(join(dir, 'users.json')));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("refuses to restart while the partner's game is still in progress", () => {
    const alice = new FakeSocket();
    state.online.set('alice', alice);
    const sess = SharedSession.createPair('alice', 'bob');
    expect(handleRestart(state, sess, 0, 'alice')).toBe(false);
    expect(alice.sent).toEqual([
      { type: 'system_message', message: '需等待对方完成本局后才能重新起航' },
    ]);
  });

  it("restarts once the partner's game has ended, notifying the partner", () => {
    const bob = new FakeSocket();
    state.online.set('bob', bob);
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.money = 9999;
    sess.games[1]!.gameOver = true;

    expect(handleRestart(state, sess, 0, 'alice')).toBe(true);
    expect(sess.games[0]!.money).toBe(100);
    expect(bob.sent).toEqual([
      { type: 'system_message', message: '对方重新开始了游戏，双方进度已重置' },
    ]);
  });
});
