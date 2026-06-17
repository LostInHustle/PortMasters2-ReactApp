import type { SharedSession } from '../session/SharedSession.js';

// Shared by every action that marks this player ready for the next phase and immediately
// advances the session once both players are ready -- PortMasters2/server.py's repeated
// `sess.ready.add(slot); changed = True; if sess.gate_complete(): sess.advance()` pattern
// (e.g. lines 1601-1604, 1617-1621, 1685-1688).
export function readyUpAndMaybeAdvance(sess: SharedSession, slot: 0 | 1): void {
  sess.ready.add(slot);
  if (sess.gateComplete()) {
    sess.advance();
  }
}
