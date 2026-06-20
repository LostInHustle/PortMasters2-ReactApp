import { normalizeDifficulty } from '../game/difficultyRules.js';
import { broadcastSessionState } from '../session/broadcastState.js';
import { SharedSession } from '../session/SharedSession.js';
import { broadcastOnlineUsers, sendToUser } from '../ws/send.js';
import type { ServerState } from './onlineRegistry.js';

const INVITE_COOLDOWN_SECONDS = 60;
const INVITE_COOLDOWN_MS = INVITE_COOLDOWN_SECONDS * 1000;

// Ported verbatim from PortMasters2/server.py invite_timeout_task (lines 1497-1505). Python
// schedules this via asyncio.create_task + asyncio.sleep, cancelable with task.cancel(); the
// direct Node equivalent is setTimeout/clearTimeout, stored on the pending invite as `timer`.
function scheduleInviteTimeout(state: ServerState, sender: string, target: string): NodeJS.Timeout {
  return setTimeout(() => {
    const inv = state.pendingInvites.get(sender);
    state.pendingInvites.delete(sender);
    if (inv && inv.to === target) {
      sendToUser(state, sender, { type: 'invite_timeout', to: target });
      sendToUser(state, target, { type: 'invite_cancelled', from: sender });
    }
  }, INVITE_COOLDOWN_MS);
}

// Ported verbatim from PortMasters2/server.py handle_send_invite (lines 1507-1539).
export function handleSendInvite(
  state: ServerState,
  sender: string,
  target: string,
  difficulty?: unknown,
): void {
  const diff = normalizeDifficulty(difficulty);
  if (!target || target === sender) {
    sendToUser(state, sender, { type: 'invite_result', success: false, message: '无效的邀请对象' });
    return;
  }
  if (state.sessions.has(sender)) {
    sendToUser(state, sender, {
      type: 'invite_result',
      success: false,
      message: '你已在游戏会话中，无法发出邀请',
    });
    return;
  }
  const existing = state.pendingInvites.get(sender);
  if (existing) {
    sendToUser(state, sender, {
      type: 'invite_result',
      success: false,
      message: `你已向 ${existing.to} 发出邀请，请等待对方回应或超时`,
    });
    return;
  }
  const lastAt = state.lastInviteAt.get(sender) ?? -INVITE_COOLDOWN_MS;
  const elapsed = performance.now() - lastAt;
  if (elapsed < INVITE_COOLDOWN_MS) {
    const remain = Math.ceil((INVITE_COOLDOWN_MS - elapsed) / 1000);
    sendToUser(state, sender, {
      type: 'invite_result',
      success: false,
      message: `每分钟只能发出一次邀请，请 ${remain} 秒后再试`,
    });
    return;
  }
  if (!state.online.has(target)) {
    sendToUser(state, sender, {
      type: 'invite_result',
      success: false,
      message: `${target} 不在线，无法邀请`,
    });
    return;
  }
  if (state.sessions.has(target)) {
    sendToUser(state, sender, {
      type: 'invite_result',
      success: false,
      message: `${target} 正在游戏中，无法邀请`,
    });
    return;
  }
  state.lastInviteAt.set(sender, performance.now());
  const timer = scheduleInviteTimeout(state, sender, target);
  state.pendingInvites.set(sender, { to: target, difficulty: diff, timer });
  sendToUser(state, target, { type: 'invite_received', from: sender, difficulty: diff });
  sendToUser(state, sender, {
    type: 'invite_result',
    success: true,
    message: `邀请已发送给 ${target}，等待回应（${INVITE_COOLDOWN_SECONDS} 秒内有效）`,
  });
}

// Ported verbatim from PortMasters2/server.py handle_respond_invite (lines 1541-1564).
export function handleRespondInvite(
  state: ServerState,
  responder: string,
  sender: string,
  accept: boolean,
): void {
  const inv = state.pendingInvites.get(sender);
  if (!inv || inv.to !== responder) {
    sendToUser(state, responder, { type: 'system_message', message: '该邀请已失效' });
    return;
  }
  state.pendingInvites.delete(sender);
  clearTimeout(inv.timer);
  if (!accept) {
    sendToUser(state, sender, { type: 'invite_rejected', from: responder });
    return;
  }
  if (!state.online.has(sender)) {
    sendToUser(state, responder, { type: 'system_message', message: '对方已离线，邀请失效' });
    return;
  }
  if (state.sessions.has(sender) || state.sessions.has(responder)) {
    sendToUser(state, responder, {
      type: 'system_message',
      message: '无法建立会话：其中一方已在游戏中',
    });
    return;
  }
  const difficulty = normalizeDifficulty(inv.difficulty);
  const sess = SharedSession.createPair(sender, responder, difficulty);
  state.sessions.set(sender, sess);
  state.sessions.set(responder, sess);
  sendToUser(state, sender, { type: 'invite_accepted', partner: responder, difficulty });
  sendToUser(state, responder, { type: 'invite_accepted', partner: sender, difficulty });
  broadcastOnlineUsers(state);
  broadcastSessionState(state, sess);
}
