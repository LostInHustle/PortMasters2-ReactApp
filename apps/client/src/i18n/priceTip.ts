import {
  COMMODITIES,
  PRODUCT_PRICES,
  type MarketResource,
  type ProductId,
  type ResourceId,
} from '@pm2/shared';
import { tr, type Lang } from './LangContext.js';

// Explains how a supply card's unit price is derived, so a player can see the calculation behind
// the number rather than just the result. Mirrors the existing shipping-cost formula tooltip.
// Raw materials carry a base-price band; finished products are priced from their material cost
// times a markup, clamped to the product's range. Both are then shifted by the home port, the
// weather and any active fortunes or modules, which is why the shown price varies.
export function priceTip(r: MarketResource, lang: Lang): string {
  if (r.materialDetails !== undefined) {
    const [min, max] = PRODUCT_PRICES[r.type as ProductId];
    const matCost = Math.round(r.materialCost ?? 0);
    return tr(
      lang,
      `成品。单价 ≈ 材料成本（约 ${matCost}）× 加价（1.4 到 1.8 倍），并限定在每个 ${min} 到 ${max} 的区间内。特产港、天象与福缘还会让它浮动。`,
      `Finished product. Unit price ≈ material cost (about ${matCost}) × markup (1.4 to 1.8), capped to ${min} to ${max} per unit. The home port, weather and fortunes shift it too.`,
    );
  }
  const [lo, hi] = COMMODITIES[r.type as ResourceId].basePrice;
  return tr(
    lang,
    `原料。基准单价每个 ${lo} 到 ${hi}。在它的特产港更便宜；天象与福缘也会让它浮动。`,
    `Raw material. Base price ${lo} to ${hi} per unit. Cheaper at its home port; the weather and fortunes shift it too.`,
  );
}
