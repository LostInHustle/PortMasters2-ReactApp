import {
  BOONS,
  DIFFICULTIES,
  EMPEROR_MANDATE_TEMPLATES,
  MODULES,
  MODULES_TIER0,
  MONSOON_STATES,
  PORTS_TIER0,
  type Boon,
  type CustomerOrder,
  type ItemId,
  type MarketCard,
  type ModuleId,
  type MonsoonState,
  type PortId,
  type ShipModule,
} from '@pm2/shared';
import { describe, expect, it } from 'vitest';
import { PlayerGame } from '../../src/game/PlayerGame.js';
import { phaseOptionCount } from '../../src/game/difficultyRules.js';
import { charterEvent } from '../../src/game/poolSelectors.js';
import { serializePlayerGame } from '../../src/game/serialize.js';
import type { Rng } from '../../src/game/randomUtil.js';
import { SharedSession } from '../../src/session/SharedSession.js';

// Effect matrix for every boon, ship module, Broker's Whisper path, monsoon, mandate and
// special rule, mirroring PortMasters2/tests/test_effects.py case for case. Every assertion
// checks real gold, real inventory or the exact figure the server stamps for display.

const MODULE_BY_ID = new Map<string, ShipModule>(MODULES.map((m) => [m.id, m]));
const BOON_BY_ID = new Map<string, Boon>(BOONS.map((b) => [b.id, b]));

const NEUTRAL_WEATHER: MonsoonState = {
  id: 'test_calm',
  name: 'calm',
  icon: '',
  desc: '',
  rewardPorts: [],
  rewardMultiplier: 1,
  resource: '麻布',
  purchaseMultiplier: 1,
  pirateRisk: 0,
};

class FixedRng implements Rng {
  private values: number[];
  constructor(values: number[] = []) {
    this.values = [...values];
  }
  random(): number {
    return this.values.length > 0 ? this.values.shift()! : 0.5;
  }
  randint(a: number, _b: number): number {
    return a;
  }
  choice<T>(arr: readonly T[]): T {
    return arr[0]!;
  }
  weightedChoice<T>(items: ReadonlyArray<readonly [T, number]>): T {
    return items[0]![0];
  }
  shuffle<T>(_arr: T[]): void {
    // keep the incoming order so a draft batch is predictable
  }
}

function newGame(difficulty: 'easy' | 'standard' | 'hard' = 'standard', money = 100): PlayerGame {
  const g = new PlayerGame(difficulty);
  g.money = money;
  g.setMonsoonState(NEUTRAL_WEATHER);
  return g;
}

function give(g: PlayerGame, items: Partial<Record<ItemId, number>>): void {
  Object.assign(g.inventory, items);
}

function equip(g: PlayerGame, id: string, shipLevel = 3): void {
  g.shipLevel = shipLevel;
  expect(g.equipModule(MODULE_BY_ID.get(id)!)).toBe(true);
}

function apply(g: PlayerGame, id: string): void {
  g.applyBoon(BOON_BY_ID.get(id)!);
}

function mkOrder(
  resources: ReadonlyArray<readonly [ItemId, number]>,
  reward: number,
  isProductOrder = false,
  id = 1,
  port: PortId = '泉州港',
): CustomerOrder & { id: number } {
  return {
    id,
    demandPort: port,
    resources: resources.map(([type, required]) => ({ type, required })),
    reward,
    totalItems: resources.reduce((sum, [, qty]) => sum + qty, 0),
    isProductOrder,
    fromIntel: false,
  };
}

function mkCard(
  resources: ReadonlyArray<readonly [ItemId, number, number]>,
  id = 1,
  port: PortId = '泉州港',
): MarketCard & { id: number } {
  const rows = resources.map(([type, quantity, price]) => ({ type, quantity, price }));
  return {
    id,
    port,
    resources: rows,
    totalCost: rows.reduce((sum, r) => sum + r.quantity * r.price, 0),
    isProductCard: false,
  };
}

describe('boon effects move real resources and prices', () => {
  it('silk wind halves silk and silk woven goods shipping', () => {
    const g = newGame();
    apply(g, 'silk_wind');
    give(g, { 丝绸: 10 });
    expect(g.completeOrder(mkOrder([['丝绸', 10]], 100))).toBe(true);
    expect(g.roundCosts).toBe(10);
    expect(g.money).toBe(190);

    const other = newGame();
    apply(other, 'silk_wind');
    give(other, { 茶叶: 10 });
    expect(other.completeOrder(mkOrder([['茶叶', 10]], 100))).toBe(true);
    expect(other.roundCosts).toBe(20);
  });

  it('favorable tides takes four off every order', () => {
    const g = newGame();
    apply(g, 'favorable_tides');
    give(g, { 茶叶: 10 });
    expect(g.completeOrder(mkOrder([['茶叶', 10]], 100))).toBe(true);
    expect(g.roundCosts).toBe(16);
    expect(g.money).toBe(184);
  });

  it('merchant charm charges 85 percent', () => {
    const g = newGame();
    apply(g, 'merchant_charm');
    const card = mkCard([['茶叶', 2, 30]]);
    expect(g.getCardFinalCost(card)).toBe(51);
    expect(g.purchaseCard(card)).toBe(true);
    expect(g.money).toBe(49);
    expect(g.roundCosts).toBe(51);
    expect(g.inventory['茶叶']).toBe(5);
  });

  it('emergency loan pays 40', () => {
    const g = newGame();
    apply(g, 'emergency_loan');
    expect(g.money).toBe(140);
  });

  it('tax shelter cuts the rate to five percent', () => {
    const g = newGame();
    apply(g, 'tax_shelter');
    expect(g.calcIncomeTax(1000)).toBe(50);
  });

  it('hemp monopoly discounts each bolt and shows it per line', () => {
    const g = newGame();
    apply(g, 'hemp_monopoly');
    const card = mkCard([['麻布', 3, 5]]);
    g.resourceCards = [card];
    const shown = serializePlayerGame(g).resourceCards[0]!;
    expect(shown.resources[0]!.effectivePrice).toBe(3);
    expect(shown.effectiveCost).toBe(9);
    expect(g.purchaseCard(card)).toBe(true);
    expect(g.money).toBe(91);
    expect(g.inventory['麻布']).toBe(11);
  });

  it('apprentice legacy halves artisan wages, not a one time hire fee', () => {
    const g = newGame();
    apply(g, 'master_apprentice');
    expect(g.hireWorker('weaver')).toBe(true);
    expect(g.estimatedWages()).toBe(4);
    expect(g.payWages()).toBe(true);
    expect(g.money).toBe(96);
    expect(g.workerWages).toBe(4);
    expect(g.roundCosts).toBe(4);
  });

  it('artisan inspiration adds one item per worker', () => {
    const g = newGame();
    apply(g, 'artisan_inspiration');
    g.hireWorker('weaver');
    expect(g.assignTask('weaver', '麻衣')).toBe(true);
    g.processProduction();
    expect(g.inventory['麻衣']).toBe(2);
    expect(g.inventory['麻布']).toBe(6);
  });

  it('farsight reveals a free clue when cards are dealt', () => {
    const sess = SharedSession.createPair('soloA', 'soloB', 'easy');
    const g = sess.games[0]!;
    g.phase = 5;
    apply(g, 'farsight');
    const money = g.money;
    sess.advance();
    expect(g.phase).toBe(1);
    expect(g.revealedIntel).toHaveLength(1);
    expect(g.money).toBe(money);
    expect(g.resourceCards).toHaveLength(5);
  });

  it('porcelain bronze guild boosts porcelain and bronze orders', () => {
    const g = newGame();
    apply(g, 'porcelain_bronze_guild');
    give(g, { 青瓷器: 1, 紫铜镜: 1 });
    expect(g.completeOrder(mkOrder([['青瓷器', 1]], 100, true))).toBe(true);
    expect(g.roundRevenue).toBe(112); // VAT 2, then 98 * 1.15
    expect(g.money).toBe(207);

    const other = newGame();
    apply(other, 'porcelain_bronze_guild');
    give(other, { 茶叶: 1 });
    expect(other.completeOrder(mkOrder([['茶叶', 1]], 100))).toBe(true);
    expect(other.roundRevenue).toBe(100);
  });

  it('frontier tariff relief halves product VAT', () => {
    const g = newGame();
    apply(g, 'frontier_tariff_relief');
    give(g, { 青瓷器: 2 });
    expect(g.completeOrder(mkOrder([['青瓷器', 2]], 200, true))).toBe(true);
    expect(g.vatPaid).toBe(2);
    expect(g.roundRevenue).toBe(198);
  });

  it('exotic treasures boosts silk perfume and pearls', () => {
    const g = newGame();
    apply(g, 'exotic_treasures');
    give(g, { 蕃香脂: 1 });
    expect(g.completeOrder(mkOrder([['蕃香脂', 1]], 100, true))).toBe(true);
    expect(g.roundRevenue).toBe(112);
  });

  it('deep sea escort pact halves fee and risk', () => {
    const g = newGame('standard', 340);
    apply(g, 'deep_sea_escort_pact');
    g.setMonsoonState({ ...NEUTRAL_WEATHER, pirateRisk: 0.4 });
    expect(g.escortCost()).toBe(17);
    expect(g.effectivePirateRisk()).toBeCloseTo(0.2);
    expect(g.hireEscort()).toBe(true);
    expect(g.money).toBe(323);
    expect(g.roundCosts).toBe(17);
    expect(g.effectivePirateRisk()).toBe(0);
  });

  it('merchants converge adds one trade order', () => {
    const sess = SharedSession.createPair('soloA', 'soloB', 'easy');
    const g = sess.games[0]!;
    g.phase = 'worker_mgmt';
    apply(g, 'merchants_converge');
    sess.advance();
    expect(g.phase).toBe(2);
    expect(g.customerCards).toHaveLength(6);

    const plain = SharedSession.createPair('soloC', 'soloD', 'easy');
    const p = plain.games[0]!;
    p.phase = 'worker_mgmt';
    plain.advance();
    expect(p.customerCards).toHaveLength(5);
  });

  it('boons replace each other and never alias the shared table', () => {
    const g = newGame();
    apply(g, 'silk_wind');
    apply(g, 'tax_shelter');
    expect(g.modifierFlags.transportSilkDiscount).toBeUndefined();
    expect(g.calcIncomeTax(1000)).toBe(50);

    const charm = BOON_BY_ID.get('merchant_charm')!;
    const original = { ...charm.modifiers };
    apply(g, 'merchant_charm');
    expect(g.modifierFlags).not.toBe(charm.modifiers);
    g.modifierFlags.purchaseDiscount = 0.99;
    expect(charm.modifiers).toEqual(original);
  });
});

describe('ship modules move real resources and prices', () => {
  it('smugglers hold cuts purchases and raises income tax', () => {
    const g = newGame();
    equip(g, 'smugglers_hold');
    const card = mkCard([['茶叶', 2, 50]]);
    expect(g.getCardFinalCost(card)).toBe(85);
    expect(g.purchaseCard(card)).toBe(true);
    expect(g.money).toBe(15);
    expect(g.calcIncomeTax(1000)).toBe(120);
  });

  it('bulk hauler and overdrive engine change shipping and upgrade cost', () => {
    const g = newGame();
    equip(g, 'bulk_hauler', 1);
    expect(g.shipUpgradePenalty).toBe(15);
    expect(g.calcTransportCost(10, false, [])).toBe(5);
    expect(g.calcTransportCost(3, false, [])).toBe(2);

    expect(g.equipModule(MODULE_BY_ID.get('overdrive_engine')!, 0)).toBe(true);
    expect(g.shipUpgradePenalty).toBe(0);
    expect(g.maintenancePenalty).toBe(10);
    expect(g.calcTransportCost(10, false, [])).toBe(10);
  });

  it('artisans workshop adds output and wage cost', () => {
    const g = newGame();
    equip(g, 'artisans_workshop');
    g.hireWorker('weaver');
    g.assignTask('weaver', '麻衣');
    g.processProduction();
    expect(g.inventory['麻衣']).toBe(2);
    expect(g.getHireCost('weaver')).toBe(9);
    expect(g.getHireCost('jeweler')).toBe(28);
    expect(g.payWages()).toBe(true);
    expect(g.money).toBe(91);
  });

  it('tax evasion halves both taxes and can fine', () => {
    const g = newGame();
    equip(g, 'tax_evasion');
    give(g, { 青瓷器: 2 });
    expect(g.calcVat('青瓷器', 100)).toBe(1);
    expect(g.calcIncomeTax(1000)).toBe(50);
    g.rng = new FixedRng([0.14]);
    expect(g.completeOrder(mkOrder([['青瓷器', 2]], 200, true))).toBe(true);
    expect(g.money).toBe(100 - 5 + 198 - 20);
  });

  it('tax evasion audit can miss', () => {
    const g = newGame();
    equip(g, 'tax_evasion');
    give(g, { 茶叶: 1 });
    g.rng = new FixedRng([0.15]);
    expect(g.completeOrder(mkOrder([['茶叶', 1]], 100))).toBe(true);
    expect(g.money).toBe(195);
  });

  it('silk monopoly ships silk free and boosts only silk products', () => {
    const g = newGame();
    equip(g, 'silk_monopoly');
    give(g, { 丝绸: 10 });
    expect(g.calcTransportCost(10, true, [])).toBe(0);
    expect(g.completeOrder(mkOrder([['丝绸', 10]], 100))).toBe(true);
    expect(g.roundCosts).toBe(0);
    expect(g.roundRevenue).toBe(100);

    const product = newGame();
    equip(product, 'silk_monopoly');
    give(product, { 绫罗绸缎: 1 });
    expect(product.completeOrder(mkOrder([['绫罗绸缎', 1]], 100, true))).toBe(true);
    expect(product.roundRevenue).toBe(116);

    const perfume = newGame();
    equip(perfume, 'silk_monopoly');
    give(perfume, { 蕃香脂: 1 });
    expect(perfume.completeOrder(mkOrder([['蕃香脂', 1]], 100, true))).toBe(true);
    expect(perfume.roundRevenue).toBe(117);
    expect(perfume.roundCosts).toBe(5);

    const porcelain = newGame();
    equip(porcelain, 'silk_monopoly');
    give(porcelain, { 青瓷器: 1 });
    expect(porcelain.completeOrder(mkOrder([['青瓷器', 1]], 100, true))).toBe(true);
    expect(porcelain.roundRevenue).toBe(98);
  });

  it('brokers network cuts whisper cost and doubles clues', () => {
    const g = newGame();
    equip(g, 'brokers_network');
    expect(g.intelCost).toBe(2);
    g.phase2DemandTags = ['麻布', '丝绸', '茶叶', '瓷土'];
    expect(g.purchaseIntel()).toBe(true);
    expect(g.money).toBe(98);
    expect(g.revealedIntel).toHaveLength(2);
    expect(g.phase2DemandTags).toHaveLength(2);

    expect(g.equipModule(MODULE_BY_ID.get('kiln_cellar')!, 0)).toBe(true);
    expect(g.intelCost).toBe(5);
  });

  it('salvage crane refunds shipping on a lucky roll', () => {
    const g = newGame();
    equip(g, 'salvage_crane');
    give(g, { 麻布: 2 });
    g.rng = new FixedRng([0.29]);
    expect(g.completeOrder(mkOrder([['麻布', 2]], 100))).toBe(true);
    expect(g.money).toBe(200);
    expect(g.roundCosts).toBe(5);
    expect(g.score).toBe(95);

    const unlucky = newGame();
    equip(unlucky, 'salvage_crane');
    give(unlucky, { 麻布: 2 });
    unlucky.rng = new FixedRng([0.3]);
    expect(unlucky.completeOrder(mkOrder([['麻布', 2]], 100))).toBe(true);
    expect(unlucky.money).toBe(195);
  });

  it('overdrive engine raises upkeep', () => {
    const g = newGame();
    equip(g, 'overdrive_engine');
    expect(g.maintenancePenalty).toBe(10);
    expect(g.payMaintenance()).toBe(true);
    expect(g.money).toBe(75);
    expect(g.maintenanceCosts).toBe(25);
    expect(g.roundCosts).toBe(25);
  });

  it('bureau token pays on new route goods in any position', () => {
    const product = newGame();
    equip(product, 'bureau_token');
    give(product, { 青瓷器: 1 });
    expect(product.completeOrder(mkOrder([['青瓷器', 1]], 100, true))).toBe(true);
    expect(product.roundRevenue).toBe(107);

    const raw = newGame();
    equip(raw, 'bureau_token');
    give(raw, { 瓷土: 2 });
    expect(raw.completeOrder(mkOrder([['瓷土', 2]], 100))).toBe(true);
    expect(raw.roundRevenue).toBe(110);

    const mixed = newGame();
    equip(mixed, 'bureau_token');
    give(mixed, { 茶叶: 1, 铜矿: 1 });
    expect(
      mixed.completeOrder(
        mkOrder(
          [
            ['茶叶', 1],
            ['铜矿', 1],
          ],
          100,
        ),
      ),
    ).toBe(true);
    expect(mixed.roundRevenue).toBe(110);

    const unrelated = newGame();
    equip(unrelated, 'bureau_token');
    give(unrelated, { 茶叶: 2 });
    expect(unrelated.completeOrder(mkOrder([['茶叶', 2]], 100))).toBe(true);
    expect(unrelated.roundRevenue).toBe(100);

    const tierTwo = newGame();
    equip(tierTwo, 'bureau_token');
    give(tierTwo, { 珠链: 1 });
    expect(tierTwo.completeOrder(mkOrder([['珠链', 1]], 100, true))).toBe(true);
    expect(tierTwo.roundRevenue).toBe(99);
  });

  it('kiln cellar discounts porcelain clay and copper ore only', () => {
    const g = newGame();
    equip(g, 'kiln_cellar');
    const card = mkCard([
      ['瓷土', 2, 4],
      ['铜矿', 1, 10],
      ['丝绸', 1, 8],
    ]);
    g.resourceCards = [card];
    const shown = serializePlayerGame(g).resourceCards[0]!;
    expect(shown.resources.map((r) => r.effectivePrice)).toEqual([2, 8, 8]);
    expect(shown.effectiveCost).toBe(20);
    expect(g.purchaseCard(card)).toBe(true);
    expect(g.money).toBe(80);
  });

  it('ocean relay adds a third clue', () => {
    const g = newGame();
    equip(g, 'ocean_relay');
    g.phase2DemandTags = ['麻布', '丝绸', '茶叶', '瓷土'];
    expect(g.purchaseIntel()).toBe(true);
    expect(g.revealedIntel).toHaveLength(2);
    expect(g.money).toBe(95);
  });

  it('foreign quarter pass discounts spices and pearls', () => {
    const g = newGame();
    equip(g, 'foreign_quarter_pass');
    const card = mkCard([
      ['香料', 1, 10],
      ['珍珠', 1, 20],
      ['麻布', 1, 5],
    ]);
    expect(g.getCardFinalCost(card)).toBe(29);
    g.resourceCards = [card];
    const shown = serializePlayerGame(g).resourceCards[0]!;
    expect(shown.resources.map((r) => r.effectivePrice)).toEqual([7, 17, 5]);
  });

  it('persian dome compass cuts risk thirty percent', () => {
    const g = newGame();
    equip(g, 'persian_dome_compass');
    g.setMonsoonState({ ...NEUTRAL_WEATHER, pirateRisk: 0.4 });
    expect(g.effectivePirateRisk()).toBeCloseTo(0.28);
  });

  it('fleet of treasures discounts each treasure item', () => {
    const g = newGame();
    equip(g, 'fleet_of_treasures', 1);
    const order = mkOrder(
      [
        ['蕃香脂', 2],
        ['珠链', 1],
        ['丝绸', 7],
      ],
      100,
    );
    expect(g.calcTransportCost(10, true, order.resources)).toBe(6);
  });

  it('module draft requires a slot, persists its batch and rerolls once', () => {
    const g = newGame();
    expect(g.startModuleDraft()).toBe(false);
    g.shipLevel = 1;
    expect(g.startModuleDraft()).toBe(true);
    const first = g.draftChoices.map((m) => m.id);
    expect(first).toHaveLength(3);
    expect(new Set(first).size).toBe(3);
    expect(first.every((id) => MODULES_TIER0.some((m) => m.id === id))).toBe(true);

    g.draftOpen = false;
    expect(g.startModuleDraft()).toBe(true);
    expect(g.draftChoices.map((m) => m.id)).toEqual(first);

    expect(g.rerollModuleDraft()).toBe(true);
    expect(g.rerollModuleDraft()).toBe(false);
    const chosen = g.draftChoices[0]!;
    expect(g.equipModule(chosen)).toBe(true);
    expect(g.draftOpen).toBe(false);
    expect(g.hasModule(chosen.id as ModuleId)).toBe(true);
  });
});

describe('combinations stack in the same order as the Python build', () => {
  it('purchase stack applies percent, flat, then smugglers', () => {
    const g = newGame();
    apply(g, 'merchant_charm');
    equip(g, 'kiln_cellar');
    equip(g, 'smugglers_hold');
    const card = mkCard([
      ['瓷土', 2, 8],
      ['铜矿', 1, 12],
    ]);
    expect(g.getCardFinalCost(card)).toBe(14);
    expect(g.purchaseCard(card)).toBe(true);
    expect(g.money).toBe(86);
    expect(g.roundCosts).toBe(14);
  });

  it('transport stack combines level, boons and modules', () => {
    const g = newGame();
    g.shipLevel = 1;
    apply(g, 'silk_wind');
    g.modifierFlags.transportFlatDiscount = 4;
    expect(g.calcTransportCost(10, true, [])).toBe(5);

    const bulk = newGame();
    bulk.shipLevel = 1;
    apply(bulk, 'silk_wind');
    bulk.modifierFlags.transportFlatDiscount = 4;
    equip(bulk, 'bulk_hauler', 1);
    expect(bulk.calcTransportCost(10, true, [])).toBe(0);

    const fleet = newGame();
    equip(fleet, 'fleet_of_treasures', 1);
    const order = mkOrder(
      [
        ['蕃香脂', 2],
        ['珠链', 1],
        ['丝绸', 7],
      ],
      100,
    );
    expect(fleet.calcTransportCost(10, true, order.resources)).toBe(6);

    const over = newGame();
    equip(over, 'overdrive_engine', 1);
    expect(over.calcTransportCost(10, true, order.resources)).toBe(10);
  });

  it('tax stack applies override, smugglers, then ledger', () => {
    const g = newGame();
    apply(g, 'tax_shelter');
    equip(g, 'smugglers_hold');
    equip(g, 'tax_evasion');
    expect(g.calcIncomeTax(1000)).toBe(30);
  });

  it('wage stack applies workshop then apprentice', () => {
    const g = newGame();
    equip(g, 'artisans_workshop');
    apply(g, 'master_apprentice');
    g.hireWorker('weaver');
    g.hireWorker('weaver');
    g.hireWorker('master');
    expect(g.getHireCost('weaver')).toBe(4);
    expect(g.getHireCost('master')).toBe(7);
    expect(g.estimatedWages()).toBe(15);
    expect(g.payWages()).toBe(true);
    expect(g.money).toBe(85);
  });

  it('production stack adds boon and workshop on top of skill', () => {
    const g = newGame();
    equip(g, 'artisans_workshop');
    apply(g, 'artisan_inspiration');
    g.hireWorker('weaver');
    g.assignTask('weaver', '麻衣');
    g.processProduction();
    expect(g.inventory['麻衣']).toBe(3);
    g.assignTask('weaver', '麻衣');
    g.processProduction();
    expect(g.inventory['麻衣']).toBe(7);
  });

  it('reward stack multiplies in order and truncates', () => {
    const g = newGame();
    equip(g, 'silk_monopoly');
    apply(g, 'exotic_treasures');
    give(g, { 蕃香脂: 1 });
    expect(g.completeOrder(mkOrder([['蕃香脂', 1]], 100, true))).toBe(true);
    expect(g.roundRevenue).toBe(134);
    expect(g.money).toBe(229);
  });

  it('silk monopoly does not stack on porcelain even with bureau token', () => {
    const g = newGame();
    equip(g, 'silk_monopoly');
    equip(g, 'bureau_token');
    give(g, { 青瓷器: 1 });
    expect(g.completeOrder(mkOrder([['青瓷器', 1]], 100, true))).toBe(true);
    expect(g.roundRevenue).toBe(107);
    expect(g.roundCosts).toBe(5);
  });

  it('intel stack charges two and reveals three', () => {
    const g = newGame();
    equip(g, 'brokers_network');
    equip(g, 'ocean_relay');
    g.phase2DemandTags = ['麻布', '丝绸', '茶叶', '瓷土', '铜矿'];
    expect(g.purchaseIntel()).toBe(true);
    expect(g.money).toBe(98);
    expect(g.revealedIntel).toHaveLength(3);
    expect(g.phase2DemandTags).toHaveLength(2);
  });

  it('risk stack applies pact then compass', () => {
    const g = newGame();
    apply(g, 'deep_sea_escort_pact');
    equip(g, 'persian_dome_compass');
    g.setMonsoonState({ ...NEUTRAL_WEATHER, pirateRisk: 0.5 });
    expect(g.effectivePirateRisk()).toBeCloseTo(0.175);
  });
});

describe("Broker's Whisper resolves into real trade orders", () => {
  it('a clue becomes an order with matching good and port', () => {
    const g = newGame();
    g.rng = new FixedRng();
    g.phase2DemandTags = ['麻布', '丝绸', '茶叶'];
    expect(g.purchaseIntel()).toBe(true);
    const clue = g.revealedIntel[0]!;
    expect(clue.item).toBe('麻布');
    expect(clue.port).toBe('泉州港');
    expect(g.money).toBe(95);

    const order = g.genMixedOrder();
    expect(order.fromIntel).toBe(true);
    expect(order.demandPort).toBe(clue.port);
    expect(order.resources[0]!.type).toBe(clue.item);
    expect(clue.used).toBe(true);

    expect(g.genMixedOrder().fromIntel).toBeUndefined();
  });

  it('whisper fails without tags or gold', () => {
    const g = newGame('standard', 3);
    g.phase2DemandTags = ['麻布'];
    expect(g.purchaseIntel()).toBe(false);
    expect(g.money).toBe(3);

    g.money = 100;
    g.phase2DemandTags = [];
    expect(g.purchaseIntel()).toBe(false);
    expect(g.money).toBe(100);
  });

  it('hard mode corruption stacks and easy mode never corrupts', () => {
    const hard = newGame('hard');
    hard.phase2DemandTags = ['麻布', '丝绸', '茶叶'];
    hard.rng = new FixedRng([0, 0]);
    expect(hard.purchaseIntel()).toBe(true);
    expect(hard.purchaseIntel()).toBe(true);
    expect(hard.brokerPirateRisk).toBeCloseTo(0.4);
    expect(hard.effectivePirateRisk()).toBeCloseTo(0.4);

    const easy = newGame('easy');
    easy.phase2DemandTags = ['麻布', '丝绸'];
    easy.rng = new FixedRng([0]);
    expect(easy.purchaseIntel()).toBe(true);
    expect(easy.brokerPirateRisk).toBe(0);
  });
});

describe('monsoons, mandates and special schedules', () => {
  it('every monsoon moves its price, reward and raid chance', () => {
    expect(MONSOON_STATES).toHaveLength(8);
    const g = newGame();
    for (const state of MONSOON_STATES) {
      g.setMonsoonState(state);
      const rewardPorts = state.rewardPorts as readonly PortId[];
      const port = rewardPorts[0]!;
      expect(g.envReward(port, 100)).toBe(Math.round(100 * state.rewardMultiplier));
      const neutralPort = PORTS_TIER0.find((p) => !rewardPorts.includes(p))!;
      expect(g.envReward(neutralPort, 100)).toBe(100);
      expect(g.envPurchasePrice(state.resource, 100)).toBe(
        Math.round(100 * state.purchaseMultiplier),
      );
      const otherItem: ItemId = state.resource === '珍珠' ? '麻布' : '珍珠';
      expect(g.envPurchasePrice(otherItem, 100)).toBe(100);
      expect(g.pirateThreat()).toBeCloseTo(state.pirateRisk);
    }
  });

  it('a pirate raid takes its tier share and escort prevents it', () => {
    const g = newGame('easy', 100);
    g.setMonsoonState({ ...NEUTRAL_WEATHER, pirateRisk: 0.5 });
    g.rng = new FixedRng([0]);
    expect(g.payMaintenance()).toBe(true);
    expect(g.money).toBe(100 - 15 - 15);
    expect(g.roundCosts).toBe(30);

    const safe = newGame('easy', 100);
    safe.setMonsoonState({ ...NEUTRAL_WEATHER, pirateRisk: 0.5 });
    expect(safe.hireEscort()).toBe(true);
    safe.rng = new FixedRng([0]);
    expect(safe.payMaintenance()).toBe(true);
    expect(safe.money).toBe(100 - 10 - 15);
  });

  it('every emperor mandate is generated on its scheduled round', () => {
    for (const difficulty of Object.keys(DIFFICULTIES) as Array<keyof typeof DIFFICULTIES>) {
      const cfg = DIFFICULTIES[difficulty];
      for (const [roundStr, size] of Object.entries(cfg.mandates)) {
        const roundNo = Number(roundStr);
        const g = newGame(difficulty);
        g.currentRound = roundNo;
        const order = g.genEmperorMandateOrder(size);
        const tpl = EMPEROR_MANDATE_TEMPLATES[size]!;
        expect(order.kind).toBe('EmperorMandate');
        expect(order.demandPort).toBe(tpl.port);
        expect(order.resources).toEqual(tpl.resources.map((r) => ({ ...r })));
        expect(order.reward).toBe(tpl.reward);
        const lastRound = Math.max(...Object.keys(cfg.mandates).map(Number));
        expect(order.isFinalMandate).toBe(roundNo === lastRound);
      }
    }
  });

  it('the trade phase deals the mandate alongside normal orders', () => {
    const sess = SharedSession.createPair('soloA', 'soloB', 'easy');
    const g = sess.games[0]!;
    g.currentRound = 3;
    g.phase = 'worker_mgmt';
    sess.advance();
    expect(g.customerCards[0]!.kind).toBe('EmperorMandate');
    expect(g.customerCards[0]!.isFinalMandate).toBe(false);
    expect(g.customerCards).toHaveLength(5);
  });

  it('charter announces only the round its tier opens', () => {
    expect(charterEvent(4, DIFFICULTIES.standard.tierUnlock)?.id).toBe('tier1');
    expect(charterEvent(8, DIFFICULTIES.standard.tierUnlock)?.id).toBe('tier2');
    expect(charterEvent(5, DIFFICULTIES.standard.tierUnlock)).toBeUndefined();
    expect(charterEvent(4, DIFFICULTIES.easy.tierUnlock)).toBeUndefined();
  });

  it('phase option count widens with each tier', () => {
    expect(phaseOptionCount(1, DIFFICULTIES.easy.tierUnlock)).toBe(5);
    expect(phaseOptionCount(4, DIFFICULTIES.standard.tierUnlock)).toBe(8);
    expect(phaseOptionCount(8, DIFFICULTIES.standard.tierUnlock)).toBe(11);
  });
});

describe('display figures equal the gold actually charged', () => {
  it('printed purchase price is the gold taken', () => {
    const g = newGame();
    apply(g, 'merchant_charm');
    equip(g, 'kiln_cellar');
    equip(g, 'smugglers_hold');
    const card = mkCard([
      ['瓷土', 2, 8],
      ['铜矿', 1, 12],
    ]);
    g.resourceCards = [card];
    const shown = serializePlayerGame(g).resourceCards[0]!;
    const before = g.money;
    expect(g.purchaseCard(card)).toBe(true);
    expect(before - g.money).toBe(shown.effectiveCost);
    expect(shown.effectiveCost).toBe(14);
    expect(shown.resources.map((r) => r.effectivePrice! * r.quantity)).toEqual([12, 10]);
  });

  it('printed shipping is the gold taken', () => {
    const g = newGame();
    g.shipLevel = 1;
    apply(g, 'favorable_tides');
    equip(g, 'bulk_hauler', 1);
    give(g, { 茶叶: 10 });
    const order = mkOrder([['茶叶', 10]], 77);
    g.customerCards = [order];
    const shown = serializePlayerGame(g).customerCards[0]!;
    expect(shown.transportCost).toBe(1);
    const before = g.money;
    expect(g.completeOrder(shown as CustomerOrder & { id: number })).toBe(true);
    expect(g.money - before).toBe(77 - shown.transportCost!);
    expect(g.roundCosts).toBe(1);
  });

  it('printed wages are the gold taken', () => {
    const g = newGame();
    equip(g, 'artisans_workshop');
    apply(g, 'master_apprentice');
    g.hireWorker('weaver');
    g.hireWorker('master');
    const preview = serializePlayerGame(g).estimatedWages;
    const before = g.money;
    expect(g.payWages()).toBe(true);
    expect(before - g.money).toBe(preview);
    expect(preview).toBe(11);
  });

  it('printed escort fee is the gold taken', () => {
    const g = newGame('standard', 340);
    apply(g, 'deep_sea_escort_pact');
    const preview = serializePlayerGame(g).escortCost;
    const before = g.money;
    expect(g.hireEscort()).toBe(true);
    expect(before - g.money).toBe(preview);
    expect(preview).toBe(17);
  });

  it('printed upgrade price includes every module penalty', () => {
    const g = newGame('standard', 500);
    equip(g, 'bulk_hauler', 1);
    let data = serializePlayerGame(g);
    expect(data.shipUpgradePenalty).toBe(15);
    expect(data.shipUpgradeCost[g.shipLevel]! + data.shipUpgradePenalty).toBe(40);
    expect(g.equipModule(MODULE_BY_ID.get('overdrive_engine')!, 0)).toBe(true);
    data = serializePlayerGame(g);
    expect(data.shipUpgradePenalty).toBe(0);
    expect(data.shipUpgradeCost[g.shipLevel]! + data.shipUpgradePenalty).toBe(25);
  });
});

describe('barter and round settlement shared rules', () => {
  it('barter moves both sides resources and gold', () => {
    const sess = SharedSession.createPair('a', 'b');
    const [a, b] = [sess.games[0]!, sess.games[1]!];
    const order = sess.createTradeOrder(
      0,
      [{ type: '麻布', quantity: 2 }],
      [{ type: '金币', quantity: 10 }],
    )!;
    expect(sess.acceptTrade(order.id, 1)).toBe(true);
    expect(a.money).toBe(110);
    expect(a.inventory['麻布']).toBe(6);
    expect(b.money).toBe(90);
    expect(b.inventory['麻布']).toBe(10);
    expect(sess.tradeOrders).toHaveLength(0);
  });

  it('barter merges duplicate entries and rejects the overflow', () => {
    const sess = SharedSession.createPair('a', 'b');
    const [a] = [sess.games[0]!];
    a.inventory['麻布'] = 5;
    const order = sess.createTradeOrder(
      0,
      [
        { type: '麻布', quantity: 5 },
        { type: '麻布', quantity: 5 },
      ],
      [{ type: '金币', quantity: 10 }],
    )!;
    expect(order.sell).toHaveLength(1);
    expect(order.sell[0]!.quantity).toBe(10);
    expect(sess.acceptTrade(order.id, 1)).toBe(false);
    expect(a.inventory['麻布']).toBe(5);
  });

  it('income tax base counts each round cost once', () => {
    const g = newGame('standard', 100);
    g.roundRevenue = 1000;
    g.roundCosts = 400;
    g.workerWages = 50;
    g.maintenanceCosts = 100;
    g.endRound();
    expect(g.incomeTaxPaid).toBe(60);
    expect(g.money).toBe(40);
    expect(g.lastRoundSummary?.incomeTax).toBe(60);
  });

  it('income tax is zero on a losing round', () => {
    const g = newGame('standard', 100);
    g.roundRevenue = 100;
    g.roundCosts = 200;
    g.endRound();
    expect(g.incomeTaxPaid).toBe(0);
    expect(g.money).toBe(100);
  });

  it('score counts net reward after VAT and shipping', () => {
    const g = newGame();
    give(g, { 青瓷器: 2 });
    expect(g.completeOrder(mkOrder([['青瓷器', 2]], 200, true))).toBe(true);
    expect(g.vatPaid).toBe(4);
    expect(g.roundRevenue).toBe(196);
    expect(g.roundCosts).toBe(5);
    expect(g.score).toBe(191);
  });
});
