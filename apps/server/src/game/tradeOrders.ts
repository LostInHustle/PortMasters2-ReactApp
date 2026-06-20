import {
  GOLD,
  PRODUCTS,
  RESOURCES,
  type ItemId,
  type TradeItem,
  type TradeItemType,
  type TradeOrder,
} from '@pm2/shared';

const TRADEABLE_TYPES = new Set<string>([...RESOURCES, ...PRODUCTS, GOLD]);

// Ported verbatim from PortMasters2/server.py sanitize_trade_items (lines 1193-1205): the
// barter-exploit guard. A well-formed entry is a known tradeable good (or gold) with a positive
// integer quantity; anything else is dropped so a crafted order can't add goods/gold to the
// proposer while subtracting from the accepter. Python additionally excludes bool (an int
// subclass there); typeof quantity === 'number' already excludes JS booleans, so no separate
// check is needed here.
export function sanitizeTradeItems(items: unknown): TradeItem[] {
  const clean: TradeItem[] = [];
  if (!Array.isArray(items)) return clean;
  for (const it of items) {
    if (typeof it !== 'object' || it === null) continue;
    const { type, quantity } = it as { type?: unknown; quantity?: unknown };
    if (
      typeof type === 'string' &&
      TRADEABLE_TYPES.has(type) &&
      typeof quantity === 'number' &&
      Number.isInteger(quantity) &&
      quantity > 0
    ) {
      clean.push({ type: type as TradeItemType, quantity });
    }
  }
  return clean;
}

export interface TradeOrderContext {
  tradeOrders: TradeOrder[];
  tradeIdCounter: number;
}

// Ported verbatim from PortMasters2/server.py create_trade_order (lines 1378-1391).
export function createTradeOrder(
  ctx: TradeOrderContext,
  sellerSlot: number,
  sellItems: unknown,
  buyItems: unknown,
): TradeOrder | undefined {
  const sell = sanitizeTradeItems(sellItems);
  const buy = sanitizeTradeItems(buyItems);
  if (sell.length === 0 && buy.length === 0) return undefined;
  ctx.tradeIdCounter += 1;
  const order: TradeOrder = { id: `trade_${ctx.tradeIdCounter}`, sellerSlot, sell, buy };
  ctx.tradeOrders.push(order);
  return order;
}

export interface TradeGame {
  money: number;
  inventory: Record<ItemId, number>;
  log(message: string): void;
}

export interface AcceptTradeContext {
  tradeOrders: TradeOrder[];
  games: readonly TradeGame[];
}

// Ported verbatim from PortMasters2/server.py accept_trade (lines 1393-1435): checks both
// sides can afford their half before mutating anything, then swaps sell-for-buy in one pass.
export function acceptTrade(ctx: AcceptTradeContext, orderId: unknown, buyerSlot: number): boolean {
  const order = ctx.tradeOrders.find((o) => o.id === orderId);
  if (!order || order.sellerSlot === buyerSlot) return false;
  const sellerGame = ctx.games[order.sellerSlot]!;
  const buyerGame = ctx.games[buyerSlot]!;
  for (const item of order.sell) {
    if (
      item.type === GOLD
        ? sellerGame.money < item.quantity
        : sellerGame.inventory[item.type as ItemId] < item.quantity
    ) {
      return false;
    }
  }
  for (const item of order.buy) {
    if (
      item.type === GOLD
        ? buyerGame.money < item.quantity
        : buyerGame.inventory[item.type as ItemId] < item.quantity
    ) {
      return false;
    }
  }
  for (const item of order.sell) {
    if (item.type === GOLD) {
      sellerGame.money -= item.quantity;
      buyerGame.money += item.quantity;
    } else {
      sellerGame.inventory[item.type as ItemId] -= item.quantity;
      buyerGame.inventory[item.type as ItemId] += item.quantity;
    }
  }
  for (const item of order.buy) {
    if (item.type === GOLD) {
      buyerGame.money -= item.quantity;
      sellerGame.money += item.quantity;
    } else {
      buyerGame.inventory[item.type as ItemId] -= item.quantity;
      sellerGame.inventory[item.type as ItemId] += item.quantity;
    }
  }
  ctx.tradeOrders.splice(ctx.tradeOrders.indexOf(order), 1);
  sellerGame.log('🤝 互市成功！');
  buyerGame.log('🤝 互市成功！');
  return true;
}

// Ported verbatim from PortMasters2/server.py reject_trade (lines 1437-1441).
export function rejectTrade(
  ctx: { tradeOrders: TradeOrder[] },
  orderId: unknown,
): TradeOrder | undefined {
  const order = ctx.tradeOrders.find((o) => o.id === orderId);
  if (order) {
    ctx.tradeOrders.splice(ctx.tradeOrders.indexOf(order), 1);
  }
  return order;
}
