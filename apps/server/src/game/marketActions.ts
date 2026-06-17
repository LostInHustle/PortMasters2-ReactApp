import {
  PRODUCTS_TIER1,
  PRODUCTS_TIER2,
  type BoonModifiers,
  type CustomerOrder,
  type ItemId,
  type MarketCard,
  type ProductId,
  type ShipModule,
} from '@pm2/shared';
import { calcTransportCost, calcVat, getCardFinalCost, hasModule } from './costCalculations.js';
import type { Rng } from './randomUtil.js';

const HIGHER_TIER_PRODUCTS: readonly ItemId[] = [...PRODUCTS_TIER1, ...PRODUCTS_TIER2];
const SILK_FAMILY: readonly ItemId[] = ['丝绸', '绫罗绸缎', '香囊', '布衣'];

export interface PurchaseCardContext {
  modifierFlags: BoonModifiers;
  equippedModules: readonly ShipModule[];
  money: number;
  roundCosts: number;
  totalCosts: number;
  inventory: Record<ItemId, number>;
  purchasedCards: Set<number>;
  purchaseCount: number;
  log(message: string): void;
}

// Ported verbatim from PortMasters2/server.py purchase_card (lines 714-727).
export function purchaseCard(ctx: PurchaseCardContext, card: MarketCard & { id: number }): boolean {
  const cost = getCardFinalCost(ctx, card);
  if (ctx.money < cost) {
    ctx.log(`❌ 资金不足！需要${cost}金币`);
    return false;
  }
  ctx.money -= cost;
  ctx.roundCosts += cost;
  ctx.totalCosts += cost;
  for (const r of card.resources) {
    ctx.inventory[r.type] += r.quantity;
  }
  ctx.purchasedCards.add(card.id);
  ctx.purchaseCount += 1;
  ctx.log(`🛒 采购完成，花费${cost}金币`);
  return true;
}

export interface CompleteOrderContext {
  inventory: Record<ItemId, number>;
  shipLevel: number;
  modifierFlags: BoonModifiers;
  equippedModules: readonly ShipModule[];
  money: number;
  roundCosts: number;
  totalCosts: number;
  vatPaid: number;
  roundRevenue: number;
  totalRevenue: number;
  score: number;
  completedOrders: Set<number>;
  orderCount: number;
  log(message: string): void;
}

// Ported verbatim from PortMasters2/server.py complete_order (lines 729-769).
export function completeOrder(
  ctx: CompleteOrderContext,
  order: CustomerOrder & { id: number },
  rng: Rng,
): boolean {
  for (const r of order.resources) {
    if (ctx.inventory[r.type] < r.required) {
      ctx.log(`❌ 库存不足：${r.type}×${r.required}`);
      return false;
    }
  }
  const hasSilk = order.resources.some((r) => SILK_FAMILY.includes(r.type));
  const transport = calcTransportCost(ctx, order.totalItems, hasSilk, order.resources);
  for (const r of order.resources) {
    ctx.inventory[r.type] -= r.required;
  }
  let reward = order.reward;
  const first = order.resources[0]!;
  if (order.isProductOrder) {
    const unitVat = calcVat(ctx, first.type as ProductId, Math.floor(reward / first.required));
    const totalVat = unitVat * first.required;
    reward -= totalVat;
    ctx.vatPaid += totalVat;
  }
  ctx.money -= transport;
  ctx.roundCosts += transport;
  ctx.totalCosts += transport;
  if (hasModule(ctx, 'silk_monopoly') && hasSilk) {
    reward = Math.trunc(reward * 1.2);
  }
  const bonus = ctx.modifierFlags.productOrderBonus;
  if (bonus && (bonus.products as readonly ItemId[]).includes(first.type)) {
    reward = Math.trunc(reward * (1 + bonus.pct));
  }
  if (hasModule(ctx, 'bureau_token') && HIGHER_TIER_PRODUCTS.includes(first.type)) {
    reward = Math.trunc(reward * 1.1);
  }
  if (hasModule(ctx, 'salvage_crane') && rng.random() < 0.3) {
    ctx.money += transport;
    ctx.log(`♻️ 打捞起重机退还${transport}金币`);
  }
  if (hasModule(ctx, 'tax_evasion') && rng.random() < 0.15) {
    ctx.money -= 20;
    ctx.log('🚨 避税账本触发，罚款20金币！');
  }
  ctx.money += reward;
  ctx.roundRevenue += reward;
  ctx.totalRevenue += reward;
  ctx.score += Math.max(0, reward - transport);
  ctx.completedOrders.add(order.id);
  ctx.orderCount += 1;
  ctx.log(`📦 订单完成，净利润${reward - transport}金币`);
  return true;
}
