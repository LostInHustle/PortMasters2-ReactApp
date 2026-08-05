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
  players: readonly string[];
}

// Which captain an offer is addressed to. Anything that is not a real other slot in this room
// falls back to null, meaning "open to everyone": a crafted targetSlot can then only ever widen
// an offer's audience, never point it at a player who is not in the session.
export function sanitizeTargetSlot(
  ctx: { players: readonly string[] },
  sellerSlot: number,
  target: unknown,
): number | null {
  if (typeof target !== 'number' || !Number.isInteger(target)) return null;
  if (target < 0 || target >= ctx.players.length) return null;
  if (target === sellerSlot) return null;
  return target;
}

// Ported from PortMasters2/server.py create_trade_order, extended with an optional target so an
// offer can be addressed to one captain instead of the whole room.
export function createTradeOrder(
  ctx: TradeOrderContext,
  sellerSlot: number,
  sellItems: unknown,
  buyItems: unknown,
  targetSlot?: unknown,
): TradeOrder | undefined {
  const sell = sanitizeTradeItems(sellItems);
  const buy = sanitizeTradeItems(buyItems);
  if (sell.length === 0 && buy.length === 0) return undefined;
  ctx.tradeIdCounter += 1;
  const order: TradeOrder = {
    id: `trade_${ctx.tradeIdCounter}`,
    sellerSlot,
    sell,
    buy,
    targetSlot: sanitizeTargetSlot(ctx, sellerSlot, targetSlot),
  };
  ctx.tradeOrders.push(order);
  return order;
}

// Whether a given captain is allowed to act on an offer. An open offer is fair game for anyone
// except its author; a directed one is strictly between its author and its target. Enforced here
// rather than only by hiding it in the UI, so a crafted acceptTrade cannot poach someone else's
// private deal.
export function canActOnOrder(order: TradeOrder, slot: number): boolean {
  if (order.targetSlot === null) return true;
  return slot === order.targetSlot || slot === order.sellerSlot;
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
  if (!canActOnOrder(order, buyerSlot)) return false;
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

// Ported from PortMasters2/server.py reject_trade, with the same audience rule as accepting: a
// captain a directed offer was never addressed to cannot make it disappear.
export function rejectTrade(
  ctx: { tradeOrders: TradeOrder[] },
  orderId: unknown,
  rejecterSlot: number,
): TradeOrder | undefined {
  const order = ctx.tradeOrders.find((o) => o.id === orderId);
  if (!order || !canActOnOrder(order, rejecterSlot)) return undefined;
  ctx.tradeOrders.splice(ctx.tradeOrders.indexOf(order), 1);
  return order;
}
