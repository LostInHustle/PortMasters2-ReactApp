import type { ItemId } from '../data/commodities.js';
import type { PortId } from '../data/ports.js';

// Mirrors PortMasters2/server.py _reveal_intel: a "牙行密语" clue
// purchased during the Purchase phase, resolved into a matching order by gen_mixed_order.
export interface IntelClue {
  item: ItemId;
  port: PortId;
  used: boolean;
}
