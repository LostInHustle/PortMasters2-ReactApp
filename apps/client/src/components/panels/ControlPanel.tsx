import { useLayoutEffect, useState } from 'react';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useConfirmRestart } from '../phases/useConfirmRestart.js';

const COLLAPSE_KEY = 'pm2_controls_collapsed';

function readControlsCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

// Mirrors PortMasters2/PortMasters_online.html renderControls:
// the bar is a status strip, not a second copy of the stage. The manual lives in the
// header, the phase action sits on its phase card, and the game over restart sits on
// the stage.
export function ControlPanel() {
  const { tr } = useTranslate();
  const { currentUser, serverState } = useSession();
  const confirmRestart = useConfirmRestart();
  const g = serverState?.yourGame;
  const isHost = serverState?.host === currentUser;
  const [collapsed, setCollapsed] = useState(readControlsCollapsed);

  useLayoutEffect(() => {
    document.getElementById('control-panel')?.classList.toggle('collapsed', collapsed);
  }, [collapsed]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // A blocked storage area just means the choice will not survive a reload.
      }
      return next;
    });
  };

  const toggleTitle = collapsed
    ? tr('展开操作栏', 'Expand the action bar')
    : tr('收起操作栏', 'Collapse the action bar');
  const collapseToggle = (
    <button
      className="btn btn-ghost control-toggle"
      onClick={toggleCollapsed}
      aria-expanded={!collapsed}
      aria-controls="control-panel"
      aria-label={toggleTitle}
      title={toggleTitle}
    >
      {collapsed ? '▴' : '▾'}
    </button>
  );

  if (!g || g.gameOver) {
    const isBankrupt = g?.bankrupt;
    const partnerPlaying = Object.values(serverState?.otherGames ?? {}).some((og) => !og.gameOver);
    return (
      <>
        <span className="sync-chip">
          {isBankrupt
            ? tr('💥 船队破产', '💥 Fleet Bankrupt')
            : tr('🏁 本局已结束', '🏁 Game Over')}
        </span>
        {partnerPlaying && (
          <span className="control-hint">
            {tr(
              '💡 还有同行仍在航行中，可打开观战窗口实时围观',
              '💡 Others are still sailing. Open the spectator window to watch live',
            )}
          </span>
        )}
        <div className="control-spacer" />
        {collapseToggle}
      </>
    );
  }

  const readyCount = serverState?.phaseReadyCount ?? 0;
  let hint = '';

  switch (g.phase) {
    case 0:
      hint = serverState?.youReady
        ? tr('等待其他船长确认后进入福缘抽取', 'Waiting for the others to confirm')
        : tr('所有船长都确认后进入福缘抽取', 'Fortune draw begins once everyone confirms');
      break;
    case 5:
      hint = tr('请在上方卡片中选择并锁定一项福缘', 'Pick and lock one fortune card above');
      break;
    case 1:
      hint = tr(
        '采购完成后确认，全员就绪即进入互市',
        'Confirm when done buying. Barter starts when everyone is ready',
      );
      break;
    case 'trade':
      hint = tr(
        '在互市界面发布/响应交易，谈妥后点「准备就绪」',
        'Post or answer offers above, then click Ready when trades are settled',
      );
      break;
    case 'worker_mgmt':
      hint = tr('雇佣并指派任务后确认', 'Hire and assign tasks, then confirm');
      break;
    case 2:
      hint = tr('交付订单后确认，进入结算', 'Deliver your orders, then confirm to enter Upkeep');
      break;
    case 3:
      hint = tr('支付后等待其他船长完成结算', 'After paying, wait for the others to settle');
      break;
    case 4:
      hint = tr(
        '可先升级商船，再结束本回合',
        'Upgrade your ship first if you like, then end the round',
      );
      break;
  }

  return (
    <>
      <span
        className="sync-chip"
        title={tr('全员确认后才进入下一阶段', 'The next phase starts once everyone confirms')}
      >
        {tr(
          `🔄 全员就绪 ${readyCount} / ${serverState?.phaseTotalCount ?? 0}`,
          `🔄 Ready ${readyCount} / ${serverState?.phaseTotalCount ?? 0}`,
        )}
      </span>
      <span className="control-hint">💡 {hint}</span>
      <div className="control-spacer" />
      {isHost && (
        <button
          className="btn btn-ghost control-secondary"
          onClick={confirmRestart}
          title={tr(
            '立即开启全新一局，全员进度重置，难度保持不变',
            "Start a brand new voyage now, resetting everyone's progress at the same difficulty",
          )}
        >
          {tr('🔄 重新起航', '🔄 Set Sail Again')}
        </button>
      )}
      {collapseToggle}
    </>
  );
}
