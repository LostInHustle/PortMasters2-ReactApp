import {
  COMMODITIES,
  EMPEROR_MANDATE_TEMPLATES,
  PRODUCT_PRICES,
  RECIPES,
  RESOURCE_PROBS,
  RESOURCES,
  type CustomerOrder,
  type IntelClue,
  type ItemId,
  type MarketCard,
  type MarketResource,
  type MonsoonState,
  type OrderResource,
  type PortId,
  type ProductId,
  type ResourceId,
} from '@pm2/shared';
import type { Rng } from './randomUtil.js';
import { pythonRound } from './mathUtil.js';

export interface CardGenContext {
  unlockedResources(): ResourceId[];
  unlockedProducts(): ProductId[];
  unlockedPorts(): PortId[];
  monsoonState: MonsoonState | null;
}

export interface MixedOrderContext extends CardGenContext {
  revealedIntel: IntelClue[];
}

function isResourceId(item: ItemId): item is ResourceId {
  return (RESOURCES as readonly ItemId[]).includes(item);
}

// Ported verbatim from PortMasters2/server.py env_purchase_price (lines 586-590).
export function envPurchasePrice(
  ctx: { monsoonState: MonsoonState | null },
  item: ItemId,
  price: number,
): number {
  const state = ctx.monsoonState;
  if (state && item === state.resource) {
    return Math.max(1, pythonRound(price * state.purchaseMultiplier));
  }
  return price;
}

// Ported verbatim from PortMasters2/server.py env_reward (lines 592-596).
export function envReward(
  ctx: { monsoonState: MonsoonState | null },
  port: PortId,
  reward: number,
): number {
  const state = ctx.monsoonState;
  if (state && (state.rewardPorts as readonly PortId[]).includes(port)) {
    return Math.max(1, pythonRound(reward * state.rewardMultiplier));
  }
  return reward;
}

// Ported verbatim from PortMasters2/server.py gen_emperor_mandate_order (lines 598-610).
export function genEmperorMandateOrder(
  ctx: { monsoonState: MonsoonState | null },
  size: number,
): CustomerOrder {
  const tpl = EMPEROR_MANDATE_TEMPLATES[size]!;
  const resources = tpl.resources.map((r) => ({ ...r }));
  const total = resources.reduce((sum, r) => sum + r.required, 0);
  return {
    kind: 'EmperorMandate',
    demandPort: tpl.port,
    resources,
    reward: envReward(ctx, tpl.port, tpl.reward),
    totalItems: total,
    isProductOrder: resources.some((r) => !isResourceId(r.type)),
  };
}

// Ported verbatim from PortMasters2/server.py gen_raw_order (lines 613-634).
export function genRawOrder(ctx: CardGenContext, rng: Rng, filterItem?: ResourceId): CustomerOrder {
  const num = rng.randint(1, 3);
  const resources: OrderResource[] = [];
  const unlockedRes = ctx.unlockedResources();
  const available = [...unlockedRes];
  const port = rng.choice(ctx.unlockedPorts());
  let total = 0;
  if (filterItem && unlockedRes.includes(filterItem)) {
    const req = rng.randint(2, 5);
    total += req;
    resources.push({ type: filterItem, required: req });
  } else {
    for (let i = 0; i < num; i++) {
      if (available.length === 0) break;
      const r = rng.choice(available);
      available.splice(available.indexOf(r), 1);
      const req = rng.randint(2, 5);
      total += req;
      resources.push({ type: r, required: req });
    }
  }
  const base = resources.reduce((sum, r) => sum + r.required * 5, 0);
  const reward = envReward(ctx, port, base + rng.randint(10, 25));
  return { demandPort: port, resources, reward, totalItems: total, isProductOrder: false };
}

// Ported verbatim from PortMasters2/server.py gen_product_order (lines 636-642).
export function genProductOrder(
  ctx: CardGenContext,
  rng: Rng,
  filterItem?: ProductId,
): CustomerOrder {
  const unlockedProd = ctx.unlockedProducts();
  const product =
    filterItem && unlockedProd.includes(filterItem) ? filterItem : rng.choice(unlockedProd);
  const req = rng.randint(1, 3);
  const port = rng.choice(ctx.unlockedPorts());
  const [lo, hi] = PRODUCT_PRICES[product];
  const basePrice = rng.randint(lo, hi);
  return {
    demandPort: port,
    resources: [{ type: product, required: req }],
    reward: envReward(ctx, port, basePrice * req),
    totalItems: req,
    isProductOrder: true,
  };
}

// Ported verbatim from PortMasters2/server.py gen_mixed_order (lines 644-656): each purchased
// clue resolves into exactly one order, with matching good and port. Mutates `used` on the
// matched clue, mirroring the Python in-place dict mutation.
export function genMixedOrder(ctx: MixedOrderContext, rng: Rng): CustomerOrder {
  const intel = ctx.revealedIntel.find((i) => !i.used);
  if (intel) {
    intel.used = true;
    const order = isResourceId(intel.item)
      ? genRawOrder(ctx, rng, intel.item)
      : genProductOrder(ctx, rng, intel.item);
    order.demandPort = intel.port;
    order.fromIntel = true;
    return order;
  }
  return rng.random() < 0.5 ? genRawOrder(ctx, rng) : genProductOrder(ctx, rng);
}

// Ported verbatim from PortMasters2/server.py gen_resource_card (lines 658-680).
export function genResourceCard(ctx: CardGenContext, rng: Rng): MarketCard {
  if (rng.random() < 0.3) {
    return genProductPurchaseCard(ctx, rng);
  }
  const num = rng.randint(1, 3);
  const resources: MarketResource[] = [];
  const unlockedRes = ctx.unlockedResources();
  const available = (Object.keys(RESOURCE_PROBS) as ResourceId[]).filter((r) =>
    unlockedRes.includes(r),
  );
  const probs = available.map((r) => RESOURCE_PROBS[r]);
  const port = rng.choice(ctx.unlockedPorts());
  for (let i = 0; i < num; i++) {
    if (available.length === 0) break;
    const chosen = rng.weightedChoice(available.map((r, idx) => [r, probs[idx]!] as const));
    const idx = available.indexOf(chosen);
    available.splice(idx, 1);
    probs.splice(idx, 1);
    const qty = rng.randint(1, 3);
    const [minP, maxP] = COMMODITIES[chosen].basePrice;
    const base = rng.randint(minP, maxP);
    let price = COMMODITIES[chosen].ports.includes(port) ? base - 1 : base + 1;
    price = envPurchasePrice(ctx, chosen, price);
    resources.push({ type: chosen, quantity: qty, price });
  }
  const totalCost = resources.reduce((sum, r) => sum + r.quantity * r.price, 0);
  return { port, resources, totalCost, isProductCard: false };
}

// Ported verbatim from PortMasters2/server.py gen_product_purchase_card (lines 682-705).
export function genProductPurchaseCard(ctx: CardGenContext, rng: Rng): MarketCard {
  const product = rng.choice(ctx.unlockedProducts());
  const qty = rng.randint(1, 2);
  const port = rng.choice(ctx.unlockedPorts());
  const recipe = RECIPES[product];
  let matCost = 0;
  const details: string[] = [];
  for (const [material, amount] of Object.entries(recipe.materials) as [ResourceId, number][]) {
    const [lo, hi] = COMMODITIES[material].basePrice;
    matCost += ((lo + hi) / 2) * amount;
    details.push(`${material}×${amount}`);
  }
  const markup = 1.4 + rng.random() * 0.4;
  let unitPrice = Math.trunc(matCost * markup);
  const [minPrice, maxPrice] = PRODUCT_PRICES[product];
  unitPrice = Math.max(minPrice, Math.min(unitPrice, maxPrice));
  unitPrice = envPurchasePrice(ctx, product, unitPrice);
  return {
    port,
    resources: [
      {
        type: product,
        quantity: qty,
        price: unitPrice,
        materialCost: matCost,
        materialDetails: details.join(' + '),
      },
    ],
    totalCost: unitPrice * qty,
    isProductCard: true,
  };
}
