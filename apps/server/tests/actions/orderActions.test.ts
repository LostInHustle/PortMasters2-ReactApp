import { describe, expect, it } from 'vitest';
import { handleCompleteOrder } from '../../src/actions/orderActions.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Expected behavior hand-derived from PortMasters2/server.py handle_game_action's
// completeOrder branch (lines 1673-1678).
function makeOrder(id: number) {
  return {
    id,
    demandPort: '泉州港' as const,
    resources: [{ type: '麻布' as const, required: 2 }],
    reward: 50,
    totalItems: 2,
    isProductOrder: false,
  };
}

describe('handleCompleteOrder', () => {
  it('returns false outside phase 2', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 1;
    sess.games[0]!.customerCards = [makeOrder(0)];
    expect(handleCompleteOrder(sess, 0, { orderId: 0 })).toBe(false);
  });

  it('returns true within phase 2 even when no matching order exists', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 2;
    expect(handleCompleteOrder(sess, 0, { orderId: 999 })).toBe(true);
  });

  it('completes a matching, not-yet-completed order', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 2;
    sess.games[0]!.customerCards = [makeOrder(0)];
    const moneyBefore = sess.games[0]!.money;
    expect(handleCompleteOrder(sess, 0, { orderId: 0 })).toBe(true);
    expect(sess.games[0]!.completedOrders.has(0)).toBe(true);
    expect(sess.games[0]!.inventory['麻布']).toBe(6);
    expect(sess.games[0]!.money).toBeGreaterThan(moneyBefore);
  });

  it('does not re-complete an already-completed order', () => {
    const sess = SharedSession.createPair('alice', 'bob');
    sess.games[0]!.phase = 2;
    sess.games[0]!.customerCards = [makeOrder(0)];
    handleCompleteOrder(sess, 0, { orderId: 0 });
    const inventoryAfterFirst = sess.games[0]!.inventory['麻布'];
    handleCompleteOrder(sess, 0, { orderId: 0 });
    expect(sess.games[0]!.inventory['麻布']).toBe(inventoryAfterFirst);
  });
});
