import { BOONS_TIER0 } from '@pm2/shared';
import { describe, expect, it } from 'vitest';
import { handleSelectBoon, handleStartBoon } from '../../src/actions/boonActions.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py handle_game_action's
// startBoon/selectBoon branches (lines 1599-1615).
describe('handleStartBoon', () => {
  it('marks ready and advances once both players are ready, returning changed=true', () => {
    const sess = new SharedSession('alice', 'bob');
    expect(handleStartBoon(sess, 0)).toBe(true);
    expect(sess.ready.has(0)).toBe(true);
    expect(sess.games[0].phase).toBe(0); // not advanced yet, partner not ready

    expect(handleStartBoon(sess, 1)).toBe(true);
    expect(sess.games[0].phase).toBe(5); // both ready -> advanced
  });

  it('returns false outside phase 0 or once already ready', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 5;
    expect(handleStartBoon(sess, 0)).toBe(false);

    sess.games[0].phase = 0;
    sess.ready.add(0);
    expect(handleStartBoon(sess, 0)).toBe(false);
  });
});

describe('handleSelectBoon', () => {
  it('applies the chosen boon, marks ready, and returns changed=true', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 5;
    sess.games[0].boonChoices = [BOONS_TIER0[0]!];
    expect(handleSelectBoon(sess, 0, { boonId: BOONS_TIER0[0]!.id })).toBe(true);
    expect(sess.ready.has(0)).toBe(true);
  });

  it('falls back to the full boon pool when boonChoices is empty', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 5;
    sess.games[0].boonChoices = [];
    expect(handleSelectBoon(sess, 0, { boonId: BOONS_TIER0[0]!.id })).toBe(true);
  });

  it('returns false (no ready, no broadcast) when the boon id does not match', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 5;
    sess.games[0].boonChoices = [BOONS_TIER0[0]!];
    expect(handleSelectBoon(sess, 0, { boonId: 'not-a-real-boon' })).toBe(false);
    expect(sess.ready.has(0)).toBe(false);
  });

  it('returns false outside phase 5 or once already ready', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 0;
    expect(handleSelectBoon(sess, 0, { boonId: BOONS_TIER0[0]!.id })).toBe(false);

    sess.games[0].phase = 5;
    sess.ready.add(0);
    expect(handleSelectBoon(sess, 0, { boonId: BOONS_TIER0[0]!.id })).toBe(false);
  });
});
