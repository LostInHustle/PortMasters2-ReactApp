import { BOONS } from '@pm2/shared';
import { boonDesc, boonName } from '../../i18n/boonModuleMonsoonText.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useWs } from '../../ws/WsContext.js';
import { PhaseBrief } from './PhaseBrief.js';

// Ported verbatim from PortMasters2/PortMasters_online.html boonDraftHTML (lines 2680-2703):
// the Navigator's Compass deals 4 random Fortunes independently per player, so the two captains
// see different sets.
export function FortunePhase() {
  const { tr, lang } = useTranslate();
  const { serverState } = useSession();
  const { send } = useWs();
  const g = serverState?.yourGame;
  if (!g) return null;
  const pool = g.boonChoices.length > 0 ? g.boonChoices : BOONS;
  const locked = Boolean(serverState?.youReady);

  return (
    <>
      <PhaseBrief
        phaseKey={5}
        extraChips={
          <span className="chip">
            {tr(
              '🧭 罗盘随机：双方各自抽到不同的4张',
              '🧭 Compass draw: each captain gets a different 4',
            )}
          </span>
        }
      />
      <div className="center-block">
        <div className="card-grid">
          {pool.map((b) => (
            <div className="boon-card" key={b.id}>
              <div className="boon-icon">{b.icon}</div>
              <div className="boon-name">{boonName(b, lang)}</div>
              <div className="boon-desc">{boonDesc(b, lang)}</div>
              <button
                className={`btn ${locked ? 'btn-grey' : 'btn-gold'} btn-lg`}
                disabled={locked}
                onClick={() => send({ action: 'selectBoon', boonId: b.id })}
                title={
                  locked
                    ? tr('本回合福缘已锁定', 'Your fortune is locked for this round')
                    : tr('锁定后本回合不可更换', 'Once locked, it cannot be changed this round')
                }
              >
                {locked ? tr('⏳ 已锁定', '⏳ Locked') : tr('🔒 锁定福缘', '🔒 Lock Fortune')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
