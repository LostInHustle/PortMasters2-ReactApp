import type { ItemId } from '../data/commodities.js';

// Ported verbatim from PortMasters2/server.py TRADEABLE_TYPES (line 1190): a barter-phase item
// is a known resource/product, or gold itself.
export const GOLD = '金币' as const;
export type TradeItemType = ItemId | typeof GOLD;

// Ported verbatim from PortMasters2/server.py sanitize_trade_items's well-formed shape
// (lines 1193-1205) and create_trade_order's stored order shape (lines 1378-1391).
export interface TradeItem {
  type: TradeItemType;
  quantity: number;
}

export interface TradeOrder {
  id: string;
  sellerSlot: 0 | 1;
  sell: TradeItem[];
  buy: TradeItem[];
}
