// Ported verbatim from PortMasters2/server.py PRODUCTS_TIER0/1/2 (lines 38-41).
export const PRODUCTS_TIER0 = ['麻衣', '布衣', '绫罗绸缎', '香囊'] as const;
export const PRODUCTS_TIER1 = ['紫铜镜', '青瓷器'] as const;
export const PRODUCTS_TIER2 = ['蕃香脂', '珠链'] as const;
export const PRODUCTS = [...PRODUCTS_TIER0, ...PRODUCTS_TIER1, ...PRODUCTS_TIER2] as const;

export type ProductId = (typeof PRODUCTS)[number];
