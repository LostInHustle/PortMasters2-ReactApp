import {
  BOONS_TIER0,
  BOONS_TIER1,
  BOONS_TIER2,
  CHARTER_EVENTS,
  MODULES_TIER0,
  MODULES_TIER1,
  MODULES_TIER2,
  MONSOON_TIER0,
  MONSOON_TIER1,
  MONSOON_TIER2,
  PORTS_TIER0,
  PORTS_TIER1,
  PORTS_TIER2,
  PRODUCTS_TIER0,
  PRODUCTS_TIER1,
  PRODUCTS_TIER2,
  RESOURCES_TIER0,
  RESOURCES_TIER1,
  RESOURCES_TIER2,
  WORKER_IDS_TIER0,
  WORKER_IDS_TIER1,
  WORKER_IDS_TIER2,
  type Boon,
  type CharterEvent,
  type MonsoonState,
  type PortId,
  type ProductId,
  type ResourceId,
  type ShipModule,
  type WorkerTypeId,
} from '@pm2/shared';
import { unlocked } from './difficultyRules.js';

// Ported verbatim from PortMasters2/server.py PlayerGame's "Silk Road Charter: content
// unlocks" section (lines 502-512).
export function unlockedResources(
  roundNo: number,
  tierUnlock: Record<number, number>,
): ResourceId[] {
  return unlocked<ResourceId>(
    RESOURCES_TIER0,
    RESOURCES_TIER1,
    RESOURCES_TIER2,
    roundNo,
    tierUnlock,
  );
}

export function unlockedProducts(roundNo: number, tierUnlock: Record<number, number>): ProductId[] {
  return unlocked<ProductId>(PRODUCTS_TIER0, PRODUCTS_TIER1, PRODUCTS_TIER2, roundNo, tierUnlock);
}

export function unlockedPorts(roundNo: number, tierUnlock: Record<number, number>): PortId[] {
  return unlocked<PortId>(PORTS_TIER0, PORTS_TIER1, PORTS_TIER2, roundNo, tierUnlock);
}

export function unlockedWorkerTypes(
  roundNo: number,
  tierUnlock: Record<number, number>,
): WorkerTypeId[] {
  return unlocked<WorkerTypeId>(
    WORKER_IDS_TIER0,
    WORKER_IDS_TIER1,
    WORKER_IDS_TIER2,
    roundNo,
    tierUnlock,
  );
}

// Ported verbatim from PortMasters2/server.py boon_pool/module_pool/monsoon_pool (lines 401-411).
export function boonPool(roundNo: number, tierUnlock: Record<number, number>): Boon[] {
  return unlocked<Boon>(BOONS_TIER0, BOONS_TIER1, BOONS_TIER2, roundNo, tierUnlock);
}

export function modulePool(roundNo: number, tierUnlock: Record<number, number>): ShipModule[] {
  return unlocked<ShipModule>(MODULES_TIER0, MODULES_TIER1, MODULES_TIER2, roundNo, tierUnlock);
}

export function monsoonPool(roundNo: number, tierUnlock: Record<number, number>): MonsoonState[] {
  return unlocked<MonsoonState>(MONSOON_TIER0, MONSOON_TIER1, MONSOON_TIER2, roundNo, tierUnlock);
}

// Ported verbatim from PortMasters2/server.py charter_event (lines 413-419): the Set Sail
// announcement for whichever tier opens on exactly this round, or undefined if none does.
export function charterEvent(
  roundNo: number,
  tierUnlock: Record<number, number>,
): CharterEvent | undefined {
  for (const [tierStr, unlockRound] of Object.entries(tierUnlock)) {
    if (roundNo === unlockRound) {
      return CHARTER_EVENTS[Number(tierStr) as 1 | 2];
    }
  }
  return undefined;
}
