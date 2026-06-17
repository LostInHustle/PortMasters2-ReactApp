import { describe, expect, it } from 'vitest';
import { RESOURCES, RESOURCES_TIER0, RESOURCES_TIER1, RESOURCES_TIER2 } from './resources.js';
import { PRODUCTS, PRODUCTS_TIER0, PRODUCTS_TIER1, PRODUCTS_TIER2 } from './products.js';
import { PORTS_TIER0, PORTS_TIER1, PORTS_TIER2 } from './ports.js';
import { WAGES, WORKER_IDS_TIER0, WORKER_IDS_TIER1, WORKER_IDS_TIER2 } from './wages-workers.js';
import { RECIPES } from './recipes.js';
import { COMMODITIES, PRODUCT_PRICES, RESOURCE_PROBS } from './commodities.js';
import { BOONS_TIER0, BOONS_TIER1, BOONS_TIER2 } from './boons.js';
import { MODULES_TIER0, MODULES_TIER1, MODULES_TIER2 } from './modules.js';
import { MONSOON_TIER0, MONSOON_TIER1, MONSOON_TIER2 } from './monsoon.js';
import {
  BROKER_CORRUPTION_CHANCE,
  BROKER_CORRUPTION_RISK,
  DIFFICULTIES,
  ESCORT_COST_MIN,
  ESCORT_COST_PCT,
  PHASE_OPTIONS_BASE,
  PHASE_OPTIONS_PER_TIER,
  PIRATE_LOSS_TIERS,
} from './difficulties.js';

// Spot-checks every value here against PortMasters2/server.py, the source of truth for this
// fidelity port (see plan Phase 1 exit criterion).

const ids = (arr: readonly { id: string }[]) => arr.map((x) => x.id);

describe('tiered content ids match server.py exactly', () => {
  it('resources / products / ports', () => {
    expect(RESOURCES_TIER0).toEqual(['麻布', '丝绸', '茶叶']);
    expect(RESOURCES_TIER1).toEqual(['瓷土', '铜矿']);
    expect(RESOURCES_TIER2).toEqual(['香料', '珍珠']);
    expect(PRODUCTS_TIER0).toEqual(['麻衣', '布衣', '绫罗绸缎', '香囊']);
    expect(PRODUCTS_TIER1).toEqual(['紫铜镜', '青瓷器']);
    expect(PRODUCTS_TIER2).toEqual(['蕃香脂', '珠链']);
    expect(PORTS_TIER0).toEqual(['泉州港', '广州港', '宁波港', '扬州港', '杭州港']);
    expect(PORTS_TIER1).toEqual(['福州港', '高丽港']);
    expect(PORTS_TIER2).toEqual(['三佛齐港', '大食港']);
  });

  it('worker ids', () => {
    expect(WORKER_IDS_TIER0).toEqual(['weaver', 'master', 'sachet_maker']);
    expect(WORKER_IDS_TIER1).toEqual(['coppersmith', 'potter']);
    expect(WORKER_IDS_TIER2).toEqual(['perfumer', 'jeweler']);
  });

  it('boon ids', () => {
    expect(ids(BOONS_TIER0)).toEqual([
      'silk_wind',
      'favorable_tides',
      'merchant_charm',
      'artisan_inspiration',
      'emergency_loan',
      'tax_shelter',
      'hemp_monopoly',
      'master_apprentice',
    ]);
    expect(ids(BOONS_TIER1)).toEqual([
      'farsight',
      'porcelain_bronze_guild',
      'frontier_tariff_relief',
    ]);
    expect(ids(BOONS_TIER2)).toEqual([
      'exotic_treasures',
      'deep_sea_escort_pact',
      'merchants_converge',
    ]);
  });

  it('module ids', () => {
    expect(ids(MODULES_TIER0)).toEqual([
      'smugglers_hold',
      'bulk_hauler',
      'artisans_workshop',
      'tax_evasion',
      'silk_monopoly',
      'brokers_network',
      'salvage_crane',
      'overdrive_engine',
    ]);
    expect(ids(MODULES_TIER1)).toEqual(['bureau_token', 'kiln_cellar', 'ocean_relay']);
    expect(ids(MODULES_TIER2)).toEqual([
      'foreign_quarter_pass',
      'persian_dome_compass',
      'fleet_of_treasures',
    ]);
  });

  it('monsoon ids', () => {
    expect(ids(MONSOON_TIER0)).toEqual([
      'spring_current',
      'summer_monsoon',
      'autumn_gales',
      'winter_blockade',
    ]);
    expect(ids(MONSOON_TIER1)).toEqual(['fujian_kiln_smoke', 'goryeo_dawn_route']);
    expect(ids(MONSOON_TIER2)).toEqual(['srivijaya_spice_breeze', 'dashi_pearl_moon']);
  });
});

describe('numeric tuning constants match server.py exactly', () => {
  it('wages', () => {
    expect(WAGES).toEqual({
      weaver: 8,
      master: 12,
      sachet_maker: 20,
      coppersmith: 12,
      potter: 14,
      perfumer: 18,
      jeweler: 24,
    });
  });

  it('resource probabilities', () => {
    expect(RESOURCE_PROBS).toEqual({
      麻布: 0.3,
      丝绸: 0.26,
      茶叶: 0.18,
      瓷土: 0.14,
      铜矿: 0.12,
      香料: 0.08,
      珍珠: 0.06,
    });
  });

  it('escort and broker-corruption tuning', () => {
    expect(ESCORT_COST_MIN).toBe(10);
    expect(ESCORT_COST_PCT).toBe(0.1);
    expect(BROKER_CORRUPTION_CHANCE).toBe(0.3);
    expect(BROKER_CORRUPTION_RISK).toBe(0.2);
  });

  it('phase option count base/per-tier', () => {
    expect(PHASE_OPTIONS_BASE).toBe(5);
    expect(PHASE_OPTIONS_PER_TIER).toBe(3);
  });

  it('pirate loss tiers', () => {
    expect(PIRATE_LOSS_TIERS).toEqual({ medium: 0.15, above_medium: 0.25, high: 0.4 });
  });

  it('difficulty ladder', () => {
    expect(DIFFICULTIES.easy).toEqual({
      rounds: 8,
      tierUnlock: {},
      brokerCorruption: false,
      pirateLoss: ['medium'],
      mandates: { 3: 0, 6: 1, 8: 2 },
    });
    expect(DIFFICULTIES.standard).toEqual({
      rounds: 12,
      tierUnlock: { 1: 4, 2: 8 },
      brokerCorruption: false,
      pirateLoss: ['medium', 'above_medium'],
      mandates: { 3: 0, 7: 1, 12: 2 },
    });
    expect(DIFFICULTIES.hard).toEqual({
      rounds: 16,
      tierUnlock: { 1: 6, 2: 10 },
      brokerCorruption: true,
      pirateLoss: ['above_medium', 'high'],
      mandates: { 6: 0, 12: 1, 16: 2 },
    });
  });
});

describe('recipes and commodities match server.py exactly', () => {
  it('recipes', () => {
    expect(RECIPES.麻衣).toEqual({ materials: { 麻布: 2 }, value: 15, workerType: 'weaver' });
    expect(RECIPES.布衣).toEqual({
      materials: { 麻布: 2, 丝绸: 1 },
      value: 35,
      workerType: 'weaver',
    });
    expect(RECIPES.珠链).toEqual({
      materials: { 珍珠: 2, 丝绸: 1 },
      value: 105,
      workerType: 'jeweler',
    });
  });

  it('commodities base price ranges', () => {
    expect(COMMODITIES.麻布.basePrice).toEqual([3, 6]);
    expect(COMMODITIES.珍珠.basePrice).toEqual([16, 24]);
  });

  it('product price ranges', () => {
    expect(PRODUCT_PRICES.麻衣).toEqual([30, 42]);
    expect(PRODUCT_PRICES.珠链).toEqual([125, 160]);
  });

  it('every resource and product appears exactly once across tiers', () => {
    expect(RESOURCES).toHaveLength(7);
    expect(new Set(RESOURCES).size).toBe(7);
    expect(PRODUCTS).toHaveLength(8);
    expect(new Set(PRODUCTS).size).toBe(8);
  });
});
