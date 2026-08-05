import { WORKER_TYPES_BACKEND, type ShipModule, type Worker, type WorkerTypeId } from '@pm2/shared';
import { describe, expect, it } from 'vitest';
import { calcTotalWages, payWages } from '../../src/game/production.js';

function emptyRoster(): Record<WorkerTypeId, Worker[]> {
  return Object.fromEntries(
    WORKER_TYPES_BACKEND.map((w): [WorkerTypeId, Worker[]] => [w.id, []]),
  ) as Record<WorkerTypeId, Worker[]>;
}

function worker(): Worker {
  return { task: null, progress: 0, producedCount: 0, isSkilled: false };
}

function withModules(...ids: string[]): readonly ShipModule[] {
  return ids.map((id) => ({ id, name: id, icon: '', desc: '' }));
}

// Expected values hand-derived from pay_wages (server.py lines 937-956): every worker type
// counts (not just weaver/master/sachet_maker), each at WAGES[type] per head.
describe('calcTotalWages', () => {
  it('is 0 with no hired workers', () => {
    expect(calcTotalWages({ workers: emptyRoster(), equippedModules: [], modifierFlags: {} })).toBe(
      0,
    );
  });

  it('sums every worker type, not just weaver/master/sachet_maker', () => {
    const workers = emptyRoster();
    workers.weaver = [worker()]; // 8
    workers.master = [worker()]; // 12
    workers.sachet_maker = [worker()]; // 20
    workers.coppersmith = [worker(), worker()]; // 12 * 2 = 24
    workers.potter = [worker()]; // 14
    workers.perfumer = [worker()]; // 18
    workers.jeweler = [worker()]; // 24
    expect(calcTotalWages({ workers, equippedModules: [], modifierFlags: {} })).toBe(
      8 + 12 + 20 + 24 + 14 + 18 + 24,
    );
  });

  it('applies artisans_workshop wage markup (+20%, truncated) to every worker', () => {
    const workers = emptyRoster();
    workers.jeweler = [worker()]; // 24 -> trunc(24*1.2) = 28
    workers.weaver = [worker()]; // 8 -> trunc(8*1.2) = 9
    const ctx = { workers, equippedModules: withModules('artisans_workshop'), modifierFlags: {} };
    expect(calcTotalWages(ctx)).toBe(28 + 9);
  });

  // Regression: the Apprentice Legacy boon (hireDiscount) advertises halved wages for the round
  // and the artisan table renders them halved, but the charge used to ignore the flag entirely,
  // so players were billed full price for a boon they had spent their Fortune pick on.
  it('applies the Apprentice Legacy hireDiscount to the round wage bill', () => {
    const workers = emptyRoster();
    workers.jeweler = [worker()]; // 24 -> trunc(24*0.5) = 12
    workers.weaver = [worker()]; // 8 -> trunc(8*0.5) = 4
    const ctx = { workers, equippedModules: [], modifierFlags: { hireDiscount: 0.5 } };
    expect(calcTotalWages(ctx)).toBe(12 + 4);
  });

  it('stacks the workshop markup and the hireDiscount in that order', () => {
    const workers = emptyRoster();
    workers.jeweler = [worker()]; // 24 -> trunc(24*1.2) = 28 -> trunc(28*0.5) = 14
    const ctx = {
      workers,
      equippedModules: withModules('artisans_workshop'),
      modifierFlags: { hireDiscount: 0.5 },
    };
    expect(calcTotalWages(ctx)).toBe(14);
  });
});

describe('payWages', () => {
  it('charges exactly calcTotalWages and records it on workerWages/roundCosts', () => {
    const workers = emptyRoster();
    workers.jeweler = [worker(), worker()]; // 24 * 2 = 48
    const ctx = {
      workers,
      equippedModules: [],
      modifierFlags: {},
      money: 100,
      workerWages: 0,
      roundCosts: 0,
      log: () => {},
    };
    expect(payWages(ctx)).toBe(true);
    expect(ctx.money).toBe(52);
    expect(ctx.workerWages).toBe(48);
    expect(ctx.roundCosts).toBe(48);
  });

  it('fails and leaves money untouched when the roster cannot be paid', () => {
    const workers = emptyRoster();
    workers.jeweler = [worker()]; // 24
    const logs: string[] = [];
    const ctx = {
      workers,
      equippedModules: [],
      modifierFlags: {},
      money: 10,
      workerWages: 0,
      roundCosts: 0,
      log: (m: string) => logs.push(m),
    };
    expect(payWages(ctx)).toBe(false);
    expect(ctx.money).toBe(10);
    expect(logs).toHaveLength(1);
  });

  it('is a no-op when nobody is hired', () => {
    const ctx = {
      workers: emptyRoster(),
      equippedModules: [],
      modifierFlags: {},
      money: 10,
      workerWages: 0,
      roundCosts: 0,
      log: () => {},
    };
    expect(payWages(ctx)).toBe(true);
    expect(ctx.money).toBe(10);
  });
});
