import { MIN_ROOM_PLAYERS } from '@pm2/shared';
import { difficultyInfo } from '../../i18n/difficultyInfo.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { MateNote } from '../common/MateNote.js';
import { Medal } from '../common/Medal.js';

// Ported verbatim from PortMasters2/PortMasters_online.html renderRoomLobby (lines 2426-2453):
// shown in place of the online-users/open-voyages section once the player has created or joined
// a room that hasn't started yet. Per the user's decision, the roster only changes here, once
// the host clicks Start, it freezes for the rest of the voyage.
export function RoomLobbyView() {
  const { tr, pf } = useTranslate();
  const { room, currentUser, leaveRoom, startRoom } = useSession();
  if (!room) return null;
  const isHost = room.host === currentUser;
  const canStart = room.players.length >= MIN_ROOM_PLAYERS;
  const openSeats = room.maxPlayers - room.players.length;

  return (
    <div>
      <h3 style={{ color: 'var(--ocean-900)', margin: '12px 0', fontSize: 15 }}>
        {tr('🧑‍🤝‍🧑 等待出航', '🧑‍🤝‍🧑 Waiting to Sail')}
      </h3>
      <p
        style={{ fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center', margin: '0 0 10px' }}
      >
        {tr(
          `难度 ${pf(difficultyInfo(room.difficulty).badge)} · 人数 ${room.players.length} / ${room.maxPlayers}`,
          `Difficulty ${pf(difficultyInfo(room.difficulty).badge)}, ${room.players.length} / ${room.maxPlayers} players`,
        )}
      </p>
      <div>
        {room.players.map((p) => (
          <div key={p.name} className="online-user-item">
            <span className="u-name">
              <Medal name={p.name} small />
              {p.name}
              {p.isHost && ' 👑'}
              <span className={`dot ${p.online ? 'on' : 'off'}`} />
            </span>
          </div>
        ))}
      </div>
      <MateNote>
        {!isHost
          ? tr(
              '船长，等房主开始航程，我们就出航。',
              'We sail as soon as the host starts the voyage, Captain.',
            )
          : !canStart
            ? tr(
                '船长，至少需要 2 名玩家才能开始航程，我们再等等。',
                'The voyage needs at least 2 players, Captain. Let us wait a little longer.',
              )
            : openSeats <= 0
              ? tr(
                  '船长，全员到齐，可以开始航程了。',
                  'Every seat is taken, Captain. We are ready to start the voyage.',
                )
              : tr(
                  `船长，已有 ${room.players.length} 名玩家登船，还空着 ${openSeats} 个位置。可以再等等，也可以现在就开始航程，由你定夺。`,
                  `${room.players.length} players are aboard and ${openSeats === 1 ? '1 seat is' : `${openSeats} seats are`} still open, Captain. We can wait, or start the voyage now. Your call.`,
                )}
      </MateNote>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
        <button className="btn btn-ghost btn-lg" onClick={leaveRoom}>
          {tr('离开房间', 'Leave Room')}
        </button>
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
      </div>
    </div>
  );
}
