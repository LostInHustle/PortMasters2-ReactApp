// Ported verbatim from PortMasters2/server.py PORTS_TIER0/1/2 (lines 43-46).
export const PORTS_TIER0 = ['泉州港', '广州港', '宁波港', '扬州港', '杭州港'] as const;
export const PORTS_TIER1 = ['福州港', '高丽港'] as const;
export const PORTS_TIER2 = ['三佛齐港', '大食港'] as const;
export const PORTS = [...PORTS_TIER0, ...PORTS_TIER1, ...PORTS_TIER2] as const;

export type PortId = (typeof PORTS)[number];
