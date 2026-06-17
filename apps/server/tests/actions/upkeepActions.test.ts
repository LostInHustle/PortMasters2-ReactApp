import { describe, expect, it } from 'vitest';
import { handleDoMaintenance, handleHireEscort } from '../../src/actions/upkeepActions.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py handle_game_action's
// doMaintenance/hireEscort branches (lines 1679-1692).
describe('handleDoMaintenance', () => {
  it('returns false outside phase 3 or once already ready', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 2;
    expect(handleDoMaintenance(sess, 0)).toBe(false);

    sess.games[0].phase = 3;
    sess.ready.add(0);
    expect(handleDoMaintenance(sess, 0)).toBe(false);
  });

  it('pays maintenance, marks ready, and returns true when affordable', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 3;
    const before = sess.games[0].money;
    expect(handleDoMaintenance(sess, 0)).toBe(true);
    expect(sess.games[0].money).toBeLessThan(before);
    expect(sess.games[0].gameOver).toBe(false);
    expect(sess.ready.has(0)).toBe(true);
  });

  it('bankrupts the game when maintenance cannot be paid, but still marks ready', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 3;
    sess.games[0].money = 0;
    expect(handleDoMaintenance(sess, 0)).toBe(true);
    expect(sess.games[0].gameOver).toBe(true);
    expect(sess.games[0].bankrupt).toBe(true);
    expect(sess.games[0].phase).toBe('bankruptcy');
  });
});

describe('handleHireEscort', () => {
  it('returns false outside phase 3 or once already ready for upkeep', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 2;
    expect(handleHireEscort(sess, 0)).toBe(false);

    sess.games[0].phase = 3;
    sess.ready.add(0);
    expect(handleHireEscort(sess, 0)).toBe(false);
  });

  it('hires an escort and grants pirate immunity', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 3;
    expect(handleHireEscort(sess, 0)).toBe(true);
    expect(sess.games[0].pirateImmunity).toBe(true);
  });
});
