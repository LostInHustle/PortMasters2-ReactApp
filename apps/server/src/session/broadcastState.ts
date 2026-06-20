import type { RosterPlayer, SessionStateMessage } from '@pm2/shared';
import { serializePlayerGame } from '../game/serialize.js';
import type { ServerState } from '../lobby/onlineRegistry.js';
import { sendJson } from '../ws/send.js';
import type { SharedSession } from './SharedSession.js';

// Generalizes PortMasters2/server.py SharedSession.broadcast_state's per-recipient "state"
// payload (lines 1450-1470) from a single partner to a room of 2-5: otherGames/players replace
// the old singular otherGame/partnerName/partnerOnline. Pulled out of SharedSession itself
// because building this object is pure (no I/O); the actual per-player websocket lookup/send
// loop is wiring that belongs with the connection layer, not this module. isOnline is injected
// rather than imported, keeping this function testable without the online registry.
export function buildSessionState(
  session: SharedSession,
  slot: number,
  isOnline: (username: string) => boolean,
): SessionStateMessage {
  const game = session.games[slot]!;
  const otherGames: Record<string, ReturnType<typeof serializePlayerGame>> = {};
  for (const [i, name] of session.players.entries()) {
    if (i !== slot) otherGames[name] = serializePlayerGame(session.games[i]!);
  }
  const players: RosterPlayer[] = session.players.map((name) => ({
    name,
    online: isOnline(name),
    isHost: name === session.host,
  }));
  return {
    tradeOrders: session.tradeOrders,
    tradeReady: session.tradeReady,
    phaseReadyCount: session.phaseReadyCount(),
    phaseTotalCount: session.games.length,
    yourGame: serializePlayerGame(game),
    otherGames,
    waitingForOther: session.waitingMessage(slot),
    youReady: session.ready.has(slot),
    yourSlot: slot + 1,
    host: session.host,
    maxPlayers: session.maxPlayers,
    players,
    endSessionVotes: session.endVotes.size,
    endSessionTotal: session.players.length,
    youVotedEnd: session.endVotes.has(slot),
  };
}

// Generalizes PortMasters2/server.py SharedSession.broadcast_state's send loop (lines 1450-1470)
// from 2 fixed slots to the room's full roster: pushes each player their own "state" message,
// skipping anyone not currently connected.
export function broadcastSessionState(state: ServerState, session: SharedSession): void {
  const isOnline = (username: string) => state.online.has(username);
  for (let slot = 0; slot < session.players.length; slot++) {
    const ws = state.online.get(session.players[slot]!);
    if (ws === undefined) continue;
    sendJson(ws, { type: 'state', data: buildSessionState(session, slot, isOnline) });
  }
}
