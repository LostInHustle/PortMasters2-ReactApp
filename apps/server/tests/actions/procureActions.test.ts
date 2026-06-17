import { describe, expect, it } from 'vitest';
import { handlePurchase, handlePurchaseIntel } from '../../src/actions/procureActions.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py handle_game_action's
// purchase/purchaseIntel branches (lines 1622-1631).
describe('handlePurchase', () => {
  it('returns false outside phase 1', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 0;
    expect(handlePurchase(sess, 0, { cardId: 0 })).toBe(false);
  });

  it('returns true even when no matching card exists (changed is unconditional within phase 1)', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 1;
    expect(handlePurchase(sess, 0, { cardId: 999 })).toBe(true);
  });

  it('purchases a matching, not-yet-purchased card', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 1;
    sess.games[0].resourceCards = [
      {
        id: 0,
        port: '泉州港',
        resources: [{ type: '麻布', quantity: 1, price: 1 }],
        totalCost: 1,
        isProductCard: false,
      },
    ];
    const before = sess.games[0].money;
    expect(handlePurchase(sess, 0, { cardId: 0 })).toBe(true);
    expect(sess.games[0].purchasedCards.has(0)).toBe(true);
    expect(sess.games[0].money).toBeLessThan(before);
  });

  it('does not re-purchase an already-purchased card', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 1;
    sess.games[0].resourceCards = [
      {
        id: 0,
        port: '泉州港',
        resources: [{ type: '麻布', quantity: 1, price: 1 }],
        totalCost: 1,
        isProductCard: false,
      },
    ];
    handlePurchase(sess, 0, { cardId: 0 });
    const moneyAfterFirst = sess.games[0].money;
    handlePurchase(sess, 0, { cardId: 0 });
    expect(sess.games[0].money).toBe(moneyAfterFirst);
  });
});

describe('handlePurchaseIntel', () => {
  it('returns false outside phase 1', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 0;
    expect(handlePurchaseIntel(sess, 0)).toBe(false);
  });

  it('returns true and spends money in phase 1', () => {
    const sess = new SharedSession('alice', 'bob');
    sess.games[0].phase = 1;
    sess.games[0].phase2DemandTags = ['麻布'];
    const before = sess.games[0].money;
    expect(handlePurchaseIntel(sess, 0)).toBe(true);
    expect(sess.games[0].money).toBeLessThan(before);
  });
});
