import { MIN_ROOM_PLAYERS } from '@pm2/shared';
import { difficultyInfo } from '../../i18n/difficultyInfo.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';

// New: shown in place of the online-users/invite section once the player has created or joined
// a room that hasn't started yet. Per the user's decision, the roster only changes here -- once
// the host clicks Start, it freezes for the rest of the voyage.
export function RoomLobbyView() {
  const { tr, pf } = useTranslate();
  const { room, currentUser, leaveRoom, startRoom } = useSession();
  if (!room) return null;
  const isHost = room.host === currentUser;
  const canStart = room.players.length >= MIN_ROOM_PLAYERS;

  return (
    <div>
      <h3 style={{ color: 'var(--ocean-900)', margin: '4px 0 12px', fontSize: 15 }}>
        {tr('🧭 房间', '🧭 Room')} · {room.host}
        <span className={`chip diff-${room.difficulty}`} style={{ marginLeft: 8 }}>
          {pf(difficultyInfo(room.difficulty).badge)}
        </span>
      </h3>
      <div>
        {room.players.map((p) => (
          <div key={p.name} className="online-user-item">
            <span className="u-name">
              <span className={`dot ${p.online ? 'on' : 'off'}`} />
              {p.isHost && '👑 '}
              {p.name}
              {p.name === currentUser && tr('（我）', ' (you)')}
            </span>
          </div>
        ))}
        {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
          <div key={`empty-${i}`} className="online-user-item muted">
            <span className="u-name">
              <span className="dot off" />
              {tr('空位，等待加入...', 'Open seat, waiting for a captain...')}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
        {isHost && (
          <button
            className="btn btn-success btn-lg"
            disabled={!canStart}
            onClick={startRoom}
            title={
              canStart
                ? tr('开始航程，房间名额将冻结', 'Start the voyage; the roster freezes')
                : tr(`至少需要 ${MIN_ROOM_PLAYERS} 名船长`, `Needs at least ${MIN_ROOM_PLAYERS} captains`)
            }
          >
            {tr('🚀 开始航程', '🚀 Start Voyage')}
          </button>
        )}
        <button className="btn btn-ghost btn-lg" onClick={leaveRoom}>
          {tr('🚪 离开房间', '🚪 Leave Room')}
        </button>
      </div>
    </div>
  );
}
