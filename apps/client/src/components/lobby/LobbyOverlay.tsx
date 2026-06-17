import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { InviteReceivedPrompt } from './InviteReceivedPrompt.js';
import { OnlineUsersList } from './OnlineUsersList.js';

// Ported from PortMasters2/PortMasters_online.html's lobby section of applyLanguage
// (lines 1775-1784) and renderOnlineUsers (lines 2064-2093).
export function LobbyOverlay() {
  const { tr } = useTranslate();
  const { currentUser } = useSession();

  return (
    <div className="lobby-overlay">
      <h1>{tr('🏠 游戏大厅', '🏠 Game Lobby')}</h1>
      <p>
        {tr(
          `欢迎，${currentUser}！邀请一名在线玩家即可开始双人共享航程：双方将始终处于同一回合、同一阶段，并可在互市阶段自由交易、全程互见彼此经营状况。`,
          `Welcome, ${currentUser}! Invite any player online to begin a shared two-captain voyage: you'll always be on the same round and phase, trade freely during Barter, and see each other's operations throughout.`,
        )}
      </p>
      <h2>{tr('🧑‍✈️ 在线玩家', '🧑‍✈️ Players Online')}</h2>
      <OnlineUsersList />
      <InviteReceivedPrompt />
    </div>
  );
}
