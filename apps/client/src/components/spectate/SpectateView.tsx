import { phaseName } from '../../i18n/phaseFlow.js';
import { lst } from '../../i18n/serverTextRules.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useSpectate } from '../../state/SpectateContext.js';
import { BuffChips, InventoryList, Modules, WorkerTeam } from '../panels/FleetCard.js';

// Ported verbatim from PortMasters2/PortMasters_online.html renderSpectate (lines 3232-3293):
// a read-only, live-updating view of the partner's fleet, reusing the same fleet-card pieces as
// the status/partner panels rather than duplicating their markup.
export function SpectateView() {
  const { tr, lang } = useTranslate();
  const { serverState, chatPartner, partnerOnline } = useSession();
  const { isSpectating, closeSpectate } = useSpectate();

  if (!isSpectating) return null;
  const og = serverState?.otherGame;
  if (!og) return null;
  const name = serverState?.partnerName || chatPartner || tr('伙伴', 'Partner');
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
            {tr(`👀 观战 · ${name} 的商队`, `👀 Spectating ${name}'s Fleet`)}
            <div className="sp-sub">
              {tr(
                `第 ${og.currentRound} / ${og.maxRounds} 程 · ${phaseName(og.phase, lang)}阶段 · 只读视角，随对方操作实时更新`,
                `Round ${og.currentRound} / ${og.maxRounds} · ${phaseName(og.phase, lang)} phase · read-only, updates live`,
              )}
            </div>
          </div>
          {!partnerOnline && <span className="chip amber">{tr('对方离线', 'Offline')}</span>}
          <button
            className="sp-close"
            onClick={closeSpectate}
            title={tr('关闭观战窗口（Esc）', 'Close spectator window (Esc)')}
          >
            ×
          </button>
        </div>
        <div className="spectate-body">
          <div className="sp-col">
            <div className="status-section">
              <h3>{tr('📊 航海概况', '📊 Voyage Overview')}</h3>
              <div className="stat-row">
                <span>{tr('🌊 航程进度', '🌊 Voyage')}</span>
                <span className="stat-value">
                  {tr(
                    `第 ${og.currentRound} / ${og.maxRounds} 程`,
                    `Round ${og.currentRound} / ${og.maxRounds}`,
                  )}
                </span>
              </div>
              <div className="stat-row">
                <span>{tr('🧭 当前阶段', '🧭 Phase')}</span>
                <span className="stat-value">{phaseName(og.phase, lang)}</span>
              </div>
              <div className="stat-row">
                <span>{tr('💰 现金存款', '💰 Gold')}</span>
                <span className="stat-money">
                  {og.money} {tr('金币', 'gold')}
                </span>
              </div>
              <div className="stat-row">
                <span>{tr('🏆 声望（信誉）', '🏆 Renown')}</span>
                <span className="stat-score">{og.score}</span>
              </div>
            </div>
            <div className="status-section">
              <h3>{tr('🪄 本回合增益', '🪄 Round Buffs')}</h3>
              <BuffChips g={og} />
            </div>
            <div className="status-section">
              <h3>{tr('🚢 旗舰状态', '🚢 Flagship')}</h3>
              <div className="stat-row">
                <span>{tr('商船等级', 'Ship level')}</span>
                <span className="stat-value">Lv.{og.shipLevel}</span>
              </div>
              <div className="stat-row">
                <span>{tr('模块槽位', 'Module slots')}</span>
                <span className="stat-value">
                  {og.equippedModules.length} / {og.shipLevel}
                </span>
              </div>
              <div style={{ marginTop: 4 }}>
                <Modules g={og} />
              </div>
            </div>
          </div>
          <div className="sp-col">
            <div className="status-section">
              <h3>{tr('📦 船舱货物', '📦 Cargo Hold')}</h3>
              <InventoryList g={og} />
            </div>
            <div className="status-section">
              <h3>{tr('👥 工匠团队', '👥 Artisan Team')}</h3>
              <WorkerTeam g={og} />
            </div>
          </div>
          <div className="status-section sp-wide">
            <h3>{tr('📜 近期动态（最新在前）', '📜 Recent Activity (newest first)')}</h3>
            {recentLogs.length > 0 ? (
              recentLogs.map((m, i) => (
                <div
                  className="stat-row"
                  style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}
                  key={i}
                >
                  {lst(m, lang)}
                </div>
              ))
            ) : (
              <span className="muted">{tr('暂无动态', 'Nothing yet')}</span>
            )}
          </div>
        </div>
        <div className="spectate-foot">
          {tr(
            '💡 此窗口可随时关闭再打开；等待对方结束本局后即可一同重新起航。',
            '💡 Open or close this window any time. Once your partner finishes their game, you can set sail together again.',
          )}
        </div>
      </div>
    </div>
  );
}
