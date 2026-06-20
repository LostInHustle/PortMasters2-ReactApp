import { pm1Label, pm1Url } from '../../i18n/pm1Links.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useLogout } from '../../state/useLogout.js';
import { LangToggle } from '../layout/LangToggle.js';
import { useModal } from '../modal/ModalContext.js';
import { CreateRoomComposer } from './CreateRoomComposer.js';
import { useInviteReceivedModal } from './InviteReceivedModal.js';
import { OnlineUsersList } from './OnlineUsersList.js';
import { OpenRoomsList } from './OpenRoomsList.js';
import { RoomLobbyView } from './RoomLobbyView.js';

// Ported verbatim from PortMasters2/PortMasters_online.html's #lobby-overlay markup
// (lines 1309-1331) and applyLanguage's lobby section (lines 1877-1887): #room-browse-view
// (online players, then open voyages with the host button inline on that heading's row) versus
// #room-waiting-view (RoomLobbyView) once pendingRoom is set. The language toggle and logout
// button share one row right under the welcome text, both ported verbatim from btn-lang-lobby/
// btn-logout-lobby.
export function LobbyOverlay() {
  const { tr, lang } = useTranslate();
  const { currentUser, room } = useSession();
  const { openModal } = useModal();
  const logout = useLogout();
  useInviteReceivedModal();

  return (
    <div id="lobby-overlay">
      <div className="lobby-box">
        <h2>{tr('🏠 游戏大厅', '🏠 Game Lobby')}</h2>
        <p className="lobby-sub">
          {tr('欢迎，', 'Welcome, ')}
          <strong>{currentUser}</strong>
          {tr(
            '！邀请一名在线玩家即可开始双人共享航程，或招募一支 2-5 人的船队：',
            '! Invite a player for a two-captain voyage, or host a room and recruit a 2-5 player crew:',
          )}
          <br />
          {tr(
            '全员将始终处于同一回合、同一阶段，并可在互市阶段自由交易、全程互见彼此经营状况。',
            "everyone stays on the same round and phase, trades freely during Barter, and sees each other's operations throughout.",
          )}
        </p>
        <div
          style={{
            textAlign: 'center',
            margin: '4px 0',
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          <LangToggle className="btn btn-ghost" />
          <button
            className="btn btn-ghost"
            onClick={logout}
            title={tr('退出登录并返回登录页', 'Log out and return to the login page')}
          >
            {tr('🚪 退出', '🚪 Log Out')}
          </button>
        </div>
        <div className="separator" />

        {room ? (
          <RoomLobbyView />
        ) : (
          <>
            <h3 style={{ color: 'var(--ocean-900)', margin: '12px 0', fontSize: 15 }}>
              {tr('🧑‍✈️ 在线玩家', '🧑‍✈️ Players Online')}
            </h3>
            <div id="online-users-list">
              <OnlineUsersList />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: '18px 0 8px',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <h3 style={{ color: 'var(--ocean-900)', margin: 0, fontSize: 15 }}>
                {tr('🧑‍🤝‍🧑 招募中的航程', '🧑‍🤝‍🧑 Open Voyages')}
              </h3>
              <button
                className="btn btn-gold"
                onClick={() => openModal(<CreateRoomComposer />)}
                title={tr(
                  '创建一个 2-5 人的房间，其他玩家可自由加入',
                  'Create a 2-5 player room that others can freely join',
                )}
              >
                {tr('➕ 招募船队', '➕ Host a Voyage')}
              </button>
            </div>
            <div id="open-rooms-list">
              <OpenRoomsList />
            </div>
          </>
        )}

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
