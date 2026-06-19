import {
  COMMODITIES,
  ESCORT_COST_MIN,
  ESCORT_COST_PCT,
  RECIPES,
  WAGES,
  type BoonModifiers,
  type ItemId,
  type MarketCard,
  type ModuleId,
  type OrderResource,
  type ProductId,
  type ResourceId,
  type ShipModule,
  type WorkerTypeId,
} from '@pm2/shared';

// Ported verbatim from PortMasters2/server.py has_module (line 554).
export function hasModule(
  ctx: { equippedModules: readonly ShipModule[] },
  moduleId: ModuleId,
): boolean {
  return ctx.equippedModules.some((m) => m.id === moduleId);
}

export interface TransportCostContext {
  shipLevel: number;
  modifierFlags: BoonModifiers;
  equippedModules: readonly ShipModule[];
}

// Ported verbatim from PortMasters2/server.py calc_transport_cost (lines 515-529).
export function calcTransportCost(
  ctx: TransportCostContext,
  totalItems: number,
  hasSilk = false,
  resources?: readonly OrderResource[],
): number {
  const base = totalItems * 2;
  let discount = ctx.shipLevel * 5;
  if (ctx.modifierFlags.transportFlatDiscount) {
    discount += ctx.modifierFlags.transportFlatDiscount;
  }
  let cost = Math.max(5, base - discount);
  if (hasSilk && ctx.modifierFlags.transportSilkDiscount) {
    cost = Math.max(5, Math.trunc(cost * ctx.modifierFlags.transportSilkDiscount));
  }
  if (hasModule(ctx, 'bulk_hauler')) cost = Math.max(0, cost - totalItems);
  if (hasModule(ctx, 'overdrive_engine')) cost = Math.max(0, cost - 5);
  if (hasModule(ctx, 'silk_monopoly') && hasSilk) cost = 0;
  if (hasModule(ctx, 'fleet_of_treasures') && resources) {
    const treasureQty = resources
      .filter((r) => r.type === '蕃香脂' || r.type === '珠链')
      .reduce((sum, r) => sum + r.required, 0);
    cost = Math.max(0, cost - 3 * treasureQty);
  }
  return Math.max(0, cost);
}

export interface VatContext {
  equippedModules: readonly ShipModule[];
  modifierFlags: BoonModifiers;
}

// Ported verbatim from PortMasters2/server.py calc_vat (lines 531-544).
export function calcVat(ctx: VatContext, product: ProductId, sellingPrice: number): number {
  const recipe = RECIPES[product];
  let matCost = 0;
  for (const [material, amount] of Object.entries(recipe.materials) as [ResourceId, number][]) {
    const [lo, hi] = COMMODITIES[material].basePrice;
    matCost += ((lo + hi) / 2) * amount;
  }
  const workerCost = WAGES[recipe.workerType];
  const taxable = sellingPrice - matCost - workerCost;
  if (taxable <= 0) return 0;
  let vat = Math.trunc(taxable * 0.05);
  if (hasModule(ctx, 'tax_evasion')) vat = Math.trunc(vat * 0.5);
  if (ctx.modifierFlags.vatDiscount) vat = Math.trunc(vat * (1 - ctx.modifierFlags.vatDiscount));
  return vat;
}

export interface IncomeTaxContext {
  equippedModules: readonly ShipModule[];
  modifierFlags: BoonModifiers;
}

// Ported verbatim from PortMasters2/server.py calc_income_tax (lines 546-552).
export function calcIncomeTax(ctx: IncomeTaxContext, preTax: number): number {
  if (preTax <= 0) return 0;
  const rate = ctx.modifierFlags.incomeTaxOverride ?? 0.1;
  let tax = Math.trunc(preTax * rate);
  if (hasModule(ctx, 'smugglers_hold')) tax = Math.trunc(tax * 1.2);
  if (hasModule(ctx, 'tax_evasion')) tax = Math.trunc(tax * 0.5);
  return tax;
}

export interface CardFinalCostContext {
  equippedModules: readonly ShipModule[];
  modifierFlags: BoonModifiers;
}

// The flat per-unit discount (boon or module) that targets one specific resource type inside a
// purchase card -- e.g. Hemp Monopoly or Kiln Cellar knock a fixed amount off specific goods,
// independent of the rest of the card. Shared by getCardFinalCost (the authoritative total a
// purchase charges) and getCardResourceUnitPrices (the per-line price a card should display) so
// the two can never disagree about which goods are discounted or by how much.
function flatItemDiscount(ctx: CardFinalCostContext, type: ItemId): number {
  let reduction = 0;
  if (ctx.modifierFlags.hempPriceReduction && type === '麻布') {
    reduction += ctx.modifierFlags.hempPriceReduction;
  }
  if (hasModule(ctx, 'kiln_cellar') && (type === '瓷土' || type === '铜矿')) {
    reduction += 2;
  }
  if (hasModule(ctx, 'foreign_quarter_pass') && (type === '香料' || type === '珍珠')) {
    reduction += 3;
  }
  return reduction;
}

// Ported verbatim from PortMasters2/server.py get_card_final_cost (lines 557-575).
export function getCardFinalCost(ctx: CardFinalCostContext, card: MarketCard): number {
  let cost = card.totalCost;
  if (ctx.modifierFlags.purchaseDiscount) {
    cost = Math.trunc(cost * (1 - ctx.modifierFlags.purchaseDiscount));
  }
  for (const r of card.resources) {
    cost -= r.quantity * flatItemDiscount(ctx, r.type);
  }
  if (hasModule(ctx, 'smugglers_hold')) {
    cost = Math.trunc(cost * 0.85);
  }
  return Math.max(0, cost);
}

// The per-unit price each resource line on a card actually costs once item-specific discounts
// apply, in the same order as card.resources. Card-wide discounts (Merchant's Charm, Smuggler's
// Hold) are not attributable to a single line -- they only show up in getCardFinalCost's total.
export function getCardResourceUnitPrices(ctx: CardFinalCostContext, card: MarketCard): number[] {
  return card.resources.map((r) => Math.max(0, r.price - flatItemDiscount(ctx, r.type)));
}

// Ported verbatim from PortMasters2/server.py get_hire_cost (lines 577-581).
export function getHireCost(
  ctx: { modifierFlags: BoonModifiers },
  workerType: WorkerTypeId,
): number {
  let wage = WAGES[workerType];
  if (ctx.modifierFlags.hireDiscount) {
    wage = Math.trunc(wage * 0.5);
  }
  return wage;
}

// Ported verbatim from PortMasters2/server.py escort_cost (lines 972-977).
export function escortCost(ctx: { money: number; modifierFlags: BoonModifiers }): number {
  let fee = Math.max(ESCORT_COST_MIN, Math.trunc(ctx.money * ESCORT_COST_PCT));
  if (ctx.modifierFlags.escortDiscount) {
    fee = Math.trunc(fee * (1 - ctx.modifierFlags.escortDiscount));
  }
  return fee;
}
