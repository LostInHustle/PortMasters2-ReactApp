import type { SharedSession } from '../session/SharedSession.js';

// Shared by every action that marks this player ready for the next phase and immediately
// advances the session once everyone is ready. It mirrors the repeated
// `sess.ready.add(slot); changed = True; if sess.gate_complete(): sess.advance()` pattern in
// PortMasters2/server.py.
export function readyUpAndMaybeAdvance(sess: SharedSession, slot: number): void {
  sess.ready.add(slot);
  if (sess.gateComplete()) {
    sess.advance();
  }
}
