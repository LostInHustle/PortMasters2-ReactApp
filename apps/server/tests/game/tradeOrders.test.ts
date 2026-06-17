import type { ItemId, TradeOrder } from '@pm2/shared';
import { describe, expect, it } from 'vitest';
import {
  acceptTrade,
  createTradeOrder,
  rejectTrade,
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
});

describe('createTradeOrder', () => {
  it('assigns sequential trade_N ids and stores the sanitized item lists', () => {
    const ctx = { tradeOrders: [], tradeIdCounter: 0 };
    const first = createTradeOrder(ctx, 0, [{ type: '麻布', quantity: 2 }], []);
    const second = createTradeOrder(ctx, 1, [], [{ type: '金币', quantity: 5 }]);
    expect(first?.id).toBe('trade_1');
    expect(second?.id).toBe('trade_2');
    expect(ctx.tradeOrders).toHaveLength(2);
  });

  it('returns undefined and stores nothing when both sides sanitize to empty', () => {
    const ctx = { tradeOrders: [], tradeIdCounter: 0 };
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
    };
    const ctx = { tradeOrders: [order], games: [seller, buyer] as const };
    expect(acceptTrade(ctx, 'trade_1', 1)).toBe(false);
  });

  it('rejects a self-accept (buyer slot equals seller slot) and an unknown order id', () => {
    const seller = makeGame(100, { 麻布: 10 } as Record<ItemId, number>);
    const buyer = makeGame(50);
    const order: TradeOrder = { id: 'trade_1', sellerSlot: 0, sell: [], buy: [] };
    const ctx = { tradeOrders: [order], games: [seller, buyer] as const };
    expect(acceptTrade(ctx, 'trade_1', 0)).toBe(false);
    expect(acceptTrade(ctx, 'nope', 1)).toBe(false);
  });
});

describe('rejectTrade', () => {
  it('removes and returns the matching order', () => {
    const order: TradeOrder = { id: 'trade_1', sellerSlot: 0, sell: [], buy: [] };
    const ctx = { tradeOrders: [order] };
    expect(rejectTrade(ctx, 'trade_1')).toBe(order);
    expect(ctx.tradeOrders).toHaveLength(0);
  });

  it('returns undefined for an unknown order id and leaves the list untouched', () => {
    const order: TradeOrder = { id: 'trade_1', sellerSlot: 0, sell: [], buy: [] };
    const ctx = { tradeOrders: [order] };
    expect(rejectTrade(ctx, 'nope')).toBeUndefined();
    expect(ctx.tradeOrders).toHaveLength(1);
  });
});
