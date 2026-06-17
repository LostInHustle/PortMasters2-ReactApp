import { pm1Label, pm1Url } from '../../i18n/pm1Links.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { LangToggle } from '../layout/LangToggle.js';
import { useInviteReceivedModal } from './InviteReceivedModal.js';
import { OnlineUsersList } from './OnlineUsersList.js';

// Ported verbatim from PortMasters2/PortMasters_online.html's #lobby-overlay markup
// (lines 1241-1256) and applyLanguage's lobby section (lines 1775-1784). The language toggle
// (the original's btn-lang-lobby) lives here so players can switch in the lobby too.
export function LobbyOverlay() {
  const { tr, lang } = useTranslate();
  const { currentUser } = useSession();
  useInviteReceivedModal();

  return (
    <div id="lobby-overlay">
      <div className="lobby-box">
        <h2>{tr('🏠 游戏大厅', '🏠 Game Lobby')}</h2>
        <p className="lobby-sub">
          {tr('欢迎，', 'Welcome, ')}
          <strong>{currentUser}</strong>
          {tr('！邀请一名在线玩家即可开始', '! Invite any player online to begin a ')}
          <strong>{tr('双人共享航程', 'shared voyage for two')}</strong>
          {tr('：', ': ')}
          <br />
          {tr(
            '双方将始终处于同一回合、同一阶段，并可在互市阶段自由交易、全程互见彼此经营状况。',
            "you'll always be on the same round and phase, trade freely during Barter, and see each other's operations throughout.",
          )}
        </p>
        <div style={{ textAlign: 'center', margin: '4px 0' }}>
          <LangToggle className="btn btn-ghost" />
        </div>
        <div className="separator" />
        <h3 style={{ color: 'var(--ocean-900)', margin: '12px 0', fontSize: 15 }}>
          {tr('🧑‍✈️ 在线玩家', '🧑‍✈️ Players Online')}
        </h3>
        <div id="online-users-list">
          <OnlineUsersList />
        </div>
        <div className="pm-banner" style={{ marginTop: 18 }}>
          <span className="pm-icon">🧭</span>
          <span>
            <strong>{tr('新船长须知：', 'Note for new captains: ')}</strong>
            {tr(
              'PortMasters 2 的经济系统（增值税 / 所得税 / 工资 / 维护费）比一代更复杂。开局后可随时按 ',
              'the economy in PortMasters 2 (VAT / income tax / wages / upkeep) is more complex than the original. Press ',
            )}
            <span className="kbd">F1</span>
            {tr(
              ' 查看完整手册；若感到吃力，可先游玩 ',
              ' any time for the full manual, or warm up with ',
            )}
            <a href={pm1Url(lang)} target="_blank" rel="noopener noreferrer">
              {pm1Label(lang)}
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
