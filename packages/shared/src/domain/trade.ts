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
