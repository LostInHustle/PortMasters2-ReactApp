import type { PortId } from './ports.js';
import type { ItemId } from './commodities.js';

export interface EmperorMandateResource {
  type: ItemId;
  required: number;
}

export interface EmperorMandateTemplate {
  port: PortId;
  reward: number;
  resources: readonly EmperorMandateResource[];
}

// Ported verbatim from PortMasters2/server.py EMPEROR_MANDATE_TEMPLATES (lines 174-178).
// Ordered small -> large; the difficulty's "mandates" schedule (data/difficulties.ts) maps a
// round number to an index into this array.
export const EMPEROR_MANDATE_TEMPLATES: readonly EmperorMandateTemplate[] = [
  {
    port: '泉州港',
    reward: 135,
    resources: [
      { type: '丝绸', required: 4 },
      { type: '茶叶', required: 3 },
    ],
  },
  {
    port: '扬州港',
    reward: 260,
    resources: [
      { type: '绫罗绸缎', required: 2 },
      { type: '香囊', required: 1 },
    ],
  },
  {
    port: '杭州港',
    reward: 420,
    resources: [
      { type: '布衣', required: 2 },
      { type: '绫罗绸缎', required: 2 },
      { type: '香囊', required: 2 },
    ],
  },
];
