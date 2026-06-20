import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useLogout } from '../../state/useLogout.js';
import { useOpenManual } from '../manual/ManualModal.js';
import { LangToggle } from './LangToggle.js';

// Ported verbatim from PortMasters2/PortMasters_online.html's .header markup (lines 1191-1206)
// and applyLanguage's header section (lines 1751-1757) / logout() (lines 1930-1935).
export function Header() {
  const { tr } = useTranslate();
  const { currentUser, toggleChat, serverState, voteEndSession } = useSession();
  const openManual = useOpenManual();
  const logout = useLogout();

  // Ported verbatim from PortMasters2/PortMasters_online.html confirmEndSession/
  // renderEndSessionButton (lines 3668-3692): each captain votes to disband the room and return
  // everyone to the lobby (sessionActions.ts's end_session action). Every player must explicitly
  // vote, so the button keeps showing the live count even after this player has clicked it --
  // a vote invisible to everyone but the voter isn't really a consensus mechanism.
  const confirmEndSession = () => {
    if (serverState?.youVotedEnd) return;
    const confirmed = window.confirm(
      tr(
        '结束会话将使全员返回大厅，且无法恢复本局进度。需所有玩家都同意才会生效，确定要发起吗？',
        "Ending the session sends everyone back to the lobby, and this voyage can't be resumed. It only takes effect once every player agrees. Propose it now?",
      ),
    );
    if (!confirmed) return;
    voteEndSession();
  };

  return (
    <div className="header">
      <div className="brand">
        <span className="logo">⚓</span>
        <div>
          <h1>
            PortMasters<span className="gen-badge">2</span>
          </h1>
          <div className="subtitle">
            {tr(
              '海上丝绸之路 · 双人联机贸易战略：采购 · 互市 · 生产 · 远航',
              'Maritime Silk Road · 2-Player Co-op Trading: Procure · Barter · Produce · Voyage',
            )}
          </div>
        </div>
      </div>
      <div className="header-actions">
        {currentUser && <span className="me-chip">{currentUser}</span>}
        <LangToggle />
        <button
          className="btn btn-ghost"
          onClick={() => openManual()}
          title={tr('打开游戏手册（快捷键 F1）', 'Open the game manual (F1)')}
        >
          {tr('📖 手册', '📖 Manual')}
        </button>
        <button
          className="btn btn-ghost"
          onClick={toggleChat}
          title={tr('与其他船长聊天', 'Chat with your fellow captains')}
        >
          {tr('💬 聊天', '💬 Chat')}
        </button>
        {serverState && (
          <button
            className="btn btn-warning"
            disabled={serverState.youVotedEnd}
            onClick={confirmEndSession}
            title={
              serverState.youVotedEnd
                ? tr(
                    '已同意结束，等待其他玩家',
                    "You've agreed to end the session; waiting on everyone else",
                  )
                : tr(
                    '提议结束本局并返回大厅，需全员同意',
                    'Propose ending this session and returning to the lobby; everyone must agree',
                  )
            }
          >
            {serverState.youVotedEnd
              ? tr(
                  `⏳ 等待同意 (${serverState.endSessionVotes}/${serverState.endSessionTotal})`,
                  `⏳ Waiting for agreement (${serverState.endSessionVotes}/${serverState.endSessionTotal})`,
                )
              : serverState.endSessionVotes > 0
                ? tr(
                    `🚪 结束会话 (${serverState.endSessionVotes}/${serverState.endSessionTotal} 已同意)`,
                    `🚪 End Session (${serverState.endSessionVotes}/${serverState.endSessionTotal} agreed)`,
                  )
                : tr('🚪 结束会话', '🚪 End Session')}
          </button>
        )}
        <button
          className="btn btn-ghost"
          onClick={logout}
          title={tr('退出登录并返回登录页', 'Log out and return to the login page')}
        >
          {tr('🚪 退出', '🚪 Log Out')}
        </button>
      </div>
    </div>
  );
}
