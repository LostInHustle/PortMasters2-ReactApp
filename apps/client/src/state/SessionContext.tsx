import type { ChatMessage, Difficulty, SessionStateMessage } from '@pm2/shared';
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
import { useToast } from './ToastContext.js';

interface PendingInvite {
  from: string;
  difficulty: Difficulty;
}

interface SessionState {
  currentUser: string | null;
  onlineUsers: string[];
  chatPartner: string | null;
  partnerOnline: boolean;
  pendingInviteFrom: PendingInvite | null;
  lastInviteTo: string | null;
  serverState: SessionStateMessage | null;
  chatHistory: ChatMessage[];
}

interface SessionContextValue extends SessionState {
  register: (username: string, password: string) => void;
  login: (username: string, password: string) => void;
  sendInvite: (to: string, difficulty: Difficulty) => void;
  respondInvite: (accept: boolean) => void;
  sendChat: (message: string) => void;
  requestChatHistory: () => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const initialState: SessionState = {
  currentUser: null,
  onlineUsers: [],
  chatPartner: null,
  partnerOnline: false,
  pendingInviteFrom: null,
  lastInviteTo: null,
  serverState: null,
  chatHistory: [],
};

// Ported from PortMasters2/PortMasters_online.html's global session state (lines 1807-1815) and
// setupWebSocketHandlers' onmessage dispatch (lines 1940-2052): the original mutates module
// globals then manually re-renders (renderOnlineUsers/renderAll/...); here the same per-message
// branches update React state, and every consumer re-renders on its own via the context value.
export function SessionProvider({ children }: { children: ReactNode }) {
  const { subscribe, send } = useWs();
  const { showNotification } = useToast();
  const { lang } = useTranslate();
  const [state, setState] = useState<SessionState>(initialState);
  const lastLogSeqRef = useRef<number | null>(null);

  useEffect(() => {
    return subscribe((msg) => {
      switch (msg.type) {
        // register_result is handled locally by RegisterForm (it also needs to switch back to
        // the login view on success, a form-local UI concern with no session-state impact).

        case 'login_result':
          if (msg.success) {
            setState((s) => ({ ...s, currentUser: msg.username as string }));
            send({ action: 'get_online_users' });
          } else {
            showNotification(lst(msg.message as string, lang), true);
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
          setState((s) => ({
            ...s,
            chatPartner: msg.partner as string,
            partnerOnline: true,
            lastInviteTo: null,
          }));
          send({ action: 'join_game' });
          showNotification(
            lang === 'en'
              ? `Joined the game — partner: ${msg.partner}`
              : `已加入游戏，伙伴: ${msg.partner}`,
          );
          break;

        case 'session_resumed':
          setState((s) => ({
            ...s,
            chatPartner: msg.partner as string,
            partnerOnline: Boolean(msg.partnerOnline),
          }));
          showNotification(
            lang === 'en'
              ? `Session resumed — partner: ${msg.partner}`
              : `已恢复游戏会话，伙伴: ${msg.partner}`,
          );
          break;

        case 'partner_status':
          setState((s) => {
            if (msg.username !== s.chatPartner) return s;
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
            return { ...s, partnerOnline: Boolean(msg.online) };
          });
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

        case 'chat_message':
          setState((s) => {
            if (msg.from !== s.chatPartner) return s;
            return {
              ...s,
              chatHistory: [
                ...s.chatHistory,
                { from: msg.from as string, message: msg.message as string },
              ],
            };
          });
          break;

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
  }, [subscribe, send, showNotification, lang]);

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

  const sendChat = useCallback(
    (message: string) => {
      send({ action: 'send_chat', message });
    },
    [send],
  );

  const requestChatHistory = useCallback(() => {
    send({ action: 'get_chat_history' });
  }, [send]);

  const logout = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        register,
        login,
        sendInvite,
        respondInvite,
        sendChat,
        requestChatHistory,
        logout,
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
