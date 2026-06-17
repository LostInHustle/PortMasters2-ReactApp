import { describe, expect, it } from 'vitest';
import {
  handleAssignTask,
  handleFireWorker,
  handleHireWorker,
} from '../../src/actions/workerActions.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py handle_game_action's
// hireWorker/fireWorker/assignTask branches (lines 1661-1672). Worker type ids are the English
// keys in WAGES (e.g. 'weaver'); product task ids are the Chinese keys in RECIPES (e.g. '布衣',
// which costs 麻布:2 + 丝绸:1 -- both present in a fresh game's starting inventory).
describe('handleHireWorker', () => {
  it('rejects an unknown worker type or the wrong phase', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 'worker_mgmt';
    expect(handleHireWorker(sess, 0, { workerType: 'not_a_real_worker' })).toBe(false);
    sess.games[0].phase = 1;
    expect(handleHireWorker(sess, 0, { workerType: 'weaver' })).toBe(false);
  });

  it('hires a valid worker type in worker_mgmt', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 'worker_mgmt';
    expect(handleHireWorker(sess, 0, { workerType: 'weaver' })).toBe(true);
    expect(sess.games[0].workers['weaver']).toHaveLength(1);
  });
});

describe('handleFireWorker', () => {
  it('defaults to the always-invalid index -1 when none is given, so changed=true but no one is fired', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 'worker_mgmt';
    handleHireWorker(sess, 0, { workerType: 'weaver' });
    expect(handleFireWorker(sess, 0, { workerType: 'weaver' })).toBe(true);
    expect(sess.games[0].workers['weaver']).toHaveLength(1);
  });

  it('fires the worker at an explicit valid index', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 'worker_mgmt';
    handleHireWorker(sess, 0, { workerType: 'weaver' });
    expect(handleFireWorker(sess, 0, { workerType: 'weaver', index: 0 })).toBe(true);
    expect(sess.games[0].workers['weaver']).toHaveLength(0);
  });
});

describe('handleAssignTask', () => {
  it('rejects a task outside the recipe table', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 'worker_mgmt';
    handleHireWorker(sess, 0, { workerType: 'weaver' });
    expect(handleAssignTask(sess, 0, { workerType: 'weaver', task: 'not_a_product' })).toBe(false);
  });

  it('assigns a valid product task to a valid worker', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 'worker_mgmt';
    handleHireWorker(sess, 0, { workerType: 'weaver' });
    expect(handleAssignTask(sess, 0, { workerType: 'weaver', task: '布衣' })).toBe(true);
    expect(sess.games[0].workers['weaver']![0]!.task).toBe('布衣');
  });
});
