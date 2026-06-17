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

// Replaces PortMasters2/server.py's module-level globals (USERS, ONLINE, SESSIONS,
// PENDING_INVITES, LAST_INVITE_AT, lines 1472-1477): one object built once in main.ts and
// threaded through every handler, instead of mutable module state.
export interface ServerState {
  users: UserStore;
  online: Map<string, Sendable>;
  sessions: Map<string, SharedSession>;
  pendingInvites: Map<string, PendingInvite>;
  lastInviteAt: Map<string, number>;
}

export function createServerState(users: UserStore): ServerState {
  return {
    users,
    online: new Map(),
    sessions: new Map(),
    pendingInvites: new Map(),
    lastInviteAt: new Map(),
  };
}
