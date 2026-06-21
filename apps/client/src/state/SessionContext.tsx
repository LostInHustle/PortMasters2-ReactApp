import type {
  ChatMessage,
  Difficulty,
  OpenRoomSummary,
  RoomRosterMessage,
  SessionStateMessage,
} from '@pm2/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { lst } from '../i18n/serverTextRules.js';
import { useTranslate } from '../i18n/useTranslate.js';
import { useWs } from '../ws/WsContext.js';
import { clearStoredToken, getStoredToken, setStoredToken } from './sessionToken.js';
import { useToast } from './ToastContext.js';

interface PendingInvite {
  from: string;
  difficulty: Difficulty;
}

interface SessionState {
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

interface SessionContextValue extends SessionState {
  register: (username: string, password: string) => void;
  login: (username: string, password: string) => void;
  sendInvite: (to: string, difficulty: Difficulty) => void;
  respondInvite: (accept: boolean) => void;
  createRoom: (maxPlayers: number, difficulty: Difficulty) => void;
  joinRoom: (host: string) => void;
  leaveRoom: () => void;
  startRoom: () => void;
  voteEndSession: () => void;
  sendChat: (message: string) => void;
  requestChatHistory: () => void;
  toggleChat: () => void;
  closeChat: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const initialState: SessionState = {
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

// Ported from PortMasters2/PortMasters_online.html's global session state (lines 1807-1815) and
// setupWebSocketHandlers' onmessage dispatch (lines 1940-2052): the original mutates module
// globals then manually re-renders (renderOnlineUsers/renderAll/...); here the same per-message
// branches update React state, and every consumer re-renders on its own via the context value.
export function SessionProvider({ children }: { children: ReactNode }) {
  const { connected, subscribe, send } = useWs();
  const { showNotification } = useToast();
  const { lang } = useTranslate();
  const [state, setState] = useState<SessionState>(initialState);
  const lastLogSeqRef = useRef<number | null>(null);

  // The message handler below lives in a subscribe effect whose closure would otherwise capture
  // a stale `state`. This ref always holds the latest state, so handlers (e.g. the chat alert,
  // which must know whether the chat window is currently open) read live values.
  const stateRef = useRef(state);
  stateRef.current = state;

  // A fresh WebSocket connection (WsContext's auto-reconnect after an idle-timeout drop, a
  // laptop sleep, a server redeploy -- or just an actual page refresh) is, by itself, a
  // connection the server has never seen: there is no session tied to the TCP connection itself.
  // What makes a reconnect resumable is the token from sessionToken.ts -- if one is stored,
  // fire it off immediately and wait for `resume_result` instead of assuming the worst. Only
  // when there's no token (or the server doesn't recognize it -- see the resume_result handler
  // below) do we fall back to telling a previously-logged-in player they need to log in again.
  // `wasConnectedRef` distinguishes a real reconnect from the initial connection on first mount.
  const wasConnectedRef = useRef(false);
  useEffect(() => {
    if (connected) {
      const isReconnect = wasConnectedRef.current;
      wasConnectedRef.current = true;
      const token = getStoredToken();
      if (token) {
        send({ action: 'resume_token', token });
        return;
      }
      if (isReconnect && stateRef.current.currentUser) {
        setState(initialState);
        showNotification(
          lang === 'en'
            ? 'Reconnected. The previous connection was lost, please log in again.'
            : '已重新连接。此前的连接已断开，请重新登录。',
          true,
        );
      }
    } else if (wasConnectedRef.current && stateRef.current.currentUser) {
      showNotification(
        lang === 'en' ? 'Connection lost. Reconnecting…' : '连接已断开，正在重新连接…',
        true,
      );
    }
  }, [connected, lang, showNotification, send]);

  // Opens the chat window and refreshes its history. Used both by the header toggle and as the
  // click action on an incoming chat alert.
  const openChat = useCallback(() => {
    send({ action: 'get_chat_history' });
    setState((s) => ({ ...s, chatOpen: true }));
  }, [send]);

  useEffect(() => {
    return subscribe((msg) => {
      switch (msg.type) {
        // register_result is handled locally by RegisterForm (it also needs to switch back to
        // the login view on success, a form-local UI concern with no session-state impact).

        case 'login_result':
          if (msg.success) {
            if (typeof msg.token === 'string') setStoredToken(msg.token);
            setState((s) => ({ ...s, currentUser: msg.username as string }));
            send({ action: 'get_online_users' });
          } else {
            showNotification(lst(msg.message as string, lang), true);
          }
          break;

        // Reply to the silent resume_token attempt fired by the connected-effect above. Never
        // shown as an interactive "wrong password"-style error -- a failure here just means the
        // token is unknown (expired, already revoked by an explicit logout, or the server
        // restarted and lost it), so the fallback is the ordinary login screen, with a heads-up
        // toast only if this player had actually been mid-session when it happened.
        case 'resume_result':
          if (msg.success) {
            setState((s) => ({ ...s, currentUser: msg.username as string }));
            send({ action: 'get_online_users' });
          } else {
            clearStoredToken();
            setState((s) => {
              if (!s.currentUser) return s;
              showNotification(
                lang === 'en'
                  ? 'Reconnected, but your session could not be resumed. Please log in again.'
                  : '已重新连接，但无法恢复此前的会话，请重新登录。',
                true,
              );
              return initialState;
            });
          }
          break;

        case 'online_users':
        case 'online_users_update':
          setState((s) => ({ ...s, onlineUsers: msg.users as string[] }));
          break;

        case 'invite_received':
          setState((s) => ({
            ...s,
            pendingInviteFrom: {
              from: msg.from as string,
              difficulty: msg.difficulty as Difficulty,
            },
          }));
          break;

        case 'invite_cancelled':
          setState((s) => {
            if (s.pendingInviteFrom?.from !== msg.from) return s;
            showNotification(
              lang === 'en' ? `${msg.from}'s invitation has expired` : `${msg.from} 的邀请已失效`,
              true,
            );
            return { ...s, pendingInviteFrom: null };
          });
          break;

        case 'invite_accepted':
          setState((s) => ({ ...s, lastInviteTo: null }));
          send({ action: 'join_game' });
          showNotification(
            lang === 'en'
              ? `Joined the game, partner: ${msg.partner}`
              : `已加入游戏，伙伴: ${msg.partner}`,
          );
          break;

        case 'session_resumed':
          showNotification(lang === 'en' ? 'Session resumed' : '已恢复游戏会话');
          break;

        case 'partner_status':
          setState((s) => {
            const inRoom = s.serverState?.players.some((p) => p.name === msg.username);
            if (!inRoom) return s;
            showNotification(
              msg.online
                ? lang === 'en'
                  ? `${msg.username} is back online`
                  : `${msg.username} 已重新上线`
                : lang === 'en'
                  ? `${msg.username} went offline`
                  : `${msg.username} 已离线`,
              !msg.online,
            );
            return s;
          });
          break;

        case 'room_roster':
          setState((s) => ({
            ...s,
            room: msg as unknown as RoomRosterMessage,
          }));
          break;

        case 'open_rooms_update':
          setState((s) => ({ ...s, openRooms: msg.rooms as OpenRoomSummary[] }));
          break;

        case 'room_started':
          setState((s) => ({ ...s, room: null }));
          showNotification(lang === 'en' ? 'The voyage has begun!' : '航程开始！');
          break;

        case 'session_ended':
          setState((s) => ({
            ...s,
            room: null,
            serverState: null,
            chatHistory: [],
            chatOpen: false,
          }));
          showNotification(
            lang === 'en' ? 'The session has ended, back to the lobby' : '会话已结束，已返回大厅',
          );
          break;

        case 'invite_rejected':
          showNotification(
            lang === 'en' ? `${msg.from} declined your invitation` : `${msg.from} 拒绝了你的邀请`,
            true,
          );
          setState((s) => ({ ...s, lastInviteTo: null }));
          break;

        case 'invite_timeout':
          showNotification(
            lang === 'en'
              ? `Your invitation to ${msg.to} timed out`
              : `发送给 ${msg.to} 的邀请已超时`,
            true,
          );
          setState((s) => ({ ...s, lastInviteTo: null }));
          break;

        case 'invite_result':
          showNotification(lst(msg.message as string, lang), !msg.success);
          if (!msg.success) setState((s) => ({ ...s, lastInviteTo: null }));
          break;

        case 'chat_message': {
          // Generalized from PortMasters2/PortMasters_online.html's chat_message handler
          // (lines 2014-2021) from a 1:1 DM to a room broadcast: the server only ever relays
          // this to genuine room members, so the client trusts it rather than re-checking
          // against a single "chatPartner" that no longer exists in a room of up to 5.
          const from = msg.from as string;
          const message = msg.message as string;
          const live = stateRef.current;
          setState((s) => ({ ...s, chatHistory: [...s.chatHistory, { from, message }] }));
          if (!live.chatOpen) {
            showNotification(`💬 ${from}: ${message}`, false, openChat);
          }
          break;
        }

        case 'chat_history':
          setState((s) => ({ ...s, chatHistory: msg.history as ChatMessage[] }));
          break;

        case 'state': {
          const data = msg.data as SessionStateMessage;
          setState((s) => ({ ...s, serverState: data }));
          maybeToastNewLogs(data, lastLogSeqRef, (m) => showNotification(lst(m, lang)));
          break;
        }

        case 'system_message':
          showNotification(lst(msg.message as string, lang));
          break;
      }
    });
  }, [subscribe, send, showNotification, lang, openChat]);

  const register = useCallback(
    (username: string, password: string) => {
      send({ action: 'register', username, password });
    },
    [send],
  );

  const login = useCallback(
    (username: string, password: string) => {
      send({ action: 'login', username, password });
    },
    [send],
  );

  const sendInvite = useCallback(
    (to: string, difficulty: Difficulty) => {
      setState((s) => ({ ...s, lastInviteTo: to }));
      send({ action: 'send_invite', to, difficulty });
    },
    [send],
  );

  const respondInvite = useCallback(
    (accept: boolean) => {
      setState((s) => {
        if (!s.pendingInviteFrom) return s;
        send({ action: 'respond_invite', from: s.pendingInviteFrom.from, accept });
        return { ...s, pendingInviteFrom: null };
      });
    },
    [send],
  );

  // Generalized from PortMasters2/PortMasters_online.html sendChat (lines 2214-2222) from a 1:1
  // partner check to "is anyone else in the room online": the server relays to every other
  // online room member (lobby/chat.ts), so the sender echoes their own message locally rather
  // than waiting for it to come back over the wire. The WS send is a real side effect, so it
  // stays out of the setState updater (which React may invoke more than once) and reads the
  // gating fields off `state` directly instead.
  const sendChat = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      const { currentUser, serverState } = state;
      const anyoneElseOnline = serverState?.players.some((p) => p.name !== currentUser && p.online);
      if (!trimmed || !currentUser || !anyoneElseOnline) return;
      send({ action: 'send_chat', message: trimmed });
      setState((s) => ({
        ...s,
        chatHistory: [...s.chatHistory, { from: currentUser, message: trimmed }],
      }));
    },
    [send, state],
  );

  const requestChatHistory = useCallback(() => {
    send({ action: 'get_chat_history' });
  }, [send]);

  // Ported verbatim from PortMasters2/PortMasters_online.html toggleChat (lines 2200-2212):
  // opening the window also (re-)fetches history; closing is just a visibility flip.
  const toggleChat = useCallback(() => {
    const { chatOpen, serverState } = state;
    if (!chatOpen && serverState) requestChatHistory();
    setState((s) => ({ ...s, chatOpen: !s.chatOpen }));
  }, [state, requestChatHistory]);

  const closeChat = useCallback(() => {
    setState((s) => ({ ...s, chatOpen: false }));
  }, []);

  const createRoom = useCallback(
    (maxPlayers: number, difficulty: Difficulty) => {
      send({ action: 'create_room', maxPlayers, difficulty });
    },
    [send],
  );

  const joinRoom = useCallback(
    (host: string) => {
      send({ action: 'join_room', host });
    },
    [send],
  );

  const leaveRoom = useCallback(() => {
    send({ action: 'leave_room' });
    setState((s) => ({ ...s, room: null }));
  }, [send]);

  const startRoom = useCallback(() => {
    send({ action: 'start_room' });
  }, [send]);

  const voteEndSession = useCallback(() => {
    send({ action: 'end_session' });
  }, [send]);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        register,
        login,
        sendInvite,
        respondInvite,
        createRoom,
        joinRoom,
        leaveRoom,
        startRoom,
        voteEndSession,
        sendChat,
        requestChatHistory,
        toggleChat,
        closeChat,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// Ported verbatim from PortMasters2/PortMasters_online.html maybeToastNewLogs (lines 1844-1859):
// logSeq is a monotonic count of this game's log lines, so only lines added since the last state
// get toasted, and a restart (seq drops) re-syncs silently instead of replaying the backlog.
function maybeToastNewLogs(
  data: SessionStateMessage,
  lastLogSeqRef: { current: number | null },
  toast: (message: string) => void,
): void {
  const seq = data.yourGame.logSeq || 0;
  const logs = data.yourGame.logs || [];
  if (lastLogSeqRef.current === null || seq < lastLogSeqRef.current) {
    lastLogSeqRef.current = seq;
    return;
  }
  if (seq > lastLogSeqRef.current) {
    const newCount = Math.min(seq - lastLogSeqRef.current, logs.length);
    for (const m of logs.slice(logs.length - newCount)) toast(m);
    lastLogSeqRef.current = seq;
  }
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
