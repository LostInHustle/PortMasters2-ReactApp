import type { Phase } from '@pm2/shared';
import { PHASE_FLOW, phaseIndexOf } from '../../i18n/phaseFlow.js';
import { useTranslate } from '../../i18n/useTranslate.js';

// Mirrors PortMasters2/PortMasters_online.html stepperHTML.
export function Stepper({ currentKey }: { currentKey: Phase }) {
  const { tr, pf } = useTranslate();
  const curIdx =
    currentKey === 'endgame' || currentKey === 'bankruptcy'
      ? PHASE_FLOW.length
      : (phaseIndexOf(currentKey) ?? -1);

  return (
    <div
      className="stepper"
      title={tr(
        '本回合流程：全员同步经过这8个阶段',
        'Round flow: everyone moves through these 8 phases in sync',
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
