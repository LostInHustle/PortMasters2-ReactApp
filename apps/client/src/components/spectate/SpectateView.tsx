import { phaseName } from '../../i18n/phaseFlow.js';
import { lst } from '../../i18n/serverTextRules.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useSpectate } from '../../state/SpectateContext.js';
import { BuffChips, InventoryList, Modules, WorkerTeam } from '../panels/FleetCard.js';

// A read-only, live-updating view of another captain's fleet, kept in step with
// PortMasters2/PortMasters_online.html renderCaptainViewer. The name list on the left is always
// visible (even with just one other captain) so switching never requires closing the window;
// the detail pane on the right is what changes.
//
// The detail pane borrows the atomic pieces from FleetCard (BuffChips/InventoryList/Modules/
// WorkerTeam) but deliberately NOT the .status-section wrappers the 300px sidebar uses. Six
// equally weighted glass boxes side by side gave a scout no hierarchy, so the figures that
// decide whether a rival is a threat were no more prominent than their cargo list. Gold, renown
// and ship now lead as tiles, voyage progress reads as a track, and the rest are quiet panes.
export function SpectateView() {
  const { tr, lang } = useTranslate();
  const { serverState } = useSession();
  const { isSpectating, target, closeSpectate, setTarget } = useSpectate();

  if (!isSpectating) return null;
  const otherGames = serverState?.otherGames ?? {};
  const og = target ? otherGames[target] : undefined;
  if (!og || !target) return null;
  const others = serverState?.players.filter((p) => p.name in otherGames) ?? [];
  const online = others.find((p) => p.name === target)?.online ?? false;
  const recentLogs = og.logs.slice(-8).reverse();

  return (
    <div
      className="spectate-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSpectate();
      }}
    >
      <div className="spectate-window">
        <div className="spectate-head">
          <span className="sp-live">
            <span className="sp-live-dot" />
            LIVE
          </span>
          <div className="sp-title">
            {tr(`👀 ${target} 的商队`, `👀 ${target}'s Fleet`)}
            <div className="sp-sub">
              {tr(
                `第 ${og.currentRound} / ${og.maxRounds} 程 · ${phaseName(og.phase, lang)}阶段 · 只读视角，随其操作实时更新`,
                `Round ${og.currentRound} / ${og.maxRounds} · ${phaseName(og.phase, lang)} phase · read only, updates live`,
              )}
            </div>
          </div>
          {!online && <span className="chip amber">{tr('对方离线', 'Offline')}</span>}
          <button
            className="sp-close"
            onClick={closeSpectate}
            title={tr('关闭窗口（Esc）', 'Close window (Esc)')}
          >
            ×
          </button>
        </div>
        <div className="spectate-body">
          <div className="sp-names">
            {others.map((p) => (
              <div
                key={p.name}
                className={`sp-name-item ${p.name === target ? 'active' : ''}`}
                onClick={() => setTarget(p.name)}
              >
                <span className={`dot ${p.online ? 'on' : 'off'}`} />
                <span className="nm">
                  {p.name}
                  {p.isHost && ' 👑'}
                </span>
              </div>
            ))}
          </div>
          <div className="sp-detail">
            <div className="sp-hero">
              <div className="sp-tile gold">
                <div className="k">{tr('现金', 'Gold')}</div>
                <div className="v">💰 {og.money}</div>
              </div>
              <div className="sp-tile renown">
                <div className="k">{tr('声望', 'Renown')}</div>
                <div className="v">🏆 {og.score}</div>
              </div>
              <div className="sp-tile">
                <div className="k">{tr('商船', 'Flagship')}</div>
                <div className="v">
                  🚢 Lv.{og.shipLevel}
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-faint)' }}>
                    {' '}
                    {og.equippedModules.length}/{og.shipLevel}
                  </span>
                </div>
              </div>
            </div>
            <div className="sp-voyage">
              <span>
                {tr(
                  `第 ${og.currentRound} / ${og.maxRounds} 程`,
                  `Round ${og.currentRound} of ${og.maxRounds}`,
                )}
              </span>
              <span className="sp-track">
                <span
                  className="sp-track-fill"
                  style={{ width: `${Math.round((og.currentRound / og.maxRounds) * 100)}%` }}
                />
              </span>
              <span>{phaseName(og.phase, lang)}</span>
            </div>

            <div className="sp-pane">
              <h4>{tr('🪄 本回合增益', '🪄 Round Buffs')}</h4>
              <BuffChips g={og} />
            </div>

            <div className="sp-split">
              <div className="sp-pane">
                <h4>{tr('📦 船舱货物', '📦 Cargo Hold')}</h4>
                <InventoryList g={og} />
              </div>
              <div className="sp-pane">
                <h4>{tr('👥 工匠团队', '👥 Artisan Team')}</h4>
                <WorkerTeam g={og} />
              </div>
            </div>

            <div className="sp-pane">
              <h4>{tr('🚢 已装模块', '🚢 Installed Modules')}</h4>
              <Modules g={og} />
            </div>

            <div className="sp-pane">
              <h4>{tr('📜 近期动态 · 最新在前', '📜 Recent Activity · Newest first')}</h4>
              {recentLogs.length > 0 ? (
                recentLogs.map((m, i) => (
                  <div className="sp-feed-item" key={i}>
                    {lst(m, lang)}
                  </div>
                ))
              ) : (
                <span className="muted">{tr('暂无动态', 'Nothing yet')}</span>
              )}
            </div>
          </div>
        </div>
        <div className="spectate-foot">
          {tr(
            '💡 此窗口可随时关闭再打开；等待全员结束本局后即可一同重新起航。',
            '💡 Open or close this window any time. Once everyone else finishes their game, you can set sail together again.',
          )}
        </div>
      </div>
    </div>
  );
}
