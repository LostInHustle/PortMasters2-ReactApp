import { difficultyInfo } from '../../i18n/difficultyInfo.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';

// New: the lobby's "browse open rooms" list, fed by open_rooms_update (roomManager.ts's
// broadcastOpenRooms). Every room that hasn't started yet shows up here for any online player to
// join, alongside the existing 1:1 invite flow in OnlineUsersList.
export function OpenRoomsList() {
  const { tr, pf } = useTranslate();
  const { openRooms, joinRoom, currentUser } = useSession();
  const joinable = openRooms.filter((r) => r.host !== currentUser);

  if (joinable.length === 0) {
    return (
      <p className="muted">
        {tr(
          '🌊 暂无可加入的房间。创建一个房间，邀请其他船长自由加入吧。',
          '🌊 No open rooms right now. Create one and let other captains join freely.',
        )}
      </p>
    );
  }

  return (
    <div>
      {joinable.map((r) => (
        <div key={r.host} className="online-user-item">
          <span className="u-name">
            <span className="dot on" />
            {r.host}
            <span className={`chip diff-${r.difficulty}`} style={{ marginLeft: 6 }}>
              {pf(difficultyInfo(r.difficulty).badge)}
            </span>
            <span className="muted" style={{ marginLeft: 6 }}>
              {r.count}/{r.maxPlayers}
            </span>
          </span>
          <button
            className="btn btn-success"
            disabled={r.count >= r.maxPlayers}
            onClick={() => joinRoom(r.host)}
          >
            {tr('🚪 加入', '🚪 Join')}
          </button>
        </div>
      ))}
    </div>
  );
}
