import { describe, expect, it } from 'vitest';
import {
  handleCancelModuleDraft,
  handleDraftModules,
  handleEquipModule,
  handleRerollModuleDraft,
  handleUpgradeShip,
} from '../../src/actions/shipyardActions.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py handle_game_action's
// upgradeShip/draftModules/equipModule/cancelModuleDraft/rerollModuleDraft branches
// (lines 1693-1721).
describe('handleUpgradeShip', () => {
  it('returns false outside phase 4 or once shipLevel hits the cap', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 3;
    expect(handleUpgradeShip(sess, 0)).toBe(false);

    sess.games[0]!.phase = 4;
    sess.games[0]!.shipLevel = 3;
    expect(handleUpgradeShip(sess, 0)).toBe(false);
  });

  it('returns true and only deducts money/levels up when affordable', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 4;
    sess.games[0]!.money = 5; // shipUpgradeCost[0] is 15, unaffordable
    expect(handleUpgradeShip(sess, 0)).toBe(true);
    expect(sess.games[0]!.shipLevel).toBe(0);

    sess.games[0]!.money = 100;
    expect(handleUpgradeShip(sess, 0)).toBe(true);
    expect(sess.games[0]!.shipLevel).toBe(1);
  });
});

describe('handleDraftModules / handleRerollModuleDraft / handleCancelModuleDraft', () => {
  it('returns false outside phase 4', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 3;
    expect(handleDraftModules(sess, 0)).toBe(false);
    expect(handleRerollModuleDraft(sess, 0)).toBe(false);
    expect(handleCancelModuleDraft(sess, 0)).toBe(false);
  });

  it('opens, rerolls, and cancels a module draft once the shipyard has a slot', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 4;
    sess.games[0]!.shipLevel = 1;

    expect(handleDraftModules(sess, 0)).toBe(true);
    expect(sess.games[0]!.draftOpen).toBe(true);
    expect(sess.games[0]!.draftChoices.length).toBeGreaterThan(0);

    expect(handleRerollModuleDraft(sess, 0)).toBe(true);
    expect(sess.games[0]!.draftRerolled).toBe(true);

    expect(handleCancelModuleDraft(sess, 0)).toBe(true);
    expect(sess.games[0]!.draftOpen).toBe(false);
  });
});

describe('handleEquipModule', () => {
  it('returns false outside phase 4', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 3;
    expect(handleEquipModule(sess, 0, { choiceIndex: 0 })).toBe(false);
  });

  it('returns true within phase 4 even with an out-of-range choiceIndex', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 4;
    expect(handleEquipModule(sess, 0, { choiceIndex: 99 })).toBe(true);
    expect(sess.games[0]!.equippedModules).toHaveLength(0);
  });

  it('equips the chosen draft module, ignoring an out-of-range swapIndex', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 4;
    sess.games[0]!.shipLevel = 1;
    handleDraftModules(sess, 0);
    const chosen = sess.games[0]!.draftChoices[0]!;

    expect(handleEquipModule(sess, 0, { choiceIndex: 0, swapIndex: 99 })).toBe(true);
    expect(sess.games[0]!.equippedModules.map((m) => m.id)).toContain(chosen.id);
  });
});
