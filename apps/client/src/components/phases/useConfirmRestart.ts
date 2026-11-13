import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useWs } from '../../ws/WsContext.js';

// Mirrors PortMasters2/PortMasters_online.html confirmRestart, shared by BankruptcyView,
// EndgameView and the live control bar's restart control. The host may restart at any time;
// everyone else only once every other game is over.
export function useConfirmRestart(): () => void {
  const { tr } = useTranslate();
  const { currentUser, serverState } = useSession();
  const { send } = useWs();
  const isHost = serverState?.host === currentUser;
  return () => {
    const confirmed = window.confirm(
      isHost
        ? tr(
            '重新起航会立即为全员开启全新一局，所有进度重置为第 1 回合，难度保持不变。确定继续吗？',
            'Setting sail again immediately starts a brand new voyage for everyone, resetting all progress to Round 1 at the same difficulty. Continue?',
          )
        : tr(
            '重新起航将把全员的进度都重置为第 1 回合，确定继续吗？\n（需其他玩家也已结束本局才会生效）',
            "Setting sail again resets everyone to Round 1. Continue?\n(Takes effect only once every other player's game is also over.)",
          ),
    );
    if (!confirmed) return;
    send({ action: 'restart' });
  };
}
