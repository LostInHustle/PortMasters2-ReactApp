// Ported verbatim from PortMasters2/server.py RESOURCES_TIER0/1/2 (lines 33-36).
export const RESOURCES_TIER0 = ['麻布', '丝绸', '茶叶'] as const;
export const RESOURCES_TIER1 = ['瓷土', '铜矿'] as const;
export const RESOURCES_TIER2 = ['香料', '珍珠'] as const;
export const RESOURCES = [...RESOURCES_TIER0, ...RESOURCES_TIER1, ...RESOURCES_TIER2] as const;

export type ResourceId = (typeof RESOURCES)[number];
