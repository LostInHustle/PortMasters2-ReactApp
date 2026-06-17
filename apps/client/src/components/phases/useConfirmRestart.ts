import { useTranslate } from '../../i18n/useTranslate.js';
import { useWs } from '../../ws/WsContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html confirmRestart (lines 3341-3345),
// shared by BankruptcyView and EndgameView exactly as in the original.
export function useConfirmRestart(): () => void {
  const { tr } = useTranslate();
  const { send } = useWs();
  return () => {
    const confirmed = window.confirm(
      tr(
        '重新起航将把双方的进度全部重置为第1程，确定继续吗？\n（需对方也已结束本局才会生效）',
        "Setting sail again resets both captains to Round 1. Continue?\n(Takes effect only once your partner's game is also over.)",
      ),
    );
    if (!confirmed) return;
    send({ action: 'restart' });
  };
}
