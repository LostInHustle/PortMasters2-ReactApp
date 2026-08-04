import type { Difficulty } from '@pm2/shared';
import type { UserStore } from '../auth/UserStore.js';
import type { SharedSession } from '../session/SharedSession.js';

// A minimal send target: the real `ws` WebSocket satisfies this structurally, while tests can
// pass a lightweight fake that just records what was sent.
export interface Sendable {
  send(data: string): void;
}

// Ported verbatim from PortMasters2/server.py handle_send_invite/invite_timeout_task
// (lines 1497-1539): the difficulty rides with the pending invite so the eventual session is
// always built from what the invitee actually saw, never from a value the responder echoes back.
export interface PendingInvite {
  to: string;
  difficulty: Difficulty;
  timer: NodeJS.Timeout;
}

// Replaces PortMasters2/server.py's module-level globals (USERS, ONLINE, SESSIONS, ROOMS,
// PENDING_INVITES, LAST_INVITE_AT, lines 1472-1477): one object built once in main.ts and
// threaded through every handler, instead of mutable module state. `rooms` mirrors the
// prototype's ROOMS -- host username to pending (not yet started) session, a subset of the
// memberships also tracked in `sessions` -- so the lobby's "open rooms" browse list never has
// to filter `sessions` for `!started` on every render.
export interface ServerState {
  users: UserStore;
  online: Map<string, Sendable>;
  sessions: Map<string, SharedSession>;
  rooms: Map<string, SharedSession>;
  pendingInvites: Map<string, PendingInvite>;
  lastInviteAt: Map<string, number>;
  // token -> username. Lets a fresh WebSocket connection (a reconnect after an idle-timeout
  // drop, a brief network blip, an actual page refresh) silently re-identify itself without the
  // player retyping a password, as long as this process is still the one that issued the token.
  // Deliberately in-memory only, same lifetime as `online`/`sessions`: a real server restart
  // already wipes all in-memory game state regardless, so a token surviving that wouldn't have
  // anything left to resume anyway.
  sessionTokens: Map<string, string>;
}

export function createServerState(users: UserStore): ServerState {
  return {
    users,
    online: new Map(),
    sessions: new Map(),
    rooms: new Map(),
    pendingInvites: new Map(),
    lastInviteAt: new Map(),
    sessionTokens: new Map(),
  };
}
