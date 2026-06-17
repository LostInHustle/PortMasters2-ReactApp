import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useSpectate } from '../../state/SpectateContext.js';
import { Pm1Hint } from './Pm1Hint.js';
import { useConfirmRestart } from './useConfirmRestart.js';

// Ported verbatim from PortMasters2/PortMasters_online.html bankruptcyHTML (lines 3295-3319).
export function BankruptcyView() {
  const { tr } = useTranslate();
  const { serverState, chatPartner } = useSession();
  const confirmRestart = useConfirmRestart();
  const { openSpectate } = useSpectate();
  const g = serverState?.yourGame;
  const og = serverState?.otherGame;
  if (!g) return null;
  const name = serverState?.partnerName || chatPartner || tr('伙伴', 'Partner');
  const partnerPlaying = og && !og.gameOver;

  return (
    <div className="center-block" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80 }}>💥</div>
      <div
        className="hero-title"
        style={{ WebkitTextFillColor: 'initial', background: 'none', color: '#e11d48' }}
      >
        {tr('💥 船队破产', '💥 Fleet Bankrupt')}
      </div>
      <p style={{ color: 'var(--ink-soft)', margin: '8px 0' }}>
        {tr(
          '现金无法覆盖工资或维护费，商队被迫清算。',
          'Your gold could not cover wages or upkeep — the fleet has been liquidated.',
        )}
      </p>
      <div className="section-box" style={{ maxWidth: 420, margin: '14px auto' }}>
        <div className="stat-row" style={{ fontSize: 14 }}>
          <span>{tr('最终现金', 'Final gold')}</span>
          <strong>
            {g.money} {tr('金币', 'gold')}
          </strong>
        </div>
        <div className="stat-row" style={{ fontSize: 14 }}>
          <span>{tr('最终声望', 'Final renown')}</span>
          <strong>{g.score}</strong>
        </div>
      </div>
      <Pm1Hint
        context={tr(
          '破产并不可怕——多半是工资与维护费规划失衡。',
          "Bankruptcy isn't the end — it usually comes down to wage and upkeep planning.",
        )}
      />
      <p style={{ color: 'var(--ink-soft)', margin: '8px 0' }}>
        {tr(
          `本局已结束，需等待 ${name} 完成或结束比赛后才能重新起航。`,
          `Your game is over. Once ${name} finishes their voyage, you can both set sail again.`,
        )}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          className="btn btn-lg"
          onClick={confirmRestart}
          title={tr(
            '需等待对方也结束本局，双方进度将一同重置',
            'Requires your partner to finish too; both voyages reset together',
          )}
        >
          {tr('🔄 重新起航', '🔄 Set Sail Again')}
        </button>
        {partnerPlaying && (
          <button
            className="btn btn-lg btn-ghost"
            onClick={openSpectate}
            title={tr(
              '在独立窗口中实时观看伙伴的航程',
              "Watch your partner's voyage live in its own window",
            )}
          >
            {tr('👀 打开观战窗口', '👀 Open Spectator Window')}
          </button>
        )}
      </div>
    </div>
  );
}
