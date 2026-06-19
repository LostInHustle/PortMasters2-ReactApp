import type { ItemId } from '../data/commodities.js';
import type { PortId } from '../data/ports.js';

// Ported verbatim from PortMasters2/server.py gen_resource_card/gen_product_purchase_card
// (lines 658-705). materialCost/materialDetails are only present on product-purchase cards.
export interface MarketResource {
  type: ItemId;
  quantity: number;
  price: number;
  /**
   * Per-unit price after item-specific boon/module discounts (e.g. Hemp Monopoly, Kiln Cellar),
   * filled in by the server when serializing game state -- see getCardResourceUnitPrices. Equal
   * to `price` when no such discount is active. Card-wide discounts (Merchant's Charm,
   * Smuggler's Hold) apply to the whole purchase rather than a single line, so they only show up
   * in MarketCard.effectiveCost, not here.
   */
  effectivePrice?: number;
  materialCost?: number;
  materialDetails?: string;
}

export interface MarketCard {
  /** Assigned by phaseAdvance as a 0-based index when the round's hand is dealt (server.py:1294). */
  id?: number;
  port: PortId;
  resources: readonly MarketResource[];
  totalCost: number;
  /**
   * What a purchase of this card actually charges once every active boon and module discount is
   * applied (see getCardFinalCost), filled in by the server when serializing game state. Equal to
   * `totalCost` when nothing discounts this purchase.
   */
  effectiveCost?: number;
  isProductCard: boolean;
}

// Ported verbatim from PortMasters2/server.py gen_raw_order/gen_product_order/
// gen_emperor_mandate_order (lines 598-642, 598-610).
export interface OrderResource {
  type: ItemId;
  required: number;
}

export interface CustomerOrder {
  /** Assigned by phaseAdvance as a 0-based index when the round's orders are dealt (server.py:1316,1322). */
  id?: number;
  /** Present only on the Emperor Mandate order, if one fires this round. */
  kind?: 'EmperorMandate';
  demandPort: PortId;
  resources: readonly OrderResource[];
  reward: number;
  totalItems: number;
  isProductOrder: boolean;
  /** Set by gen_mixed_order when this order resolved a purchased intel clue. */
  fromIntel?: boolean;
}
