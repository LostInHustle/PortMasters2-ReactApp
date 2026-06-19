import type { Worker } from '@pm2/shared';
import { describe, expect, it } from 'vitest';
import { PlayerGame } from '../../src/game/PlayerGame.js';
import { serializePlayerGame } from '../../src/game/serialize.js';

function makeWorker(overrides: Partial<Worker> = {}): Worker {
  return { task: null, progress: 0, producedCount: 0, isSkilled: false, ...overrides };
}

// Expected shape hand-derived from PlayerGame.to_dict() (PortMasters2/server.py lines 1073-1129).
describe('serializePlayerGame', () => {
  it('sends monsoon_state and pirate_immunity in snake_case, matching the original frontend', () => {
    const game = new PlayerGame('easy');
    const state = serializePlayerGame(game);
    expect(state.monsoon_state?.id).toBe('spring_current');
    expect(state.pirate_immunity).toBe(false);
  });

  it('exposes only the length of phase2DemandTags as intelRemaining (fog of war)', () => {
    const game = new PlayerGame('easy');
    game.phase2DemandTags = ['麻布', '丝绸', '茶叶'];
    const state = serializePlayerGame(game);
    expect(state.intelRemaining).toBe(3);
    expect(state).not.toHaveProperty('phase2DemandTags');
  });

  it('sends only the last 10 log lines, matching self.lastLogs[-10:]', () => {
    const game = new PlayerGame('easy');
    for (let i = 0; i < 12; i++) game.log(`line ${i}`);
    const state = serializePlayerGame(game);
    expect(state.logs).toHaveLength(10);
    expect(state.logs[0]).toBe('line 2');
    expect(state.logs[9]).toBe('line 11');
  });

  it('flattens purchasedCards/completedOrders Sets into arrays', () => {
    const game = new PlayerGame('easy');
    game.purchasedCards.add(0);
    game.purchasedCards.add(2);
    game.completedOrders.add(1);
    const state = serializePlayerGame(game);
    expect(state.purchasedCards).toEqual([0, 2]);
    expect(state.completedOrders).toEqual([1]);
  });

  it('flattens each worker roster onto its own named field', () => {
    const game = new PlayerGame('easy');
    game.workers.weaver.push(makeWorker({ task: '麻衣' }));
    game.workers.jeweler.push(makeWorker(), makeWorker());
    const state = serializePlayerGame(game);
    expect(state.weavers).toHaveLength(1);
    expect(state.weavers[0]?.task).toBe('麻衣');
    expect(state.jewelers).toHaveLength(2);
    expect(state.masterWeavers).toEqual([]);
  });

  it('reports charterEvent as null on a round with no scheduled tier unlock', () => {
    const game = new PlayerGame('easy'); // easy never unlocks a tier
    expect(serializePlayerGame(game).charterEvent).toBeNull();
  });

  it('reports charterEvent on the exact round a tier unlocks for standard difficulty', () => {
    const game = new PlayerGame('standard');
    game.currentRound = 4; // standard's tierUnlock: {1: 4, 2: 8}
    expect(serializePlayerGame(game).charterEvent?.id).toBe('tier1');
  });

  it('reports brokerCorruption from the difficulty config, not per-instance state', () => {
    expect(serializePlayerGame(new PlayerGame('easy')).brokerCorruption).toBe(false);
    expect(serializePlayerGame(new PlayerGame('hard')).brokerCorruption).toBe(true);
  });

  // The Procure UI must never show a stale sticker price once a boon or module discounts a
  // purchase -- see costCalculations.getCardFinalCost/getCardResourceUnitPrices.
  it('stamps resourceCards with the discounted price boons and modules actually charge', () => {
    const game = new PlayerGame('easy');
    game.modifierFlags = { hempPriceReduction: 2, purchaseDiscount: 0.15 };
    game.resourceCards = [
      {
        id: 0,
        port: '泉州港',
        resources: [
          { type: '麻布', quantity: 3, price: 5 },
          { type: '丝绸', quantity: 1, price: 10 },
        ],
        totalCost: 25,
        isProductCard: false,
      },
    ];
    const state = serializePlayerGame(game);
    const card = state.resourceCards[0]!;
    expect(card.totalCost).toBe(25); // sticker price is untouched
    expect(card.effectiveCost).toBe(game.getCardFinalCost(game.resourceCards[0]!));
    expect(card.effectiveCost).toBeLessThan(card.totalCost);
    expect(card.resources[0]!.price).toBe(5); // sticker unit price is untouched
    expect(card.resources[0]!.effectivePrice).toBe(3); // hemp: -2/unit
    expect(card.resources[1]!.effectivePrice).toBe(10); // silk: no item-specific discount
  });

  it('leaves effectiveCost equal to totalCost when no discount is active', () => {
    const game = new PlayerGame('easy');
    game.resourceCards = [
      {
        id: 0,
        port: '泉州港',
        resources: [{ type: '麻布', quantity: 3, price: 5 }],
        totalCost: 15,
        isProductCard: false,
      },
    ];
    const state = serializePlayerGame(game);
    expect(state.resourceCards[0]!.effectiveCost).toBe(15);
    expect(state.resourceCards[0]!.resources[0]!.effectivePrice).toBe(5);
  });

  // The "Due This Round" sidebar must reflect every hired worker type, not just the founding
  // three -- see production.ts's calcTotalWages, shared with the real payWages charge.
  it('reports estimatedWages for the full current roster, beyond the founding worker types', () => {
    const game = new PlayerGame('standard');
    game.workers.weaver.push({ task: null, progress: 0, producedCount: 0, isSkilled: false });
    game.workers.jeweler.push({ task: null, progress: 0, producedCount: 0, isSkilled: false });
    const state = serializePlayerGame(game);
    expect(state.estimatedWages).toBe(8 + 24); // WAGES.weaver + WAGES.jeweler
    expect(state.estimatedWages).toBe(game.estimatedWages());
  });
});
