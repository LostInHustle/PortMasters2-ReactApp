import type { Difficulty } from '@pm2/shared';
import { useState } from 'react';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useModal } from '../modal/ModalContext.js';
import { useSession } from '../../state/SessionContext.js';
import { DifficultyPicker } from './DifficultyPicker.js';

// Mirrors PortMasters2/PortMasters_online.html renderInviteComposer/
// setComposerDifficulty/confirmSendInvite: always starts on Easy, so a
// voyage only becomes harder when the inviter explicitly asks for it. The original also runs a
// on the client 60s timer that clears the optimistic "pending" badge as a redundant safety net
// against a lost invite_timeout message; not ported, since lastInviteTo is already cleared
// reliably by the real invite_timeout/invite_rejected/invite_result handlers in
// SessionContext, making the extra timer dead weight rather than a real behavior difference.
export function InviteComposer({ to }: { to: string }) {
  const { tr } = useTranslate();
  const { closeModal } = useModal();
  const { sendInvite } = useSession();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

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
          `You are inviting ${to} to set sail together. Choose the difficulty for this session first. The voyage begins only after the invited captain has read what it means and agrees to it.`,
        )}
      </p>
      <DifficultyPicker difficulty={difficulty} onChange={setDifficulty} />
      <div
        style={{
          textAlign: 'center',
          marginTop: 16,
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
        }}
      >
        <button className="btn btn-ghost btn-lg" onClick={closeModal}>
          {tr('取消', 'Cancel')}
        </button>
        <button className="btn btn-success btn-lg" onClick={confirm}>
          {tr('📨 发送邀请', '📨 Send Invitation')}
        </button>
      </div>
    </>
  );
}
