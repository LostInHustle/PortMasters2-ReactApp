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
    expect(calcTotalWages({ workers: emptyRoster(), equippedModules: [] })).toBe(0);
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
    expect(calcTotalWages({ workers, equippedModules: [] })).toBe(
      8 + 12 + 20 + 24 + 14 + 18 + 24,
    );
  });

  it('applies artisans_workshop wage markup (+20%, truncated) to every worker', () => {
    const workers = emptyRoster();
    workers.jeweler = [worker()]; // 24 -> trunc(24*1.2) = 28
    workers.weaver = [worker()]; // 8 -> trunc(8*1.2) = 9
    const ctx = { workers, equippedModules: withModules('artisans_workshop') };
    expect(calcTotalWages(ctx)).toBe(28 + 9);
  });
});

describe('payWages', () => {
  it('charges exactly calcTotalWages and records it on workerWages/roundCosts', () => {
    const workers = emptyRoster();
    workers.jeweler = [worker(), worker()]; // 24 * 2 = 48
    const ctx = {
      workers,
      equippedModules: [],
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
      money: 10,
      workerWages: 0,
      roundCosts: 0,
      log: () => {},
    };
    expect(payWages(ctx)).toBe(true);
    expect(ctx.money).toBe(10);
  });
});
