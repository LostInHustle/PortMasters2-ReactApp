import { lst } from '../../i18n/serverTextRules.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { CrewSections } from './FleetCard.js';

// Ported verbatim from PortMasters2/PortMasters_online.html renderPartner (lines 2451-2494):
// both players' states are fully visible to each other, to help negotiate trades.
export function PartnerPanel() {
  const { tr, lang } = useTranslate();
  const { chatPartner, partnerOnline, serverState } = useSession();
  const og = serverState?.otherGame;
  const name = serverState?.partnerName || chatPartner || tr('伙伴', 'Partner');

  if (!og) {
    return (
      <div className="panel side-panel" id="partner-panel">
        <div className="crew-head partner">
          <div className="avatar">🧑‍✈️</div>
          <div className="who">
            <div className="nm">{tr('等待伙伴...', 'Waiting for partner...')}</div>
            <div className="role">{tr('伙伴商队', "Partner's fleet")}</div>
          </div>
          <span className="dot off" />
        </div>
        <p className="muted" style={{ padding: '8px 2px', lineHeight: 1.8 }}>
          {tr(
            '进入共享会话后，这里会实时展示伙伴的声望、存款、货物、工匠与增益，方便协商互市。',
            "Once you're in a shared session, this panel shows your partner's renown, gold, cargo, artisans and buffs in real time — handy for negotiating trades.",
          )}
        </p>
      </div>
    );
  }

  const recentLogs = og.logs.slice(-4);
  const statusSuffix = og.bankrupt
    ? tr(' · 💥已破产', ' · 💥 Bankrupt')
    : og.gameOver
      ? tr(' · 已结束', ' · Finished')
      : '';

  return (
    <div className="panel side-panel" id="partner-panel">
      <div className="crew-head partner">
        <div className="avatar">🧑‍✈️</div>
        <div className="who">
          <div className="nm">{name}</div>
          <div className="role">
            {tr('伙伴商队', "Partner's fleet")} · {og.slot ? tr('玩家', 'Player ') + og.slot : ''}
            {statusSuffix}
          </div>
        </div>
        <span
          className={`dot ${partnerOnline ? 'on' : 'off'}`}
          title={partnerOnline ? tr('在线', 'Online') : tr('离线', 'Offline')}
        />
        {!partnerOnline && (
          <span className="chip amber" style={{ marginLeft: 4 }}>
            {tr('离线', 'Offline')}
          </span>
        )}
      </div>
      <CrewSections g={og} />
      <div className="status-section">
        <h3>{tr('📜 对方近期动态', '📜 Recent Activity')}</h3>
        {recentLogs.length > 0 ? (
          recentLogs.map((m, i) => (
            <div className="stat-row" style={{ fontSize: 11, color: 'var(--ink-soft)' }} key={i}>
              {lst(m, lang)}
            </div>
          ))
        ) : (
          <span className="muted">{tr('暂无动态', 'Nothing yet')}</span>
        )}
      </div>
      <div
        className="status-section"
        style={{ background: 'linear-gradient(135deg,rgba(56,189,248,.08),rgba(20,184,166,.08))' }}
      >
        <span className="muted">
          {tr(
            '💡 看准对方缺什么、富余什么，在互市阶段发起互利交易，或随时点右上角 💬 沟通。',
            '💡 Spot what your partner lacks or has in surplus, then strike a deal during Barter — or hit 💬 up top to talk it over.',
          )}
        </span>
      </div>
    </div>
  );
}
