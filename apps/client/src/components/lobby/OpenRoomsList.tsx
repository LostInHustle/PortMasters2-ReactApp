import { difficultyInfo } from '../../i18n/difficultyInfo.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html renderOpenRooms (lines 2337-2356):
// the lobby's "browse open rooms" list, fed by open_rooms_update (roomManager.ts's
// broadcastOpenRooms). Every room that hasn't started yet shows up here for any online player to
// join, alongside the existing 1:1 invite flow in OnlineUsersList.
export function OpenRoomsList() {
  const { tr, pf } = useTranslate();
  const { openRooms, joinRoom, currentUser } = useSession();
  const joinable = openRooms.filter((r) => r.host !== currentUser);

  if (joinable.length === 0) {
    return (
      <p style={{ color: '#94a3b8', textAlign: 'center', padding: 24, fontSize: 13 }}>
        {tr(
          '🌊 暂无招募中的航程。点击上方按钮，招募一支属于你的船队。',
          '🌊 No open voyages right now. Use the button above to recruit your own crew.',
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
            <span
              className={`diff-badge diff-${r.difficulty}`}
              style={{ fontSize: 11, padding: '2px 10px' }}
            >
              {pf(difficultyInfo(r.difficulty).badge)}
            </span>
            <span className="muted" style={{ fontSize: 12 }}>
              {r.count} / {r.maxPlayers}
            </span>
          </span>
          <button
            className="btn btn-success"
            disabled={r.count >= r.maxPlayers}
            onClick={() => joinRoom(r.host)}
          >
            {tr('加入', '➕ Join')}
          </button>
        </div>
      ))}
    </div>
  );
}
