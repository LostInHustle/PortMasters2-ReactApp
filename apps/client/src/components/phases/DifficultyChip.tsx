import type { Difficulty } from '@pm2/shared';
import { difficultyInfo } from '../../i18n/difficultyInfo.js';
import { useTranslate } from '../../i18n/useTranslate.js';

// Ported verbatim from PortMasters2/PortMasters_online.html difficultyChipHTML
// (lines 2517-2520): an always-visible reminder of the agreed difficulty.
export function DifficultyChip({ difficulty }: { difficulty: Difficulty }) {
  const { tr, pf } = useTranslate();
  const info = difficultyInfo(difficulty);
  return (
    <span className={`chip diff-${info.key}`} title={pf(info.summary)}>
      {tr('难度', 'Difficulty')}：{pf(info.badge)}
    </span>
  );
}
