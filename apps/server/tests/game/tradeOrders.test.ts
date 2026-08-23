import type { ItemId, TradeOrder } from '@pm2/shared';
import { describe, expect, it } from 'vitest';
import {
  acceptTrade,
  createTradeOrder,
  rejectTrade,
  sanitizeTargetSlot,
  sanitizeTradeItems,
  type TradeGame,
} from '../../src/game/tradeOrders.js';

// Expected behavior hand-derived from PortMasters2/server.py sanitize_trade_items/
// create_trade_order/accept_trade/reject_trade (lines 1193-1441).
describe('sanitizeTradeItems', () => {
  it('keeps well-formed entries: a known resource/product or gold, positive integer quantity', () => {
    expect(
      sanitizeTradeItems([
        { type: '麻布', quantity: 3 },
        { type: '金币', quantity: 10 },
      ]),
    ).toEqual([
      { type: '麻布', quantity: 3 },
      { type: '金币', quantity: 10 },
    ]);
  });

  it('drops the negative-quantity exploit, zero, non-integers, unknown types, and booleans', () => {
    expect(
      sanitizeTradeItems([
        { type: '麻布', quantity: -5 },
        { type: '麻布', quantity: 0 },
        { type: '麻布', quantity: 1.5 },
        { type: '不存在的物品', quantity: 1 },
        { type: '麻布', quantity: true },
        { type: '麻布' },
        'not an object',
        null,
      ]),
    ).toEqual([]);
  });

  it('returns empty for a non-array input', () => {
    expect(sanitizeTradeItems('not an array')).toEqual([]);
    expect(sanitizeTradeItems(undefined)).toEqual([]);
  });

  it('merges repeated entries for the same good into one total', () => {
    expect(
      sanitizeTradeItems([
        { type: '麻布', quantity: 5 },
        { type: '金币', quantity: 2 },
        { type: '麻布', quantity: 5 },
        { type: '金币', quantity: 3 },
      ]),
    ).toEqual([
      { type: '麻布', quantity: 10 },
      { type: '金币', quantity: 5 },
    ]);
  });
});

// acceptTrade checks affordability one entry at a time against the whole balance, then applies
// every entry. Repeated entries for one good therefore used to be charged more than once, which
// let a captain hand over goods and gold they did not have.
describe('the repeated item exploit', () => {
  const gameWith = (money: number, hemp: number): TradeGame => ({
    money,
    inventory: { 麻布: hemp } as Record<ItemId, number>,
    log: () => {},
  });

  it('refuses an order that would take more goods than the seller owns', () => {
    const seller = gameWith(100, 5);
    const buyer = gameWith(100, 0);
    const ctx = { tradeOrders: [] as TradeOrder[], tradeIdCounter: 0, players: ['a', 'b'] };
    const order = createTradeOrder(
      ctx,
      0,
      [
        { type: '麻布', quantity: 5 },
        { type: '麻布', quantity: 5 },
      ],
      [],
    );
    expect(order!.sell).toEqual([{ type: '麻布', quantity: 10 }]);

    expect(
      acceptTrade({ tradeOrders: ctx.tradeOrders, games: [seller, buyer] }, order!.id, 1),
    ).toBe(false);
    expect(seller.inventory['麻布']).toBe(5);
    expect(buyer.inventory['麻布']).toBe(0);
  });

  it('never lets a balance go negative through a repeated gold entry', () => {
    const seller = gameWith(100, 0);
    const buyer = gameWith(100, 0);
    const ctx = { tradeOrders: [] as TradeOrder[], tradeIdCounter: 0, players: ['a', 'b'] };
    const order = createTradeOrder(
      ctx,
      0,
      [
        { type: '金币', quantity: 100 },
        { type: '金币', quantity: 100 },
      ],
      [],
    );

    expect(
      acceptTrade({ tradeOrders: ctx.tradeOrders, games: [seller, buyer] }, order!.id, 1),
    ).toBe(false);
    expect(seller.money).toBe(100);
    expect(buyer.money).toBe(100);
  });

  it('still settles a repeated entry the seller can actually cover', () => {
    const seller = gameWith(100, 10);
    const buyer = gameWith(100, 0);
    const ctx = { tradeOrders: [] as TradeOrder[], tradeIdCounter: 0, players: ['a', 'b'] };
    const order = createTradeOrder(
      ctx,
      0,
      [
        { type: '麻布', quantity: 4 },
        { type: '麻布', quantity: 6 },
      ],
      [],
    );

    expect(
      acceptTrade({ tradeOrders: ctx.tradeOrders, games: [seller, buyer] }, order!.id, 1),
    ).toBe(true);
    expect(seller.inventory['麻布']).toBe(0);
    expect(buyer.inventory['麻布']).toBe(10);
  });
});

describe('createTradeOrder', () => {
  it('assigns sequential trade_N ids and stores the sanitized item lists', () => {
    const ctx = { tradeOrders: [], tradeIdCounter: 0, players: ['a', 'b'] };
    const first = createTradeOrder(ctx, 0, [{ type: '麻布', quantity: 2 }], []);
    const second = createTradeOrder(ctx, 1, [], [{ type: '金币', quantity: 5 }]);
    expect(first?.id).toBe('trade_1');
    expect(second?.id).toBe('trade_2');
    expect(ctx.tradeOrders).toHaveLength(2);
  });

  it('returns undefined and stores nothing when both sides sanitize to empty', () => {
    const ctx = { tradeOrders: [], tradeIdCounter: 0, players: ['a', 'b'] };
    const order = createTradeOrder(ctx, 0, [{ type: 'junk', quantity: -1 }], []);
    expect(order).toBeUndefined();
    expect(ctx.tradeOrders).toHaveLength(0);
  });
});

function makeGame(money: number, inventory: Partial<Record<ItemId, number>> = {}): TradeGame {
  return {
    money,
    inventory: inventory as Record<ItemId, number>,
    log: () => {},
  };
}

describe('acceptTrade', () => {
  it('swaps sell-for-buy between seller and buyer on success', () => {
    const seller = makeGame(100, { 麻布: 10 } as Record<ItemId, number>);
    const buyer = makeGame(50, { 丝绸: 2, 麻布: 0 } as Record<ItemId, number>);
    const order: TradeOrder = {
      id: 'trade_1',
      sellerSlot: 0,
      sell: [{ type: '麻布', quantity: 5 }],
      buy: [{ type: '金币', quantity: 20 }],
      targetSlot: null,
    };
    const ctx = { tradeOrders: [order], games: [seller, buyer] as const };
    expect(acceptTrade(ctx, 'trade_1', 1)).toBe(true);
    expect(seller.inventory['麻布']).toBe(5);
    expect(buyer.inventory['麻布']).toBe(5);
    expect(seller.money).toBe(120);
    expect(buyer.money).toBe(30);
    expect(ctx.tradeOrders).toHaveLength(0);
  });

  it('rejects when the seller cannot afford their own sell side (no mutation happens)', () => {
    const seller = makeGame(100, { 麻布: 2 } as Record<ItemId, number>);
    const buyer = makeGame(50);
    const order: TradeOrder = {
      id: 'trade_1',
      sellerSlot: 0,
      sell: [{ type: '麻布', quantity: 5 }],
      buy: [],
      targetSlot: null,
    };
    const ctx = { tradeOrders: [order], games: [seller, buyer] as const };
    expect(acceptTrade(ctx, 'trade_1', 1)).toBe(false);
    expect(seller.inventory['麻布']).toBe(2);
    expect(ctx.tradeOrders).toHaveLength(1);
  });

  it('rejects when the buyer cannot afford the buy side', () => {
    const seller = makeGame(100, { 麻布: 10 } as Record<ItemId, number>);
    const buyer = makeGame(5);
    const order: TradeOrder = {
      id: 'trade_1',
      sellerSlot: 0,
      sell: [{ type: '麻布', quantity: 5 }],
      buy: [{ type: '金币', quantity: 20 }],
      targetSlot: null,
    };
    const ctx = { tradeOrders: [order], games: [seller, buyer] as const };
    expect(acceptTrade(ctx, 'trade_1', 1)).toBe(false);
  });

  it('rejects a self-accept (buyer slot equals seller slot) and an unknown order id', () => {
    const seller = makeGame(100, { 麻布: 10 } as Record<ItemId, number>);
    const buyer = makeGame(50);
    const order: TradeOrder = {
      id: 'trade_1',
      sellerSlot: 0,
      sell: [],
      buy: [],
      targetSlot: null,
    };
    const ctx = { tradeOrders: [order], games: [seller, buyer] as const };
    expect(acceptTrade(ctx, 'trade_1', 0)).toBe(false);
    expect(acceptTrade(ctx, 'nope', 1)).toBe(false);
  });
});

describe('rejectTrade', () => {
  it('removes and returns the matching order', () => {
    const order: TradeOrder = {
      id: 'trade_1',
      sellerSlot: 0,
      sell: [],
      buy: [],
      targetSlot: null,
    };
    const ctx = { tradeOrders: [order] };
    expect(rejectTrade(ctx, 'trade_1', 1)).toBe(order);
    expect(ctx.tradeOrders).toHaveLength(0);
  });

  it('returns undefined for an unknown order id and leaves the list untouched', () => {
    const order: TradeOrder = {
      id: 'trade_1',
      sellerSlot: 0,
      sell: [],
      buy: [],
      targetSlot: null,
    };
    const ctx = { tradeOrders: [order] };
    expect(rejectTrade(ctx, 'nope', 1)).toBeUndefined();
    expect(ctx.tradeOrders).toHaveLength(1);
  });
});

// A directed offer is addressed to one captain: only they (or its author, cancelling) may act on
// it. Enforced on the server, not just hidden in the UI, so a crafted action cannot poach a
// private deal or make someone else's offer vanish.
describe('directed offers', () => {
  const roster = { players: ['alice', 'bob', 'carol'] };

  it('keeps a valid target slot and defaults to open when none is given', () => {
    const ctx = { tradeOrders: [], tradeIdCounter: 0, ...roster };
    expect(createTradeOrder(ctx, 0, [{ type: '麻布', quantity: 1 }], [], 2)?.targetSlot).toBe(2);
    expect(createTradeOrder(ctx, 0, [{ type: '麻布', quantity: 1 }], [])?.targetSlot).toBeNull();
  });

  it('falls back to open for a target that is not a real other slot', () => {
    for (const bad of [0, 3, -1, 1.5, 'bob', null, undefined, NaN]) {
      expect(sanitizeTargetSlot(roster, 0, bad)).toBeNull();
    }
    expect(sanitizeTargetSlot(roster, 0, 1)).toBe(1);
  });

  it('lets only the target accept a directed offer', () => {
    const games = [
      makeGame(100, { 麻布: 9 }),
      makeGame(100, { 麻布: 0 }),
      makeGame(100, { 麻布: 0 }),
    ] as const;
    const order: TradeOrder = {
      id: 'trade_1',
      sellerSlot: 0,
      sell: [{ type: '麻布', quantity: 3 }],
      buy: [],
      targetSlot: 2,
    };
    const ctx = { tradeOrders: [order], games };
    expect(acceptTrade(ctx, 'trade_1', 1)).toBe(false); // not the addressee
    expect(ctx.tradeOrders).toHaveLength(1);
    expect(acceptTrade(ctx, 'trade_1', 2)).toBe(true);
    expect(games[2].inventory['麻布']).toBe(3);
  });

  it('lets only the target or the author withdraw a directed offer', () => {
    const make = (): TradeOrder => ({
      id: 'trade_1',
      sellerSlot: 0,
      sell: [],
      buy: [],
      targetSlot: 2,
    });
    let ctx = { tradeOrders: [make()] };
    expect(rejectTrade(ctx, 'trade_1', 1)).toBeUndefined();
    expect(ctx.tradeOrders).toHaveLength(1);
    expect(rejectTrade(ctx, 'trade_1', 2)).toBeDefined();

    ctx = { tradeOrders: [make()] };
    expect(rejectTrade(ctx, 'trade_1', 0)).toBeDefined(); // the author cancels their own
  });

  it('leaves open offers available to the whole room', () => {
    const games = [
      makeGame(100, { 麻布: 9 }),
      makeGame(100, { 麻布: 0 }),
      makeGame(100, { 麻布: 0 }),
    ] as const;
    const order: TradeOrder = {
      id: 'trade_1',
      sellerSlot: 0,
      sell: [{ type: '麻布', quantity: 3 }],
      buy: [],
      targetSlot: null,
    };
    const ctx = { tradeOrders: [order], games };
    expect(acceptTrade(ctx, 'trade_1', 1)).toBe(true);
  });
});
