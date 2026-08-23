import type {
  ChatMessage,
  Difficulty,
  OpenRoomSummary,
  RoomRosterMessage,
  SessionStateMessage,
} from '@pm2/shared';

/** An invitation this player has received and not yet answered. */
export interface PendingInvite {
  from: string;
  difficulty: Difficulty;
}

/**
 * Everything the client knows about the current session, replacing the module globals the
 * prototype kept at PortMasters2/PortMasters_online.html lines 1807-1815. Lives in its own
 * module so the protocol dispatcher in sessionMessages.ts can name it without importing the
 * React provider that owns it.
 */
export interface SessionState {
  currentUser: string | null;
  onlineUsers: string[];
  room: RoomRosterMessage | null;
  openRooms: OpenRoomSummary[];
  pendingInviteFrom: PendingInvite | null;
  lastInviteTo: string | null;
  serverState: SessionStateMessage | null;
  chatHistory: ChatMessage[];
  chatOpen: boolean;
}

/** Also the state a lost session falls back to, so logging out and never having logged in look the same. */
export const initialSessionState: SessionState = {
  currentUser: null,
  onlineUsers: [],
  room: null,
  openRooms: [],
  pendingInviteFrom: null,
  lastInviteTo: null,
  serverState: null,
  chatHistory: [],
  chatOpen: false,
};
