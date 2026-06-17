// Ported verbatim from PortMasters2/server.py WORKER_TYPES_BACKEND/WORKER_ATTR/
// WORKER_IDS_TIER0/1/2/WAGES (lines 333-348).

export const WORKER_TYPES_BACKEND = [
  { id: 'weaver', attr: 'weavers' },
  { id: 'master', attr: 'masterWeavers' },
  { id: 'sachet_maker', attr: 'sachetMakers' },
  { id: 'coppersmith', attr: 'coppersmiths' },
  { id: 'potter', attr: 'potters' },
  { id: 'perfumer', attr: 'perfumers' },
  { id: 'jeweler', attr: 'jewelers' },
] as const;

export type WorkerTypeId = (typeof WORKER_TYPES_BACKEND)[number]['id'];
export type WorkerAttr = (typeof WORKER_TYPES_BACKEND)[number]['attr'];

export const WORKER_ATTR: Record<WorkerTypeId, WorkerAttr> = Object.fromEntries(
  WORKER_TYPES_BACKEND.map((w) => [w.id, w.attr]),
) as Record<WorkerTypeId, WorkerAttr>;

export const WORKER_IDS_TIER0: readonly WorkerTypeId[] = ['weaver', 'master', 'sachet_maker'];
export const WORKER_IDS_TIER1: readonly WorkerTypeId[] = ['coppersmith', 'potter'];
export const WORKER_IDS_TIER2: readonly WorkerTypeId[] = ['perfumer', 'jeweler'];

export const WAGES: Record<WorkerTypeId, number> = {
  weaver: 8,
  master: 12,
  sachet_maker: 20,
  coppersmith: 12,
  potter: 14,
  perfumer: 18,
  jeweler: 24,
};
