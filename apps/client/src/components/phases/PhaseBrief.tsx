import type { Phase } from '@pm2/shared';
import type { ReactNode } from 'react';
import { PHASE_FLOW } from '../../i18n/phaseFlow.js';
import { lst } from '../../i18n/serverTextRules.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { DifficultyChip } from './DifficultyChip.js';

const PHASE_META = new Map(PHASE_FLOW.map((p) => [p.key, p]));

// Ported verbatim from PortMasters2/PortMasters_online.html phaseBriefHTML (lines 2522-2542).
export function PhaseBrief({ phaseKey, extraChips }: { phaseKey: Phase; extraChips?: ReactNode }) {
  const { tr, pf, lang } = useTranslate();
  const { serverState } = useSession();
  const meta = PHASE_META.get(phaseKey);
  if (!meta || !serverState) return null;
  const readyCount = serverState.phaseReadyCount;
  const waiting = serverState.waitingForOther;

  return (
    <div className="phase-brief">
      <div className="pb-icon">{meta.icon}</div>
      <div className="pb-text">
        <h2>
          {tr(
            `${pf(meta.name)}阶段 · 第 ${serverState.yourGame.currentRound} 程`,
            `${pf(meta.name)} Phase · Round ${serverState.yourGame.currentRound}`,
          )}
        </h2>
        <p>{pf(meta.brief)}</p>
      </div>
      <div className="pb-sync">
        <DifficultyChip difficulty={serverState.yourGame.difficulty} />
        <span
          className={`chip ${readyCount >= 2 ? 'green' : ''}`}
          title={tr(
            '双方都确认后才进入下一阶段',
            'The next phase starts once both captains confirm',
          )}
        >
          {tr(`🔄 双方就绪 ${readyCount} / 2`, `🔄 Ready ${readyCount} / 2`)}
        </span>
        {waiting && <span className="chip amber">⏳ {lst(waiting, lang)}</span>}
        {extraChips}
      </div>
    </div>
  );
}
