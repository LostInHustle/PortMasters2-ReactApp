import type { Difficulty } from '@pm2/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslate } from '../i18n/useTranslate.js';
import { useWs } from '../ws/WsContext.js';
import { handleServerMessage } from './sessionMessages.js';
import { getStoredToken } from './sessionToken.js';
import { initialSessionState, type SessionState } from './sessionState.js';
import { useToast } from './ToastContext.js';

interface SessionActions {
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

type SessionContextValue = SessionState & SessionActions;

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Owns the client's view of the session and the actions that change it.
 *
 * The protocol itself lives next door in sessionMessages.ts: one branch per server message,
 * with no React in it. That split is deliberate. The dispatcher is the part that grows every
 * time the protocol does, and keeping it out here left this provider small enough to read in
 * one sitting, which is what the wiring below should be.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const { connected, subscribe, send } = useWs();
  const { showNotification } = useToast();
  const { lang } = useTranslate();
  const [state, setState] = useState<SessionState>(initialSessionState);
  const lastLogSeq = useRef<number | null>(null);

  // The subscribe effect below runs its handler long after the render that created it, so a
  // captured `state` would be stale. This ref always holds the latest, and readState() in the
  // dispatcher reads through it.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Opens the chat window and refreshes its history. Used both by the header toggle and as the
  // click action on an incoming chat alert.
  const openChat = useCallback(() => {
    send({ action: 'get_chat_history' });
    setState((s) => ({ ...s, chatOpen: true }));
  }, [send]);

  // A fresh WebSocket connection (WsContext's auto reconnect after an idle timeout drop, a
  // laptop sleep, a server redeploy, or just an actual page refresh) is, by itself, a connection
  // the server has never seen: no session is tied to the TCP connection itself. What makes a
  // reconnect resumable is the token from sessionToken.ts. If one is stored, fire it off
  // immediately and wait for `resume_result` instead of assuming the worst. Only when there is
  // no token (or the server does not recognise it, see the resume_result branch in
  // sessionMessages.ts) do we fall back to telling a previously logged in player to log in
  // again. `wasConnected` distinguishes a real reconnect from the first connection on mount.
  const wasConnected = useRef(false);
  useEffect(() => {
    if (connected) {
      const isReconnect = wasConnected.current;
      wasConnected.current = true;
      const token = getStoredToken();
      if (token) {
        send({ action: 'resume_token', token });
        return;
      }
      if (isReconnect && stateRef.current.currentUser) {
        setState(() => initialSessionState);
        showNotification(
          lang === 'en'
            ? 'Reconnected. The previous connection was lost, please log in again.'
            : '已重新连接。此前的连接已断开，请重新登录。',
          true,
        );
      }
    } else if (wasConnected.current && stateRef.current.currentUser) {
      showNotification(
        lang === 'en' ? 'Connection lost. Reconnecting…' : '连接已断开，正在重新连接…',
        true,
      );
    }
  }, [connected, lang, showNotification, send]);

  useEffect(() => {
    return subscribe((msg) =>
      handleServerMessage(
        {
          setState,
          readState: () => stateRef.current,
          send,
          showNotification,
          openChat,
          lang,
          lastLogSeq,
        },
        msg,
      ),
    );
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
      const pending = stateRef.current.pendingInviteFrom;
      if (!pending) return;
      send({ action: 'respond_invite', from: pending.from, accept });
      setState((s) => ({ ...s, pendingInviteFrom: null }));
    },
    [send],
  );

  // Generalized from PortMasters2/PortMasters_online.html sendChat (lines 2214-2222) from a 1:1
  // partner check to "is anyone else in the room online": the server relays to every other
  // online room member (lobby/chat.ts), so the sender echoes their own message locally rather
  // than waiting for it to come back over the wire.
  const sendChat = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      const { currentUser, serverState } = stateRef.current;
      const anyoneElseOnline = serverState?.players.some((p) => p.name !== currentUser && p.online);
      if (!trimmed || !currentUser || !anyoneElseOnline) return;
      send({ action: 'send_chat', message: trimmed });
      setState((s) => ({
        ...s,
        chatHistory: [...s.chatHistory, { from: currentUser, message: trimmed }],
      }));
    },
    [send],
  );

  const requestChatHistory = useCallback(() => {
    send({ action: 'get_chat_history' });
  }, [send]);

  // Ported verbatim from PortMasters2/PortMasters_online.html toggleChat (lines 2200-2212):
  // opening the window also refetches history; closing is just a visibility flip.
  const toggleChat = useCallback(() => {
    const { chatOpen, serverState } = stateRef.current;
    if (!chatOpen && serverState) requestChatHistory();
    setState((s) => ({ ...s, chatOpen: !s.chatOpen }));
  }, [requestChatHistory]);

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

  const actions = useMemo<SessionActions>(
    () => ({
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
    }),
    [
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
    ],
  );

  const value = useMemo<SessionContextValue>(() => ({ ...state, ...actions }), [state, actions]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
