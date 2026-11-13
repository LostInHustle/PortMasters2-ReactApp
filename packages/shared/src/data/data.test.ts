import { describe, expect, it } from 'vitest';
import { BOONS, BOONS_TIER0, BOONS_TIER1, BOONS_TIER2, type Boon } from './boons.js';
import { COMMODITIES, PRODUCT_PRICES, RESOURCE_PROBS } from './commodities.js';
import { DIFFICULTIES, PIRATE_LOSS_TIERS } from './difficulties.js';
import { EMPEROR_MANDATE_TEMPLATES } from './emperor-mandates.js';
import { MODULES, MODULES_TIER0, MODULES_TIER1, MODULES_TIER2 } from './modules.js';
import { MONSOON_STATES, MONSOON_TIER0, MONSOON_TIER1, MONSOON_TIER2 } from './monsoon.js';
import { PORTS, PORTS_TIER0, PORTS_TIER1, PORTS_TIER2 } from './ports.js';
import { PRODUCTS, PRODUCTS_TIER0, PRODUCTS_TIER1, PRODUCTS_TIER2 } from './products.js';
import { RECIPES } from './recipes.js';
import { RESOURCES, RESOURCES_TIER0, RESOURCES_TIER1, RESOURCES_TIER2 } from './resources.js';
import {
  WAGES,
  WORKER_IDS_TIER0,
  WORKER_IDS_TIER1,
  WORKER_IDS_TIER2,
  WORKER_TYPES_BACKEND,
} from './wages-workers.js';

const ids = (items: readonly { id: string }[]) => items.map((item) => item.id);
const workerIds = [
  ...WORKER_IDS_TIER0,
  ...WORKER_IDS_TIER1,
  ...WORKER_IDS_TIER2,
] as readonly string[];

describe('shared game data', () => {
  it('covers every tiered table exactly once, with no content lost from any tier', () => {
    const tables = [
      {
        all: RESOURCES,
        tiers: [RESOURCES_TIER0, RESOURCES_TIER1, RESOURCES_TIER2],
        sizes: [3, 2, 2],
      },
      { all: PRODUCTS, tiers: [PRODUCTS_TIER0, PRODUCTS_TIER1, PRODUCTS_TIER2], sizes: [4, 2, 2] },
      { all: PORTS, tiers: [PORTS_TIER0, PORTS_TIER1, PORTS_TIER2], sizes: [5, 2, 2] },
      {
        all: workerIds,
        tiers: [WORKER_IDS_TIER0, WORKER_IDS_TIER1, WORKER_IDS_TIER2],
        sizes: [3, 2, 2],
      },
      {
        all: ids(BOONS),
        tiers: [ids(BOONS_TIER0), ids(BOONS_TIER1), ids(BOONS_TIER2)],
        sizes: [8, 3, 3],
      },
      {
        all: ids(MODULES),
        tiers: [ids(MODULES_TIER0), ids(MODULES_TIER1), ids(MODULES_TIER2)],
        sizes: [8, 3, 3],
      },
      {
        all: ids(MONSOON_STATES),
        tiers: [ids(MONSOON_TIER0), ids(MONSOON_TIER1), ids(MONSOON_TIER2)],
        sizes: [4, 2, 2],
      },
    ];

    for (const table of tables) {
      expect(table.tiers.map((tier) => tier.length)).toEqual(table.sizes);
      expect(new Set(table.all).size).toBe(table.all.length);
    }
  });

  it('keeps every recipe, price and wage pointed at known goods and workers', () => {
    expect(Object.keys(RECIPES).sort()).toEqual([...PRODUCTS].sort());
    expect(Object.keys(PRODUCT_PRICES).sort()).toEqual([...PRODUCTS].sort());
    expect(Object.keys(COMMODITIES).sort()).toEqual([...RESOURCES].sort());
    expect(Object.keys(RESOURCE_PROBS).sort()).toEqual([...RESOURCES].sort());
    expect(Object.keys(WAGES).sort()).toEqual([...workerIds].sort());

    for (const [product, recipe] of Object.entries(RECIPES)) {
      expect(PRODUCTS).toContain(product);
      expect(workerIds).toContain(recipe.workerType);
      expect(recipe.value).toBeGreaterThan(0);
      expect(Object.keys(recipe.materials).length).toBeGreaterThan(0);
      for (const [material, amount] of Object.entries(recipe.materials)) {
        expect(RESOURCES).toContain(material);
        expect(amount).toBeGreaterThan(0);
      }
    }

    for (const ranges of [
      Object.values(COMMODITIES).map((c) => c.basePrice),
      Object.values(PRODUCT_PRICES),
    ]) {
      for (const [low, high] of ranges) {
        expect(low).toBeGreaterThan(0);
        expect(high).toBeGreaterThanOrEqual(low);
      }
    }

    for (const commodity of Object.values(COMMODITIES)) {
      for (const port of commodity.ports) expect(PORTS).toContain(port);
    }
  });

  it('keeps boons, modules and monsoons displayable and internally consistent', () => {
    for (const boon of BOONS as readonly Boon[]) {
      expect(boon.name && boon.desc && boon.icon).toBeTruthy();
      expect(Object.keys(boon.modifiers).length).toBeGreaterThan(0);
      for (const value of Object.values(boon.modifiers)) {
        if (typeof value === 'number') expect(value).toBeGreaterThan(0);
      }
      if (boon.modifiers.productOrderBonus) {
        expect(boon.modifiers.productOrderBonus.pct).toBeGreaterThan(0);
        expect(boon.modifiers.productOrderBonus.pct).toBeLessThan(1);
        for (const product of boon.modifiers.productOrderBonus.products) {
          expect(PRODUCTS).toContain(product);
        }
      }
    }

    for (const module of MODULES) {
      expect(module.name && module.desc && module.icon).toBeTruthy();
    }

    for (const monsoon of MONSOON_STATES) {
      expect(monsoon.name && monsoon.desc && monsoon.icon).toBeTruthy();
      expect(RESOURCES).toContain(monsoon.resource);
      expect(monsoon.rewardMultiplier).toBeGreaterThan(0);
      expect(monsoon.purchaseMultiplier).toBeGreaterThan(0);
      expect(monsoon.pirateRisk).toBeGreaterThanOrEqual(0);
      expect(monsoon.pirateRisk).toBeLessThanOrEqual(1);
      for (const port of monsoon.rewardPorts) expect(PORTS).toContain(port);
    }
  });

  it('builds a valid difficulty ladder from the content and mandate tables', () => {
    const difficulties = ['easy', 'standard', 'hard'] as const;

    for (const difficulty of difficulties) {
      const config = DIFFICULTIES[difficulty];
      expect(config.rounds).toBeGreaterThan(0);
      expect(config.pirateLoss.length).toBeGreaterThan(0);
      for (const tier of config.pirateLoss) expect(PIRATE_LOSS_TIERS[tier]).toBeGreaterThan(0);
      for (const [tier, round] of Object.entries(config.tierUnlock)) {
        expect(Number(tier)).toBeGreaterThan(0);
        expect(round).toBeGreaterThan(0);
        expect(round).toBeLessThanOrEqual(config.rounds);
      }
      for (const [round, template] of Object.entries(config.mandates)) {
        expect(Number(round)).toBeGreaterThan(0);
        expect(Number(round)).toBeLessThanOrEqual(config.rounds);
        expect(EMPEROR_MANDATE_TEMPLATES[template]).toBeDefined();
      }
    }

    expect(DIFFICULTIES.easy.rounds).toBeLessThan(DIFFICULTIES.standard.rounds);
    expect(DIFFICULTIES.standard.rounds).toBeLessThan(DIFFICULTIES.hard.rounds);
  });

  it('keeps every worker type in one wage and roster table', () => {
    expect(ids(WORKER_TYPES_BACKEND)).toEqual([...workerIds]);
    for (const worker of WORKER_TYPES_BACKEND) {
      expect(WAGES[worker.id]).toBeGreaterThan(0);
      expect(worker.attr).toBeTruthy();
    }
  });
});
