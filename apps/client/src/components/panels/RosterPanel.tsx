import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useSpectate } from '../../state/SpectateContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html rosterWidgetHTML/renderRoster
// (lines 2746-2806): with up to 5 captains in a room, the side panel can no longer show one
// fleet in full -- instead each fellow captain collapses to a single-row card (online dot, host
// crown, gold, renown, bankrupt/finished chip), and clicking it opens the shared Captain Viewer
// (SpectateView, via SpectateContext) for full detail. Replaces PartnerPanel.
export function RosterPanel() {
  const { tr } = useTranslate();
  const { serverState } = useSession();
  const { openSpectate } = useSpectate();
  const otherGames = serverState?.otherGames ?? {};
  const others = (serverState?.players ?? []).filter((p) => p.name in otherGames);

  if (others.length === 0) {
    return (
      <div className="panel side-panel" id="roster-panel">
        <div className="crew-head partner">
          <div className="avatar">🧑‍✈️</div>
          <div className="who">
            <div className="nm">{tr('等待同行...', 'Waiting for others...')}</div>
            <div className="role">{tr('同行船队', 'Fellow Captains')}</div>
          </div>
          <span className="dot off" />
        </div>
        <p className="muted" style={{ padding: '8px 2px', lineHeight: 1.8 }}>
          {tr(
            '进入共享会话后，这里会列出同行的每位船长，点击即可在独立窗口中查看声望、存款、货物、工匠与增益，方便协商互市。',
            "Once you're in a shared session, every other captain shows up here. Click one to open a window with their renown, gold, cargo, artisans and buffs, handy for negotiating trades.",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="panel side-panel" id="roster-panel">
      <div className="crew-head partner">
        <div className="avatar">🧑‍✈️</div>
        <div className="who">
          <div className="nm">{tr('同行船队', 'Fellow Captains')}</div>
          <div className="role">
            {tr(`共 ${others.length} 位船长`, `${others.length} other captain(s)`)}
          </div>
        </div>
      </div>
      {others.map((p) => {
        const og = otherGames[p.name]!;
        const statusChip = og.bankrupt ? (
          <span className="chip" style={{ background: 'var(--grad-danger)', color: '#fff' }}>
            {tr('💥 破产', '💥 Bankrupt')}
          </span>
        ) : og.gameOver ? (
          <span className="chip amber">{tr('已结束', 'Finished')}</span>
        ) : null;
        return (
          <div className="roster-widget" key={p.name}>
            <div
              className="roster-widget-head"
              onClick={() => openSpectate(p.name)}
              title={tr('查看完整信息', 'View full info')}
            >
              <span
                className={`dot ${p.online ? 'on' : 'off'}`}
                title={p.online ? tr('在线', 'Online') : tr('离线', 'Offline')}
              />
              <span className="nm">
                {p.name}
                {p.isHost && ' 👑'}
              </span>
              <span className="roster-widget-stats">
                <span className="stat-money">💰 {og.money}</span>
                <span className="stat-score">🏆 {og.score}</span>
                {statusChip}
              </span>
              <span className="roster-toggle">🔍</span>
            </div>
          </div>
        );
      })}
      <div
        className="status-section"
        style={{ background: 'linear-gradient(135deg,rgba(56,189,248,.08),rgba(20,184,166,.08))' }}
      >
        <span className="muted">
          {tr('💡 看准同行缺什么、富余什么，在', '💡 Spot what a fellow captain lacks or has in surplus, then strike a deal during ')}
          <strong>{tr('互市阶段', 'Barter')}</strong>
          {tr('发起互利交易，或随时点右上角 💬 沟通。', ', or hit 💬 up top to talk it over.')}
        </span>
      </div>
    </div>
  );
}
