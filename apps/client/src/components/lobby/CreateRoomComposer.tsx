import { MAX_ROOM_PLAYERS, MIN_ROOM_PLAYERS, type Difficulty } from '@pm2/shared';
import { useState } from 'react';
import { difficultyInfo } from '../../i18n/difficultyInfo.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useModal } from '../modal/ModalContext.js';

const DIFFICULTIES: Difficulty[] = ['easy', 'standard', 'hard'];
const PLAYER_COUNTS = Array.from(
  { length: MAX_ROOM_PLAYERS - MIN_ROOM_PLAYERS + 1 },
  (_, i) => MIN_ROOM_PLAYERS + i,
);

// New: the recruit flow's room-creation modal, mirroring InviteComposer.tsx's difficulty picker
// (PortMasters2/PortMasters_online.html renderInviteComposer, lines 2095-2153) but adding a
// player-count stepper since a room (unlike the 1:1 invite) seats 2-5 captains who join freely
// before the host starts the voyage.
export function CreateRoomComposer() {
  const { tr, pf } = useTranslate();
  const { closeModal } = useModal();
  const { createRoom } = useSession();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const info = difficultyInfo(difficulty);

  const confirm = () => {
    createRoom(maxPlayers, difficulty);
    closeModal();
  };

  return (
    <>
      <h2>{tr('🧭 招募船队', '🧭 Recruit a Crew')}</h2>
      <p style={{ textAlign: 'center', fontSize: 14, lineHeight: 1.8 }}>
        {tr(
          '创建一个房间，其他船长可以自由加入或离开；满意人数后由你点击「开始航程」。',
          'Create a room that other captains can freely join or leave; once the roster looks good, you start the voyage.',
        )}
      </p>
      <div style={{ textAlign: 'center', margin: '10px 0' }}>
        <div className="muted" style={{ marginBottom: 6 }}>
          {tr('船长人数', 'Number of captains')}
        </div>
        <div className="diff-options">
          {PLAYER_COUNTS.map((n) => (
            <button
              type="button"
              key={n}
              className={`diff-option ${maxPlayers === n ? 'selected' : ''}`}
              onClick={() => setMaxPlayers(n)}
            >
              <span className="diff-badge">{n}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="diff-options">
        {DIFFICULTIES.map((key) => {
          const optionInfo = difficultyInfo(key);
          return (
            <button
              type="button"
              key={key}
              className={`diff-option ${difficulty === key ? 'selected' : ''}`}
              onClick={() => setDifficulty(key)}
            >
              <span className={`diff-badge diff-${key}`}>{pf(optionInfo.badge)}</span>
              <span className="diff-tagline">{pf(optionInfo.tagline)}</span>
            </button>
          );
        })}
      </div>
      <div className="diff-summary">{pf(info.summary)}</div>
      <div
        style={{
          textAlign: 'center',
          marginTop: 16,
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
        }}
      >
        <button className="btn btn-success btn-lg" onClick={confirm}>
          {tr('🧭 创建房间', '🧭 Create Room')}
        </button>
        <button className="btn btn-ghost btn-lg" onClick={closeModal}>
          {tr('取消', 'Cancel')}
        </button>
      </div>
    </>
  );
}
