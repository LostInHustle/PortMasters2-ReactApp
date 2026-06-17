import type { SessionStateMessage } from '@pm2/shared';
import { serializePlayerGame } from '../game/serialize.js';
import type { ServerState } from '../lobby/onlineRegistry.js';
import { sendJson } from '../ws/send.js';
import type { SharedSession } from './SharedSession.js';

// Ported verbatim from PortMasters2/server.py SharedSession.broadcast_state (lines 1450-1470):
// the per-recipient "state" payload shape. Pulled out of SharedSession itself because building
// this object is pure (no I/O); the actual per-player websocket lookup/send loop is wiring that
// belongs with the Phase 4 connection layer, not this module. partnerOnline mirrors Python's
// `self.players[1 - slot] in ONLINE` -- the online-user registry is Phase 4's, so it's injected
// here rather than imported, keeping this function testable without that registry existing yet.
export function buildSessionState(
  session: SharedSession,
  slot: 0 | 1,
  isOnline: (username: string) => boolean,
): SessionStateMessage {
  const game = session.games[slot];
  const other = session.games[1 - slot]!;
  return {
    tradeOrders: session.tradeOrders,
    tradeReady: session.tradeReady,
    phaseReadyCount: session.phaseReadyCount(),
    yourGame: serializePlayerGame(game),
    otherGame: serializePlayerGame(other),
    waitingForOther: session.waitingMessage(slot),
    youReady: session.ready.has(slot),
    yourSlot: (slot + 1) as 1 | 2,
    partnerName: session.players[1 - slot]!,
    partnerOnline: isOnline(session.players[1 - slot]!),
  };
}

// Ported verbatim from PortMasters2/server.py SharedSession.broadcast_state's send loop
// (lines 1450-1470): pushes each player their own "state" message, skipping anyone not
// currently connected.
export function broadcastSessionState(state: ServerState, session: SharedSession): void {
  for (const slot of [0, 1] as const) {
    const ws = state.online.get(session.players[slot]);
    if (ws === undefined) continue;
    const isOnline = (username: string) => state.online.has(username);
    sendJson(ws, { type: 'state', data: buildSessionState(session, slot, isOnline) });
  }
}
