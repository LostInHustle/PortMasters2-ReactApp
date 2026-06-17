import type { Difficulty } from '@pm2/shared';
import { useState } from 'react';
import { difficultyInfo } from '../../i18n/difficultyInfo.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useModal } from '../modal/ModalContext.js';
import { useSession } from '../../state/SessionContext.js';

const DIFFICULTIES: Difficulty[] = ['easy', 'standard', 'hard'];

// Ported verbatim from PortMasters2/PortMasters_online.html renderInviteComposer/
// setComposerDifficulty/confirmSendInvite (lines 2095-2153): always starts on Easy, so a
// voyage only becomes harder when the inviter explicitly asks for it. The original also runs a
// client-side 60s timer that clears the optimistic "pending" badge as a redundant safety net
// against a lost invite_timeout message; not ported, since lastInviteTo is already cleared
// reliably by the real invite_timeout/invite_rejected/invite_result handlers in
// SessionContext, making the extra timer dead weight rather than a real behavior difference.
export function InviteComposer({ to }: { to: string }) {
  const { tr, pf } = useTranslate();
  const { closeModal } = useModal();
  const { sendInvite } = useSession();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const info = difficultyInfo(difficulty);

  const confirm = () => {
    sendInvite(to, difficulty);
    closeModal();
  };

  return (
    <>
      <h2>{tr('📨 发出航程邀请', '📨 Send a Voyage Invitation')}</h2>
      <p style={{ textAlign: 'center', fontSize: 14, lineHeight: 1.8 }}>
        {tr(
          `你正在邀请 ${to} 共启一段航程。请先为本局选择难度，对方需要看到说明并同意后，航程才会开始。`,
          `You are inviting ${to} to set sail together. Choose the difficulty for this session first. The voyage begins only after your partner has read what it means and agrees to it.`,
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
          {tr('📨 发送邀请', '📨 Send Invitation')}
        </button>
        <button className="btn btn-ghost btn-lg" onClick={closeModal}>
          {tr('取消', 'Cancel')}
        </button>
      </div>
    </>
  );
}
