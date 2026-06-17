import { useEffect } from 'react';
import { difficultyInfo } from '../../i18n/difficultyInfo.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useModal } from '../modal/ModalContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html showInviteModal/respondInvite
// (lines 2155-2186): shown through the same generic modal system as the manual and the invite
// composer, not as a permanent lobby fixture. The effect's cleanup closes the modal whenever
// pendingInviteFrom clears for any reason (accepted, declined, or the original sender's
// invite_cancelled arriving), without ever touching a modal opened for something unrelated.
export function useInviteReceivedModal(): void {
  const { pendingInviteFrom } = useSession();
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    if (!pendingInviteFrom) return;
    openModal(
      <InviteReceivedContent
        from={pendingInviteFrom.from}
        difficulty={pendingInviteFrom.difficulty}
      />,
    );
    return () => closeModal();
  }, [pendingInviteFrom, openModal, closeModal]);
}

function InviteReceivedContent({
  from,
  difficulty,
}: {
  from: string;
  difficulty: Parameters<typeof difficultyInfo>[0];
}) {
  const { tr, pf } = useTranslate();
  const { respondInvite } = useSession();
  const info = difficultyInfo(difficulty);

  return (
    <>
      <h2>{tr('📨 航程邀请', '📨 Voyage Invitation')}</h2>
      <p>
        {tr(
          `${from} 邀请你共启一段海上丝路航程，并为本局提议了以下难度。请先了解它的含义，再决定是否同意。`,
          `${from} invites you to set sail on the Maritime Silk Road together and proposes the following difficulty for this session. Please read what it means before you decide whether to agree.`,
        )}
      </p>
      <div className="diff-options">
        <div className={`diff-option selected diff-${info.key}`} style={{ cursor: 'default' }}>
          <span className={`diff-badge diff-${info.key}`}>{pf(info.badge)}</span>
          <span className="diff-tagline">{pf(info.tagline)}</span>
        </div>
      </div>
      <div className="diff-summary">{pf(info.summary)}</div>
      <p className="muted">
        {tr(
          '接受后双方将进入共享会话，始终停留在同一回合与同一阶段，可以自由互市交易，并能随时查看彼此的船队状态。如果你更想换一种难度，可以先婉拒，再由任意一方按心仪的难度重新发出邀请。',
          "Accept to enter a shared session where you both stay on the same round and the same phase, barter freely, and can check each other's fleet at any time. If you would prefer a different difficulty, decline for now and either of you can send a fresh invitation set to the level you both want.",
        )}
      </p>
      <div
        style={{
          textAlign: 'center',
          marginTop: 14,
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
        }}
      >
        <button className="btn btn-success btn-lg" onClick={() => respondInvite(true)}>
          {tr('✅ 同意并接受', '✅ Agree and Accept')}
        </button>
        <button className="btn btn-danger btn-lg" onClick={() => respondInvite(false)}>
          {tr('❌ 婉拒', '❌ Decline')}
        </button>
      </div>
    </>
  );
}
