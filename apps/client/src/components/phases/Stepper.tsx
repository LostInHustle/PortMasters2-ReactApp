import type { Phase } from '@pm2/shared';
import { PHASE_FLOW } from '../../i18n/phaseFlow.js';
import { useTranslate } from '../../i18n/useTranslate.js';

const PHASE_INDEX = new Map<Phase, number>(PHASE_FLOW.map((p, i) => [p.key, i]));

// Ported verbatim from PortMasters2/PortMasters_online.html stepperHTML (lines 2497-2513).
export function Stepper({ currentKey }: { currentKey: Phase }) {
  const { tr, pf } = useTranslate();
  const curIdx =
    currentKey === 'endgame' || currentKey === 'bankruptcy'
      ? PHASE_FLOW.length
      : (PHASE_INDEX.get(currentKey) ?? -1);

  return (
    <div
      className="stepper"
      title={tr(
        '本回合流程：双方同步经过这8个阶段',
        'Round flow: both captains move through these 8 phases in sync',
      )}
    >
      {PHASE_FLOW.map((s, i) => {
        const cls = i < curIdx ? 'done' : i === curIdx ? 'current' : '';
        return (
          <div className={`step ${cls}`} key={s.key}>
            <div className="bubble">{i < curIdx ? '✓' : s.icon}</div>
            <div className="lbl">{pf(s.name)}</div>
          </div>
        );
      })}
    </div>
  );
}
