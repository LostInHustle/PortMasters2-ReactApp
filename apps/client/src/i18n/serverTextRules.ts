import { EN_NAMES, tn } from './enNames.js';
import { wName } from './workerTypesText.js';
import type { Lang } from './LangContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html SERVER_TEXT_RULES
// (lines 1652-1713): the server outputs log/system messages in canonical Chinese; language
// belongs to the presentation layer, and the two players in a session may use different
// languages, so each client translates independently. This table maps message templates one by
// one; any string that doesn't match falls back to per-noun substitution (lstNames). This file
// is one of the plan's named file-size-ceiling exceptions: a flat, append-only regex table,
// kept as one file so a new server log line only ever needs one new entry in one place.
type ServerTextRule = [RegExp, (m: RegExpMatchArray) => string];

export const SERVER_TEXT_RULES: ServerTextRule[] = [
  [/^💰 福缘：获得 (\d+) 金币$/, (m) => `💰 Fortune: gained ${m[1]!} gold`],
  [/^❌ 资金不足！需要(\d+)金币$/, (m) => `❌ Not enough gold! ${m[1]!} needed`],
  [/^🛒 采购完成，花费(\d+)金币$/, (m) => `🛒 Purchase complete — ${m[1]!} gold spent`],
  [/^❌ 库存不足：(.+)×(\d+)$/, (m) => `❌ Not enough stock: ${tn(m[1]!, 'en')} ×${m[2]!}`],
  [/^♻️ 打捞起重机退还(\d+)金币$/, (m) => `♻️ Salvage Crane refunded ${m[1]!} gold in shipping`],
  [/^🚨 避税账本触发，罚款20金币！$/, () => `🚨 Hidden Ledger audit — fined 20 gold!`],
  [/^📦 订单完成，净利润(-?\d+)金币$/, (m) => `📦 Order delivered — net profit ${m[1]!} gold`],
  [/^❌ 旗舰尚无模块槽位，请先升级船坞$/, () => `❌ No module slots yet — upgrade your ship first`],
  [/^🔄 将 (.+) 替换为 (.+)！$/, (m) => `🔄 Swapped ${tn(m[1]!, 'en')} for ${tn(m[2]!, 'en')}!`],
  [/^✅ 安装了 (.+)！$/, (m) => `✅ Installed ${tn(m[1]!, 'en')}!`],
  [
    /^❌ 没有空置槽位，必须替换现有模块$/,
    () => `❌ No empty slot — you must replace an existing module`,
  ],
  [/^🔮 牙行已无更多密语\.\.\.$/, () => `🔮 The brokers have no more whispers...`],
  [/^❌ 需要(\d+)金币才能购买消息$/, (m) => `❌ You need ${m[1]!} gold to buy intel`],
  [
    /^🗣️ 牙行密语：'来自(.+)的消息，对(.+)的需求很大！'$/,
    (m) =>
      `🗣️ Broker's Whisper: 'Word from ${tn(m[1]!, 'en')} — strong demand for ${tn(m[2]!, 'en')}!'`,
  ],
  [/^👥 雇佣了新工匠（(\w+)）$/, (m) => `👥 Hired a new artisan (${wName(m[1]!, 'en')})`],
  [/^❌ 资金不足，无法雇佣$/, () => `❌ Not enough gold to hire`],
  [
    /^💔 解雇了(\w+)，支付(\d+)金币$/,
    (m) => `💔 Dismissed a ${wName(m[1]!, 'en')} — ${m[2]!} gold severance paid`,
  ],
  [/^❌ 资金不足，无法解雇$/, () => `❌ Not enough gold to pay severance`],
  [/^❌ 材料不足，无法生产(.+)$/, (m) => `❌ Not enough materials to craft ${tn(m[1]!, 'en')}`],
  [/^📋 分配任务：生产(.+)$/, (m) => `📋 Task assigned: craft ${tn(m[1]!, 'en')}`],
  [/^❌ 所有工匠都在忙$/, () => `❌ All artisans are busy`],
  [/^⚠️ 工资不足，(\d+)金币$/, (m) => `⚠️ Cannot cover wages of ${m[1]!} gold`],
  [/^⚠️ 维护费不足，破产$/, () => `⚠️ Cannot cover upkeep — bankrupt`],
  [/^🛡️ 护航舰队已就位$/, () => `🛡️ Escort fleet is already in position`],
  [/^❌ 需要(\d+)金币才能雇佣护航$/, (m) => `❌ You need ${m[1]!} gold to hire an escort`],
  [/^🛡️ 雇佣护航，花费(\d+)金币$/, (m) => `🛡️ Hired an escort for ${m[1]!} gold`],
  [
    /^🛡️ 护航舰队震慑海盗，本程无损$/,
    () => `🛡️ Escort fleet deterred pirates, no losses this voyage`,
  ],
  [
    /^🏴‍☠️ 海盗袭扰，损失(\d+)金币（财富的(\d+)%）$/,
    (m) => `🏴‍☠️ Pirate raid: lost ${m[1]!} gold (${m[2]!}% of your wealth)`,
  ],
  [
    /^🕵️ 这名牙行形迹可疑，疑似走漏了你的行踪，本程海盗风险上升(\d+)%！$/,
    (m) =>
      `🕵️ This broker looked shifty and seems to have leaked your route. Pirate risk is up ${m[1]!}% this voyage.`,
  ],
  [/^🤝 互市成功！$/, () => `🤝 Barter complete!`],
  /* Sync waiting hints */
  [/^请点击“准备就绪”以进入工匠管理$/, () => `Click "Ready" to proceed to artisan management`],
  [/^等待对方也点击准备就绪\.\.\.$/, () => `Waiting for your partner to click Ready...`],
  [/^已准备，等待对方点击继续\.\.\.$/, () => `Ready — waiting for your partner to continue...`],
  /* System messages */
  [
    /^对方重新开始了游戏，双方进度已重置$/,
    () => `Your partner restarted the game — both voyages have been reset`,
  ],
  [
    /^需等待对方完成本局后才能重新起航$/,
    () => `You can set sail again once your partner finishes this game`,
  ],
  [
    /^❌ 对方拒绝了你的互市提案（出 (.+) ⇄ 换 (.+)）$/,
    (m) =>
      `❌ Your partner declined your barter offer (give ${lstNames(m[1]!)} ⇄ get ${lstNames(m[2]!)})`,
  ],
  [/^该邀请已失效$/, () => `That invitation has expired`],
  [/^对方已离线，邀请失效$/, () => `The other player went offline — invitation void`],
  [
    /^无法建立会话：其中一方已在游戏中$/,
    () => `Cannot start a session: one of you is already in a game`,
  ],
  [
    /^你还没有游戏伙伴，无法发送消息$/,
    () => `You don't have a partner yet, so messages can't be sent`,
  ],
  [/^对方已离线，无法发送消息$/, () => `Your partner is offline — message not sent`],
  /* Invite results */
  [/^无效的邀请对象$/, () => `Invalid invitation target`],
  [
    /^你已在游戏会话中，无法发出邀请$/,
    () => `You're already in a game session and can't send invitations`,
  ],
  [
    /^你已向 (.+) 发出邀请，请等待对方回应或超时$/,
    (m) => `You've already invited ${m[1]!} — wait for a response or timeout`,
  ],
  [
    /^每分钟只能发出一次邀请，请 (\d+) 秒后再试$/,
    (m) => `Only one invitation per minute — try again in ${m[1]!}s`,
  ],
  [/^(.+) 不在线，无法邀请$/, (m) => `${m[1]!} is offline and can't be invited`],
  [/^(.+) 正在游戏中，无法邀请$/, (m) => `${m[1]!} is in a game and can't be invited`],
  [
    /^邀请已发送给 (.+)，等待回应（(\d+) 秒内有效）$/,
    (m) => `Invitation sent to ${m[1]!} — awaiting response (valid for ${m[2]!}s)`,
  ],
  /* Register / Login */
  [/^用户名需为 3-20 个字符$/, () => `Username must be 3–20 characters`],
  [/^密码至少 6 位$/, () => `Password must be at least 6 characters`],
  [/^该用户名已被注册$/, () => `That username is already taken`],
  [/^注册成功，请登录$/, () => `Account created — please log in`],
  [/^用户名或密码错误$/, () => `Incorrect username or password`],
  [/^登录成功$/, () => `Logged in`],
  [/^该账号已在其他设备登录$/, () => `This account is already logged in on another device`],
  [/^请先登录$/, () => `Please log in first`],
];

// Replace canonical names in a string one by one with English (fallback path).
export function lstNames(s: string): string {
  const out = Object.keys(EN_NAMES).reduce((acc, k) => acc.split(k).join(EN_NAMES[k]!), s);
  return out.split('、').join(', ');
}

// Localize server text: translates display text sent by the server when the UI is in English.
export function lst(s: string, lang: Lang): string {
  if (lang !== 'en' || !s) return s;
  for (const [re, fn] of SERVER_TEXT_RULES) {
    const m = s.match(re);
    if (m) return fn(m);
  }
  return lstNames(s);
}

// Translate compound noun strings from server cards (e.g. "Hemp Cloth x2 + Silk x1") noun by
// noun.
export function tnames(s: string, lang: Lang): string {
  return lang === 'en' ? lstNames(s) : s;
}
