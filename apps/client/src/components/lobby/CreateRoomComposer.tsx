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

// Ported verbatim from PortMasters2/PortMasters_online.html renderHostComposer (lines
// 2376-2399): difficulty is chosen first (same picker as the 1:1 InviteComposer), then room
// size as a second, narrower row of plain number buttons below it.
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
      <h2>{tr('🧑‍🤝‍🧑 招募船队', '🧑‍🤝‍🧑 Host a Voyage')}</h2>
      <p style={{ textAlign: 'center', fontSize: 14, lineHeight: 1.8 }}>
        {tr(
          '设置房间人数上限与难度。其他在线玩家可随时加入或离开，凑够 2 人后，你可以随时开始航程。',
          "Set the room size and difficulty. Other online players can join or leave freely, and once at least 2 are in, you can start the voyage whenever you're ready.",
        )}
      </p>
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
      <p style={{ textAlign: 'center', fontSize: 13, margin: '14px 0 0' }}>
        {tr('房间人数上限', 'Max room size')}
      </p>
      <div className="diff-options" style={{ maxWidth: 280, margin: '8px auto 0' }}>
        {PLAYER_COUNTS.map((n) => (
          <button
            type="button"
            key={n}
            className={`diff-option ${maxPlayers === n ? 'selected' : ''}`}
            style={{ padding: 10 }}
            onClick={() => setMaxPlayers(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div
        style={{
          textAlign: 'center',
          marginTop: 16,
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
        }}
      >
        <button className="btn btn-gold btn-lg" onClick={confirm}>
          {tr('📨 创建房间', '📨 Create Room')}
        </button>
        <button className="btn btn-ghost btn-lg" onClick={closeModal}>
          {tr('取消', 'Cancel')}
        </button>
      </div>
    </>
  );
}
