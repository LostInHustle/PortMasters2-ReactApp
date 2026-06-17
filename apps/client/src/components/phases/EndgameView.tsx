import { ratingFor, ratingThresholdHint, ratingTiers } from '../../i18n/ratingTiers.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { Pm1Hint } from './Pm1Hint.js';
import { useConfirmRestart } from './useConfirmRestart.js';

// Ported verbatim from PortMasters2/PortMasters_online.html endgameHTML (lines 3321-3339).
export function EndgameView() {
  const { tr, lang } = useTranslate();
  const { serverState } = useSession();
  const confirmRestart = useConfirmRestart();
  const g = serverState?.yourGame;
  if (!g) return null;
  const rating = ratingFor(g.score, g.difficulty, lang);
  const firstTierMin = ratingTiers(g.difficulty)[1]!.min;

  return (
    <div className="center-block" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 70 }}>🎆</div>
      <div className="hero-title">{tr('全部航程完结！', 'All Voyages Complete!')}</div>
      <div
        className="section-box"
        style={{ maxWidth: 460, margin: '14px auto', textAlign: 'left' }}
      >
        <div className="stat-row" style={{ fontSize: 14 }}>
          <span>{tr('🏆 最终声望（信誉）', '🏆 Final renown')}</span>
          <strong>{g.score}</strong>
        </div>
        <div className="stat-row" style={{ fontSize: 14 }}>
          <span>{tr('💰 最终现金', '💰 Final gold')}</span>
          <strong>
            {g.money} {tr('金币', 'gold')}
          </strong>
        </div>
        <div className="stat-row" style={{ fontSize: 15 }}>
          <span>{tr('📈 商人评级', '📈 Merchant rating')}</span>
          <strong>{rating}</strong>
        </div>
        <div className="section-hint" style={{ marginTop: 8 }}>
          {tr('评级门槛：', 'Rating thresholds: ')}
          {ratingThresholdHint(g.difficulty, lang)}
        </div>
      </div>
      {g.score < firstTierMin && (
        <Pm1Hint
          context={tr('首航成绩不理想很正常！', 'A rough first voyage is completely normal!')}
        />
      )}
      <button
        className="btn btn-xl"
        onClick={confirmRestart}
        title={tr(
          '需等待对方也结束本局，双方进度将一同重置',
          'Requires your partner to finish too; both voyages reset together',
        )}
      >
        {tr('🔄 再启新航程', '🔄 Begin a New Voyage')}
      </button>
    </div>
  );
}
