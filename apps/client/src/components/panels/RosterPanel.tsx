import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useSpectate } from '../../state/SpectateContext.js';

// Generalizes PortMasters2/PortMasters_online.html's renderPartner (lines 2451-2494) into the
// prototype's later roster widget: with up to 5 captains in a room, the side panel can no longer
// show one fleet in full -- instead each fellow captain collapses to a single row (online dot,
// host crown, gold, renown, bankrupt/finished chip), and clicking it opens the shared Captain
// Viewer (SpectateView, via SpectateContext) for full detail. Replaces PartnerPanel.
export function RosterPanel() {
  const { tr } = useTranslate();
  const { serverState } = useSession();
  const { openSpectate } = useSpectate();
  const otherGames = serverState?.otherGames ?? {};
  const otherNames = Object.keys(otherGames);

  if (otherNames.length === 0) {
    return (
      <div className="panel side-panel" id="roster-panel">
        <div className="crew-head partner">
          <div className="avatar">🧑‍✈️</div>
          <div className="who">
            <div className="nm">{tr('伙伴', 'Fellow Captains')}</div>
            <div className="role">{tr('其他船长', "Other captains' fleets")}</div>
          </div>
        </div>
        <p className="muted" style={{ padding: '8px 2px', lineHeight: 1.8 }}>
          {tr(
            '进入共享会话后，这里会列出每位船长，实时展示其声望、存款与破产状态，点击可查看详情。',
            "Once you're in a shared session, every captain shows up here with live gold, renown and bankrupt status -- click one for full detail.",
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
          <div className="nm">{tr('其他船长', 'Fellow Captains')}</div>
          <div className="role">
            {tr(`共 ${otherNames.length} 位`, `${otherNames.length} other captain(s)`)}
          </div>
        </div>
      </div>
      {otherNames.map((name) => {
        const og = otherGames[name]!;
        const roster = serverState!.players.find((p) => p.name === name);
        return (
          <div
            className="roster-widget-head"
            key={name}
            onClick={() => openSpectate(name)}
            title={tr('点击查看详情', 'Click for details')}
          >
            <span className={`dot ${roster?.online ? 'on' : 'off'}`} />
            <span className="roster-widget-name">
              {roster?.isHost && '👑 '}
              {name}
            </span>
            <span className="roster-widget-stats">
              <span className="stat-money" style={{ fontSize: 12 }}>
                💰 {og.money}
              </span>
              <span className="stat-score" style={{ fontSize: 12 }}>
                🏆 {og.score}
              </span>
              {og.bankrupt ? (
                <span className="chip red">{tr('💥 已破产', '💥 Bankrupt')}</span>
              ) : og.gameOver ? (
                <span className="chip amber">{tr('已结束', 'Finished')}</span>
              ) : null}
            </span>
          </div>
        );
      })}
      <div
        className="status-section"
        style={{ background: 'linear-gradient(135deg,rgba(56,189,248,.08),rgba(20,184,166,.08))' }}
      >
        <span className="muted">
          {tr(
            '💡 点击任意一位船长可查看其完整航海详情；互市阶段可与任意人发起互利交易，或随时点右上角 💬 沟通。',
            "💡 Click any captain to see their full voyage details; trade freely with anyone during Barter, or hit 💬 up top to talk it over.",
          )}
        </span>
      </div>
    </div>
  );
}
