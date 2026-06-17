export interface CharterEvent {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

// Ported verbatim from PortMasters2/server.py CHARTER_EVENTS (lines 190-203).
// Keyed by the content tier (1 or 2) it announces — see unlocked()/charter_event() in the
// Python source, ported to apps/server/src/game/difficultyRules.ts and poolSelectors.ts.
export const CHARTER_EVENTS: Record<1 | 2, CharterEvent> = {
  1: {
    id: 'tier1',
    icon: '🗺️',
    name: '市舶新政',
    desc: '福建市舶司新政颁布！瓷土、铜矿、青瓷器、紫铜镜加入行情；福州港、高丽港正式开埠；陶匠与铜匠加入劳务市场；新的福缘与战船改装随之而来。',
  },
  2: {
    id: 'tier2',
    icon: '🌏',
    name: '万国通商',
    desc: '万国通商盛况空前！香料、珍珠、蕃香脂、珠链加入行情；三佛齐港、大食港正式开埠；香料师与珠宝匠加入劳务市场；更多福缘与战船改装随之而来。',
  },
};
