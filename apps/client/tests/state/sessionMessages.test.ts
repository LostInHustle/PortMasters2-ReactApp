import { describe, expect, it } from 'vitest';
import {
  handleServerMessage,
  toastNewLogs,
  type SessionMessageDeps,
} from '../../src/state/sessionMessages.js';
import { initialSessionState, type SessionState } from '../../src/state/sessionState.js';

interface Harness {
  deps: SessionMessageDeps;
  state: () => SessionState;
  toasts: { message: string; isError: boolean }[];
  sent: Record<string, unknown>[];
  chatOpened: number;
  /** Counts how many times each updater was invoked, to prove they carry no side effects. */
  runUpdaterTwice: boolean;
}

// React is allowed to run a state updater more than once, and under StrictMode it does. The
// harness can replay every updater to make that concrete: anything a branch does only through
// an updater would then happen twice, and the assertions below would catch it.
function harness(initial: Partial<SessionState> = {}, { runUpdaterTwice = false } = {}): Harness {
  let state: SessionState = { ...initialSessionState, ...initial };
  const h: Harness = {
    toasts: [],
    sent: [],
    chatOpened: 0,
    runUpdaterTwice,
    state: () => state,
    deps: {
      setState: (updater) => {
        if (runUpdaterTwice) state = updater(state);
        state = updater(state);
      },
      readState: () => state,
      send: (action) => h.sent.push(action),
      showNotification: (message, isError = false) => h.toasts.push({ message, isError }),
      openChat: () => (h.chatOpened += 1),
      lang: 'en',
      lastLogSeq: { current: null },
    },
  };
  return h;
}

describe('handleServerMessage', () => {
  it('records the logged in user and asks for the online list', () => {
    const h = harness();
    handleServerMessage(h.deps, { type: 'login_result', success: true, username: 'alice' });
    expect(h.state().currentUser).toBe('alice');
    expect(h.sent).toEqual([{ action: 'get_online_users' }]);
  });

  it('reports a failed login as an error and stays logged out', () => {
    const h = harness();
    handleServerMessage(h.deps, {
      type: 'login_result',
      success: false,
      message: '用户名或密码错误',
    });
    expect(h.state().currentUser).toBeNull();
    expect(h.toasts[0]!.isError).toBe(true);
  });

  it('keeps quiet on a failed resume when nobody was logged in', () => {
    const h = harness();
    handleServerMessage(h.deps, { type: 'resume_result', success: false });
    expect(h.toasts).toEqual([]);
  });

  it('falls back to the login screen when a resume fails mid session', () => {
    const h = harness({ currentUser: 'alice', onlineUsers: ['bob'] });
    handleServerMessage(h.deps, { type: 'resume_result', success: false });
    expect(h.state()).toEqual(initialSessionState);
    expect(h.toasts).toHaveLength(1);
    expect(h.toasts[0]!.isError).toBe(true);
  });

  it('announces an expired invitation only to the player actually holding it', () => {
    const held = harness({ pendingInviteFrom: { from: 'bob', difficulty: 'easy' } });
    handleServerMessage(held.deps, { type: 'invite_cancelled', from: 'bob' });
    expect(held.state().pendingInviteFrom).toBeNull();
    expect(held.toasts).toHaveLength(1);

    const unrelated = harness({ pendingInviteFrom: { from: 'carol', difficulty: 'easy' } });
    handleServerMessage(unrelated.deps, { type: 'invite_cancelled', from: 'bob' });
    expect(unrelated.state().pendingInviteFrom).toEqual({ from: 'carol', difficulty: 'easy' });
    expect(unrelated.toasts).toEqual([]);
  });

  it('announces a fellow captain going offline only when they share this voyage', () => {
    const sharing = harness({
      serverState: { players: [{ name: 'bob', online: false, isHost: false }] } as never,
    });
    handleServerMessage(sharing.deps, { type: 'partner_status', username: 'bob', online: false });
    expect(sharing.toasts).toHaveLength(1);
    expect(sharing.toasts[0]!.isError).toBe(true);

    const lobby = harness();
    handleServerMessage(lobby.deps, { type: 'partner_status', username: 'bob', online: false });
    expect(lobby.toasts).toEqual([]);
  });

  it('appends an incoming chat line and alerts only while the window is shut', () => {
    const shut = harness();
    handleServerMessage(shut.deps, { type: 'chat_message', from: 'bob', message: 'ahoy' });
    expect(shut.state().chatHistory).toEqual([{ from: 'bob', message: 'ahoy' }]);
    expect(shut.toasts).toHaveLength(1);

    const open = harness({ chatOpen: true });
    handleServerMessage(open.deps, { type: 'chat_message', from: 'bob', message: 'ahoy' });
    expect(open.state().chatHistory).toHaveLength(1);
    expect(open.toasts).toEqual([]);
  });

  it('clears the room and the chat when the session ends', () => {
    const h = harness({
      room: {} as never,
      serverState: {} as never,
      chatOpen: true,
      chatHistory: [{ from: 'bob', message: 'ahoy' }],
      currentUser: 'alice',
    });
    handleServerMessage(h.deps, { type: 'session_ended' });
    expect(h.state().serverState).toBeNull();
    expect(h.state().room).toBeNull();
    expect(h.state().chatHistory).toEqual([]);
    expect(h.state().chatOpen).toBe(false);
    // Still logged in: the voyage ended, not the login.
    expect(h.state().currentUser).toBe('alice');
  });

  it('ignores a message type it does not know', () => {
    const h = harness({ currentUser: 'alice' });
    handleServerMessage(h.deps, { type: 'something_new', payload: 1 });
    expect(h.state()).toEqual({ ...initialSessionState, currentUser: 'alice' });
    expect(h.toasts).toEqual([]);
  });

  // The point of keeping side effects out of the updaters. Replaying every updater must not
  // duplicate a single toast or socket send.
  it('raises each toast and sends each action exactly once even when updaters run twice', () => {
    const cases: Record<string, unknown>[] = [
      { type: 'login_result', success: true, username: 'alice' },
      { type: 'invite_accepted', partner: 'bob' },
      { type: 'room_started' },
      { type: 'session_ended' },
      { type: 'invite_rejected', from: 'bob' },
      { type: 'invite_timeout', to: 'bob' },
    ];
    for (const msg of cases) {
      const once = harness({ currentUser: 'alice' });
      const twice = harness({ currentUser: 'alice' }, { runUpdaterTwice: true });
      handleServerMessage(once.deps, msg as never);
      handleServerMessage(twice.deps, msg as never);
      expect(twice.toasts, `toasts for ${msg.type}`).toEqual(once.toasts);
      expect(twice.sent, `sends for ${msg.type}`).toEqual(once.sent);
      expect(twice.state(), `state for ${msg.type}`).toEqual(once.state());
    }
  });

  it('does not double announce a lost session when the updater runs twice', () => {
    const h = harness({ currentUser: 'alice' }, { runUpdaterTwice: true });
    handleServerMessage(h.deps, { type: 'resume_result', success: false });
    expect(h.toasts).toHaveLength(1);
    expect(h.state()).toEqual(initialSessionState);
  });
});

describe('toastNewLogs', () => {
  const stateWith = (logSeq: number, logs: string[]) => ({ yourGame: { logSeq, logs } }) as never;

  it('stays silent on the first state so a resume never replays the backlog', () => {
    const seen: string[] = [];
    const last = { current: null as number | null };
    toastNewLogs(stateWith(3, ['a', 'b', 'c']), last, (m) => seen.push(m));
    expect(seen).toEqual([]);
    expect(last.current).toBe(3);
  });

  it('announces only the lines added since the previous state', () => {
    const seen: string[] = [];
    const last = { current: 3 as number | null };
    toastNewLogs(stateWith(5, ['a', 'b', 'c', 'd', 'e']), last, (m) => seen.push(m));
    expect(seen).toEqual(['d', 'e']);
    expect(last.current).toBe(5);
  });

  it('resyncs silently when a restart drops the counter', () => {
    const seen: string[] = [];
    const last = { current: 9 as number | null };
    toastNewLogs(stateWith(1, ['fresh']), last, (m) => seen.push(m));
    expect(seen).toEqual([]);
    expect(last.current).toBe(1);
  });

  it('never announces more lines than the log actually holds', () => {
    const seen: string[] = [];
    const last = { current: 0 as number | null };
    toastNewLogs(stateWith(100, ['only', 'two']), last, (m) => seen.push(m));
    expect(seen).toEqual(['only', 'two']);
  });
});
