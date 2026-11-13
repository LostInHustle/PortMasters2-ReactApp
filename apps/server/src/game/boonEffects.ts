import type { Boon, BoonModifiers } from '@pm2/shared';

export interface ApplyBoonContext {
  modifierFlags: BoonModifiers;
  money: number;
  log(message: string): void;
}

// Mirrors PortMasters2/server.py apply_boon.
export function applyBoon(ctx: ApplyBoonContext, boon: Boon): void {
  ctx.modifierFlags = { ...boon.modifiers };
  if (boon.modifiers.instantGold) {
    ctx.money += boon.modifiers.instantGold;
    ctx.log(`💰 福缘：获得 ${boon.modifiers.instantGold} 金币`);
  }
}
