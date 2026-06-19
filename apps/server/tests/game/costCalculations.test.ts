import type { ShipModule } from '@pm2/shared';
import { describe, expect, it } from 'vitest';
import {
  calcIncomeTax,
  calcTransportCost,
  calcVat,
  escortCost,
  getCardFinalCost,
  getCardResourceUnitPrices,
  getHireCost,
  hasModule,
} from '../../src/game/costCalculations.js';

function withModules(...ids: string[]): readonly ShipModule[] {
  return ids.map((id) => ({ id, name: id, icon: '', desc: '' }));
}

describe('hasModule', () => {
  it('checks equipped modules by id', () => {
    expect(hasModule({ equippedModules: withModules('bulk_hauler') }, 'bulk_hauler')).toBe(true);
    expect(hasModule({ equippedModules: withModules('bulk_hauler') }, 'overdrive_engine')).toBe(
      false,
    );
  });
});

// Expected values hand-derived from calc_transport_cost (server.py lines 515-529):
// base = totalItems * 2; discount = shipLevel * 5 (+ flat-discount flag); floored at 5/0.
describe('calcTransportCost', () => {
  it('is totalItems * 2 minus ship-level discount, floored at 5', () => {
    const ctx = { shipLevel: 0, modifierFlags: {}, equippedModules: [] };
    expect(calcTransportCost(ctx, 10)).toBe(20);
    expect(calcTransportCost(ctx, 2)).toBe(5); // 4 - 0 floored up to the 5 minimum
  });

  it('ship level discount lowers cost by 5 per level', () => {
    const ctx = { shipLevel: 2, modifierFlags: {}, equippedModules: [] };
    expect(calcTransportCost(ctx, 10)).toBe(10); // 20 - 10
  });

  it('bulk_hauler subtracts totalItems, overdrive_engine subtracts a flat 5', () => {
    const ctx = { shipLevel: 0, modifierFlags: {}, equippedModules: withModules('bulk_hauler') };
    expect(calcTransportCost(ctx, 10)).toBe(10); // 20 - 10 items
  });

  it('silk_monopoly zeroes transport cost when the cargo includes silk', () => {
    const ctx = { shipLevel: 0, modifierFlags: {}, equippedModules: withModules('silk_monopoly') };
    expect(calcTransportCost(ctx, 10, true)).toBe(0);
    expect(calcTransportCost(ctx, 10, false)).toBe(20);
  });
});

// Expected value hand-derived from calc_vat (server.py lines 531-544) for 麻衣
// (materials {麻布: 2}, weaver): matCost = avg(3,6)*2 = 9, workerCost = WAGES.weaver = 8.
// sellingPrice 50 -> taxable 33 -> vat = trunc(33 * 0.05) = 1.
describe('calcVat', () => {
  it('matches the hand-derived VAT for 麻衣 at sellingPrice 50', () => {
    const ctx = { equippedModules: [], modifierFlags: {} };
    expect(calcVat(ctx, '麻衣', 50)).toBe(1);
  });

  it('is 0 when the taxable amount is not positive', () => {
    const ctx = { equippedModules: [], modifierFlags: {} };
    expect(calcVat(ctx, '麻衣', 17)).toBe(0);
  });

  it('tax_evasion module halves VAT (truncated)', () => {
    const ctx = { equippedModules: withModules('tax_evasion'), modifierFlags: {} };
    // taxable = 200 - 17 = 183 -> vat = trunc(183*0.05) = 9 -> trunc(9*0.5) = 4
    expect(calcVat(ctx, '麻衣', 200)).toBe(4);
  });
});

// Expected values hand-derived from calc_income_tax (server.py lines 546-552): rate defaults
// to 0.1, smugglers_hold multiplies by 1.2, tax_evasion multiplies by 0.5, both truncated.
describe('calcIncomeTax', () => {
  it('is 0 for non-positive pre-tax income', () => {
    const ctx = { equippedModules: [], modifierFlags: {} };
    expect(calcIncomeTax(ctx, 0)).toBe(0);
    expect(calcIncomeTax(ctx, -50)).toBe(0);
  });

  it('defaults to a 10% rate, truncated', () => {
    const ctx = { equippedModules: [], modifierFlags: {} };
    expect(calcIncomeTax(ctx, 999)).toBe(99);
  });

  it('income_tax_override flag replaces the rate', () => {
    const ctx = { equippedModules: [], modifierFlags: { incomeTaxOverride: 0.05 } };
    expect(calcIncomeTax(ctx, 1000)).toBe(50);
  });

  it('smugglers_hold multiplies the tax by 1.2', () => {
    const ctx = { equippedModules: withModules('smugglers_hold'), modifierFlags: {} };
    expect(calcIncomeTax(ctx, 1000)).toBe(120); // trunc(1000*0.1) = 100 -> trunc(100*1.2) = 120
  });
});

// Expected values hand-derived from get_card_final_cost (server.py lines 557-575).
describe('getCardFinalCost', () => {
  it('applies purchase_discount, floored at 0', () => {
    const ctx = { equippedModules: [], modifierFlags: { purchaseDiscount: 0.15 } };
    const card = { port: '泉州港' as const, resources: [], totalCost: 100, isProductCard: false };
    expect(getCardFinalCost(ctx, card)).toBe(85);
  });

  it('smugglers_hold applies a further 15% discount (truncated)', () => {
    const ctx = { equippedModules: withModules('smugglers_hold'), modifierFlags: {} };
    const card = { port: '泉州港' as const, resources: [], totalCost: 100, isProductCard: false };
    expect(getCardFinalCost(ctx, card)).toBe(85);
  });

  it('hemp_monopoly and kiln_cellar knock a flat amount off only their matching resources', () => {
    const ctx = {
      equippedModules: withModules('kiln_cellar'),
      modifierFlags: { hempPriceReduction: 2 },
    };
    const card = {
      port: '泉州港' as const,
      resources: [
        { type: '麻布' as const, quantity: 3, price: 5 }, // -2/unit -> 6 off
        { type: '瓷土' as const, quantity: 2, price: 4 }, // -2/unit -> 4 off
        { type: '丝绸' as const, quantity: 1, price: 10 }, // untouched
      ],
      totalCost: 3 * 5 + 2 * 4 + 1 * 10,
      isProductCard: false,
    };
    expect(getCardFinalCost(ctx, card)).toBe(card.totalCost - 6 - 4);
  });
});

// The per-line prices a Procure card should display must reflect the same item-specific
// discounts getCardFinalCost charges, so the two can never tell the player different numbers.
describe('getCardResourceUnitPrices', () => {
  it('matches the unit price unchanged when no item-specific discount is active', () => {
    const ctx = { equippedModules: [], modifierFlags: {} };
    const card = {
      port: '泉州港' as const,
      resources: [{ type: '麻布' as const, quantity: 3, price: 5 }],
      totalCost: 15,
      isProductCard: false,
    };
    expect(getCardResourceUnitPrices(ctx, card)).toEqual([5]);
  });

  it('only discounts the resource line the boon/module targets', () => {
    const ctx = {
      equippedModules: withModules('kiln_cellar', 'foreign_quarter_pass'),
      modifierFlags: { hempPriceReduction: 2 },
    };
    const card = {
      port: '泉州港' as const,
      resources: [
        { type: '麻布' as const, quantity: 3, price: 5 },
        { type: '瓷土' as const, quantity: 2, price: 4 },
        { type: '香料' as const, quantity: 1, price: 10 },
        { type: '丝绸' as const, quantity: 1, price: 10 },
      ],
      totalCost: 0,
      isProductCard: false,
    };
    expect(getCardResourceUnitPrices(ctx, card)).toEqual([3, 2, 7, 10]);
  });

  it('does not distribute card-wide discounts (purchaseDiscount, smugglers_hold) onto a line', () => {
    const ctx = { equippedModules: withModules('smugglers_hold'), modifierFlags: { purchaseDiscount: 0.15 } };
    const card = {
      port: '泉州港' as const,
      resources: [{ type: '丝绸' as const, quantity: 1, price: 10 }],
      totalCost: 10,
      isProductCard: false,
    };
    expect(getCardResourceUnitPrices(ctx, card)).toEqual([10]);
  });

  it('floors at 0 if a flat reduction would exceed the unit price', () => {
    const ctx = { equippedModules: [], modifierFlags: { hempPriceReduction: 10 } };
    const card = {
      port: '泉州港' as const,
      resources: [{ type: '麻布' as const, quantity: 1, price: 3 }],
      totalCost: 3,
      isProductCard: false,
    };
    expect(getCardResourceUnitPrices(ctx, card)).toEqual([0]);
  });
});

// Expected values hand-derived from get_hire_cost (server.py lines 577-581): WAGES.weaver = 8.
describe('getHireCost', () => {
  it('returns the base wage with no modifiers', () => {
    expect(getHireCost({ modifierFlags: {} }, 'weaver')).toBe(8);
  });

  it('hire_discount flag halves the wage (truncated)', () => {
    expect(getHireCost({ modifierFlags: { hireDiscount: 0.5 } }, 'weaver')).toBe(4);
  });
});

// Expected values hand-derived from escort_cost (server.py lines 972-977):
// fee = max(ESCORT_COST_MIN=10, trunc(money * 0.10)).
describe('escortCost', () => {
  it('floors at ESCORT_COST_MIN for low balances', () => {
    expect(escortCost({ money: 50, modifierFlags: {} })).toBe(10);
  });

  it('is 10% of money once that exceeds the floor', () => {
    expect(escortCost({ money: 340, modifierFlags: {} })).toBe(34);
  });

  it('escort_discount flag reduces the fee (truncated)', () => {
    expect(escortCost({ money: 340, modifierFlags: { escortDiscount: 0.5 } })).toBe(17);
  });
});
