import { MIN_ROOM_PLAYERS } from '@pm2/shared';
import { difficultyInfo } from '../../i18n/difficultyInfo.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html renderRoomLobby (lines 2426-2453):
// shown in place of the online-users/open-voyages section once the player has created or joined
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
      <h3 style={{ color: 'var(--ocean-900)', margin: '12px 0', fontSize: 15 }}>
        {tr('🧑‍🤝‍🧑 等待出航', '🧑‍🤝‍🧑 Waiting to Sail')}
      </h3>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center', margin: '0 0 10px' }}>
        {tr(
          `难度 ${pf(difficultyInfo(room.difficulty).badge)} · 人数 ${room.players.length} / ${room.maxPlayers}`,
          `Difficulty ${pf(difficultyInfo(room.difficulty).badge)} · ${room.players.length} / ${room.maxPlayers} players`,
        )}
      </p>
      <div>
        {room.players.map((p) => (
          <div key={p.name} className="online-user-item">
            <span className="u-name">
              <span className={`dot ${p.online ? 'on' : 'off'}`} />
              {p.name}
              {p.isHost && ' 👑'}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
        {isHost && (
          <button
            className="btn btn-success btn-lg"
            disabled={!canStart}
            onClick={startRoom}
            title={canStart ? '' : tr('至少需要 2 名玩家', 'Needs at least 2 players')}
          >
            {tr('🚀 开始航程', '🚀 Start Voyage')}
          </button>
        )}
        <button className="btn btn-ghost btn-lg" onClick={leaveRoom}>
          {tr('离开房间', 'Leave Room')}
        </button>
      </div>
    </div>
  );
}
