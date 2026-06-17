import type { Difficulty } from '@pm2/shared';
import type { Bilingual } from './LangContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html DIFFICULTY_INFO (lines 1295-1323),
// restructured from lang-dependent closures (badge: () => tr(...)) into plain bilingual data,
// since `tr` now takes an explicit lang parameter instead of reading a module-global -- the
// content itself (every zh/en string) is unchanged.
export interface DifficultyInfo {
  key: Difficulty;
  badge: Bilingual;
  tagline: Bilingual;
  summary: Bilingual;
}

export const DIFFICULTY_INFO: Record<Difficulty, DifficultyInfo> = {
  easy: {
    key: 'easy',
    badge: { zh: '轻松', en: 'Easy' },
    tagline: { zh: '适合初次掌舵的新船长', en: 'A gentle start for new captains' },
    summary: {
      zh: '轻松模式是一段较短的航程，共 8 个回合，让贸易保持简单清晰。你将专注经营麻布、丝绸、茶叶这三种基础原料，制作四种入门成品，并从前三类工匠中招募帮手。与之相关的福缘、战船模块、港口以及海上天象也都限定在这套基础内容之内，因此市场始终不会过度拥挤，你有充足的余裕慢慢熟悉每个回合的节奏，从容地把生意做大。',
      en: 'Easy mode is a shorter voyage of 8 rounds that keeps the trade simple and clear to follow. You will focus on the three founding raw materials of hemp cloth, silk and tea, craft the four starter products, and recruit from the first three artisan guilds. The fortunes, ship modules, ports and seasonal weather that belong to them stay within this founding set as well, so the market never grows crowded and you have plenty of room to learn the rhythm of each round and grow your trade at a comfortable pace.',
    },
  },
  standard: {
    key: 'standard',
    badge: { zh: '标准', en: 'Standard' },
    tagline: { zh: '进阶船长的均衡阶梯', en: 'A balanced step up for rising captains' },
    summary: {
      zh: '标准模式是轻松与高难之间的阶梯，共 12 个回合，同样开放完整的海上贸易，但不会出现暗通海盗的牙行。丝路特许会在第四程引入瓷土与铜矿，在第八程引入香料与珍珠，让你在更紧凑的节奏里体验完整的货物、港口与工匠，海盗的威胁也比轻松模式更明显。适合已经熟悉基础玩法、想要更多挑战，又不愿一上来就投入高难长局的船长。',
      en: 'Standard mode is the rung between Easy and Hard: a 12-round voyage that also opens the full maritime trade, but without the brokers who tip off pirates. The Silk Road Charter brings in porcelain clay and copper ore at round four and spices and pearls at round eight, so you get the complete set of goods, ports and artisans at a brisker pace, with pirates that bite a little harder than on Easy. It suits captains who know the basics and want a real challenge without committing to the long Hard voyage straight away.',
    },
  },
  hard: {
    key: 'hard',
    badge: { zh: '高难', en: 'Hard' },
    tagline: { zh: '为老练船长准备的完整挑战', en: 'The full challenge for seasoned captains' },
    summary: {
      zh: '高难模式是一段更长的航程，共 16 个回合，并开放完整的海上贸易。前五程仍像轻松模式一样从容，随后丝路特许会在第六程引入瓷土与铜矿，并在第十程引入香料与珍珠，连同它们的进阶成品、海外港口、专精工匠，以及更加丰富的福缘、战船模块与海上天象。需要同时打理的事务多得多，对舱位与金币的竞争也会激烈许多，因此它更看重你长远的谋划与权衡。',
      en: 'Hard mode is a longer voyage of 16 rounds that opens the full maritime trade. The first five rounds stay as relaxed as easy mode, then the Silk Road Charter brings in porcelain clay and copper ore at round six and spices and pearls at round ten, together with their advanced products, the foreign ports, the specialist artisans, and a much richer set of fortunes, ship modules and seasonal weather. There is a great deal more to manage at once and the competition for cargo space and coin grows far fiercer, so it rewards careful long term planning and judgement.',
    },
  },
};

export function difficultyInfo(key: Difficulty): DifficultyInfo {
  return DIFFICULTY_INFO[key] ?? DIFFICULTY_INFO.easy;
}
