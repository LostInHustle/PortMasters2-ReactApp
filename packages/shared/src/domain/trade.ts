import type { ItemId } from '../data/commodities.js';

// Mirrors PortMasters2/server.py TRADEABLE_TYPES: a barter phase item
// is a known resource/product, or gold itself.
export const GOLD = '金币' as const;
export type TradeItemType = ItemId | typeof GOLD;

// Mirrors PortMasters2/server.py sanitize_trade_items's well formed shape
// and create_trade_order's stored order shape.
export interface TradeItem {
  type: TradeItemType;
  quantity: number;
}

export interface TradeOrder {
  id: string;
  sellerSlot: number;
  sell: TradeItem[];
  buy: TradeItem[];
  /**
   * Slot of the one captain this offer is addressed to, or null when it is open to the whole
   * room (the original behaviour, and still the default). A directed offer is only shown to,
   * and can only be accepted or declined by, its target, so a captain can strike a deal with
   * one specific partner without the rest of the room taking it first.
   */
  targetSlot: number | null;
}
