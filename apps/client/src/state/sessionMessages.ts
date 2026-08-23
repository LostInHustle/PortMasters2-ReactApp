import type {
  ChatMessage,
  Difficulty,
  OpenRoomSummary,
  RoomRosterMessage,
  SessionStateMessage,
} from '@pm2/shared';
import type { Lang } from '../i18n/LangContext.js';
import { lst } from '../i18n/serverTextRules.js';
import { clearStoredToken, setStoredToken } from './sessionToken.js';
import { initialSessionState, type SessionState } from './sessionState.js';

type ServerMessage = Record<string, unknown> & { type: string };

/**
 * Everything the dispatcher below needs from its host provider. Passing them in keeps this
 * module free of React: it is the protocol layer, and it can be read, reviewed and tested as
 * one piece without a component tree around it.
 */
export interface SessionMessageDeps {
  /** Applies a state transition, exactly like React's setState with an updater. */
  setState: (updater: (state: SessionState) => SessionState) => void;
  /** The state as of right now, for decisions that must not be made inside an updater. */
  readState: () => SessionState;
  send: (action: Record<string, unknown>) => void;
  showNotification: (message: string, isError?: boolean, onClick?: () => void) => void;
  openChat: () => void;
  lang: Lang;
  /** Monotonic log counter carried between messages so only genuinely new lines get toasted. */
  lastLogSeq: { current: number | null };
}

/**
 * Ported from PortMasters2/PortMasters_online.html setupWebSocketHandlers' onmessage dispatch
 * (lines 1940-2052). The original mutates module globals and then manually redraws
 * (renderOnlineUsers/renderAll/...); here each branch produces a state transition and React
 * redraws whatever depends on it.
 *
 * Two rules hold throughout, and both were learned the hard way. State updaters are pure: they
 * compute the next state and nothing else. React is free to run an updater more than once, and
 * under StrictMode in development it does, so a toast raised from inside one appears twice.
 * Anything that reaches outside (a toast, a socket send, a token write) therefore happens out
 * here, reading the live state through readState() when it needs to decide.
 */
export function handleServerMessage(deps: SessionMessageDeps, msg: ServerMessage): void {
  const { setState, readState, send, showNotification, openChat, lang, lastLogSeq } = deps;
  const say = (zh: string, en: string) => (lang === 'en' ? en : zh);

  switch (msg.type) {
    // register_result is handled locally by RegisterForm (it also needs to switch back to the
    // login view on success, a concern local to that form with no impact on session state).

    case 'login_result':
      if (msg.success) {
        if (typeof msg.token === 'string') setStoredToken(msg.token);
        setState((s) => ({ ...s, currentUser: msg.username as string }));
        send({ action: 'get_online_users' });
      } else {
        showNotification(lst(msg.message as string, lang), true);
      }
      break;

    // Reply to the silent resume_token attempt fired by SessionContext's connected effect.
    // Never shown as an interactive "wrong password" style error: a failure here just means the
    // token is unknown (expired, already revoked by an explicit logout, or the server restarted
    // and lost it), so the fallback is the ordinary login screen, with a heads up toast only if
    // this player had actually been mid session when it happened.
    case 'resume_result':
      if (msg.success) {
        setState((s) => ({ ...s, currentUser: msg.username as string }));
        send({ action: 'get_online_users' });
      } else {
        clearStoredToken();
        if (readState().currentUser) {
          showNotification(
            say(
              '已重新连接，但无法恢复此前的会话，请重新登录。',
              'Reconnected, but your session could not be resumed. Please log in again.',
            ),
            true,
          );
          setState(() => initialSessionState);
        }
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
      if (readState().pendingInviteFrom?.from === msg.from) {
        showNotification(
          say(`${msg.from} 的邀请已失效`, `${msg.from}'s invitation has expired`),
          true,
        );
        setState((s) => ({ ...s, pendingInviteFrom: null }));
      }
      break;

    case 'invite_accepted':
      setState((s) => ({ ...s, lastInviteTo: null }));
      send({ action: 'join_game' });
      showNotification(
        say(`已加入游戏，伙伴: ${msg.partner}`, `Joined the game, partner: ${msg.partner}`),
      );
      break;

    case 'session_resumed':
      showNotification(say('已恢复游戏会话', 'Session resumed'));
      break;

    case 'partner_status': {
      // Only worth announcing for someone actually sharing this voyage. The server also sends
      // this for lobby level presence changes, which the online list already shows.
      const inRoom = readState().serverState?.players.some((p) => p.name === msg.username);
      if (inRoom) {
        showNotification(
          msg.online
            ? say(`${msg.username} 已重新上线`, `${msg.username} is back online`)
            : say(`${msg.username} 已离线`, `${msg.username} went offline`),
          !msg.online,
        );
      }
      break;
    }

    case 'room_roster':
      setState((s) => ({ ...s, room: msg as unknown as RoomRosterMessage }));
      break;

    case 'open_rooms_update':
      setState((s) => ({ ...s, openRooms: msg.rooms as OpenRoomSummary[] }));
      break;

    case 'room_started':
      setState((s) => ({ ...s, room: null }));
      showNotification(say('航程开始！', 'The voyage has begun!'));
      break;

    case 'session_ended':
      setState((s) => ({
        ...s,
        room: null,
        serverState: null,
        chatHistory: [],
        chatOpen: false,
      }));
      showNotification(say('会话已结束，已返回大厅', 'The session has ended, back to the lobby'));
      break;

    case 'invite_rejected':
      showNotification(
        say(`${msg.from} 拒绝了你的邀请`, `${msg.from} declined your invitation`),
        true,
      );
      setState((s) => ({ ...s, lastInviteTo: null }));
      break;

    case 'invite_timeout':
      showNotification(
        say(`发送给 ${msg.to} 的邀请已超时`, `Your invitation to ${msg.to} timed out`),
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
      // (lines 2014-2021) from a 1:1 DM to a room broadcast: the server only ever relays this
      // to genuine room members, so the client trusts it rather than checking again against a
      // single "chatPartner" that no longer exists in a room of up to 5.
      const from = msg.from as string;
      const message = msg.message as string;
      const chatWasOpen = readState().chatOpen;
      setState((s) => ({ ...s, chatHistory: [...s.chatHistory, { from, message }] }));
      if (!chatWasOpen) showNotification(`💬 ${from}: ${message}`, false, openChat);
      break;
    }

    case 'chat_history':
      setState((s) => ({ ...s, chatHistory: msg.history as ChatMessage[] }));
      break;

    case 'state': {
      const data = msg.data as SessionStateMessage;
      setState((s) => ({ ...s, serverState: data }));
      toastNewLogs(data, lastLogSeq, (m) => showNotification(lst(m, lang)));
      break;
    }

    case 'system_message':
      showNotification(lst(msg.message as string, lang));
      break;
  }
}

/**
 * Ported verbatim from PortMasters2/PortMasters_online.html maybeToastNewLogs
 * (lines 1844-1859): logSeq is a monotonic count of this game's log lines, so only lines added
 * since the last state get toasted, and a restart (where the counter drops) resyncs silently
 * instead of replaying the whole backlog.
 */
export function toastNewLogs(
  data: SessionStateMessage,
  lastLogSeq: { current: number | null },
  toast: (message: string) => void,
): void {
  const seq = data.yourGame.logSeq || 0;
  const logs = data.yourGame.logs || [];
  if (lastLogSeq.current === null || seq < lastLogSeq.current) {
    lastLogSeq.current = seq;
    return;
  }
  if (seq > lastLogSeq.current) {
    const newCount = Math.min(seq - lastLogSeq.current, logs.length);
    for (const m of logs.slice(logs.length - newCount)) toast(m);
    lastLogSeq.current = seq;
  }
}
