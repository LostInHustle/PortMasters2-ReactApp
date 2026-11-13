import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useSpectate } from '../../state/SpectateContext.js';
import { Pm1Hint } from './Pm1Hint.js';
import { useConfirmRestart } from './useConfirmRestart.js';

// Mirrors PortMasters2/PortMasters_online.html bankruptcyHTML.
export function BankruptcyView() {
  const { tr } = useTranslate();
  const { currentUser, serverState } = useSession();
  const confirmRestart = useConfirmRestart();
  const { openSpectate } = useSpectate();
  const g = serverState?.yourGame;
  const others = Object.values(serverState?.otherGames ?? {});
  if (!g) return null;
  const partnerPlaying = others.some((og) => !og.gameOver);
  const isHost = serverState?.host === currentUser;

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
          '现金无法覆盖工资或维护费，船队被迫清算。',
          'Your gold could not cover wages or upkeep, so the fleet has been liquidated.',
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
          '破产并不可怕，多半是工资与维护费规划失衡。',
          "Bankruptcy isn't the end. It usually comes down to wage and upkeep planning.",
        )}
      />
      <p style={{ color: 'var(--ink-soft)', margin: '8px 0' }}>
        {isHost
          ? tr(
              '本局已结束。你是房主，可随时重新起航，开启全新一局。',
              'Your game is over. As the host, you can set sail again at any time for a brand new voyage.',
            )
          : tr(
              '本局已结束，需等待其他玩家全部完成或结束比赛后才能重新起航。',
              'Your game is over. Once everyone else finishes their voyage, you can all set sail again.',
            )}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
        {partnerPlaying && (
          <button
            className="btn btn-lg btn-ghost"
            onClick={() => openSpectate()}
            title={tr(
              '在独立窗口中实时观看同行的航程',
              "Watch a fellow captain's voyage live in its own window",
            )}
          >
            {tr('👀 打开观战窗口', '👀 Open Spectator Window')}
          </button>
        )}
        <button
          className="btn btn-lg"
          onClick={confirmRestart}
          title={
            isHost
              ? tr(
                  '立即为全员开启全新一局，难度保持不变',
                  'Starts a brand new voyage for everyone right away at the same difficulty',
                )
              : tr(
                  '需等待其他船长也结束本局，所有人的进度将一同重置',
                  'Requires every other captain to finish too; everyone resets together',
                )
          }
        >
          {tr('🔄 重新起航', '🔄 Set Sail Again')}
        </button>
      </div>
    </div>
  );
}
