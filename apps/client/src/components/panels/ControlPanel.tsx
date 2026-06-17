import type { ReactNode } from 'react';
import { useConfirmRestart } from '../phases/useConfirmRestart.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useWs } from '../../ws/WsContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html renderControls (lines 3348-3401):
// the bottom action bar's primary call-to-action and hint, one per phase. openSpectate/
// showManual are part of Phase 7 and aren't wired up yet.
export function ControlPanel() {
  const { tr } = useTranslate();
  const { serverState } = useSession();
  const { send } = useWs();
  const confirmRestart = useConfirmRestart();
  const g = serverState?.yourGame;

  if (!g || g.gameOver) {
    const isBankrupt = g?.bankrupt;
    const partnerPlaying = serverState?.otherGame && !serverState.otherGame.gameOver;
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
              '💡 伙伴仍在航行中，可打开观战窗口实时围观',
              '💡 Your partner is still sailing — open the spectator window to watch live',
            )}
          </span>
        )}
        <div className="control-spacer" />
        {isBankrupt && partnerPlaying && (
          <button className="btn btn-ghost">{tr('👀 观战伙伴', '👀 Spectate Partner')}</button>
        )}
        <button className="btn btn-danger" onClick={confirmRestart}>
          {tr('🔄 重新起航', '🔄 Set Sail Again')}
        </button>
        <button className="btn btn-ghost">{tr('📖 手册', '📖 Manual')}</button>
      </>
    );
  }

  const readyCount = serverState?.phaseReadyCount ?? 0;
  let primary: ReactNode = null;
  let hint = '';

  switch (g.phase) {
    case 0:
      primary = serverState?.youReady ? (
        <button className="btn btn-grey btn-lg" disabled>
          {tr('⌛ 已确认，等待伙伴', '⌛ Confirmed — waiting for partner')}
        </button>
      ) : (
        <button className="btn btn-success btn-lg" onClick={() => send({ action: 'startBoon' })}>
          {tr('🧭 扬帆起航，抽取福缘', '🧭 Set Sail & Draw Fortunes')}
        </button>
      );
      hint = serverState?.youReady
        ? tr('等待对方确认后进入福缘抽取', 'Waiting for your partner to confirm')
        : tr('双方都确认后进入福缘抽取', 'Fortune draw begins once both confirm');
      break;
    case 5:
      hint = tr('请在上方卡片中选择并锁定一项福缘', 'Pick and lock one fortune card above');
      break;
    case 1:
      primary = (
        <button className="btn btn-lg" onClick={() => send({ action: 'ready_for_next_phase' })}>
          {tr('✅ 完成采购', '✅ Done Procuring')}
        </button>
      );
      hint = tr(
        '采购完成后确认，双方就绪即进入互市',
        'Confirm when done buying — Barter starts when both are ready',
      );
      break;
    case 'trade':
      hint = tr(
        '在互市界面发布/响应交易，谈妥后点「准备就绪」',
        'Post or answer offers above, then click Ready when trades are settled',
      );
      break;
    case 'worker_mgmt':
      primary = (
        <button className="btn btn-lg" onClick={() => send({ action: 'ready_for_next_phase' })}>
          {tr('✅ 完成工匠管理', '✅ Done Managing')}
        </button>
      );
      hint = tr('雇佣并指派任务后确认', 'Hire and assign tasks, then confirm');
      break;
    case 2:
      primary = (
        <button className="btn btn-lg" onClick={() => send({ action: 'ready_for_next_phase' })}>
          {tr('✅ 完成交易', '✅ Done Trading')}
        </button>
      );
      hint = tr('交付订单后确认，进入结算', 'Deliver your orders, then confirm to enter Upkeep');
      break;
    case 3:
      primary = (
        <button
          className="btn btn-warning btn-lg"
          onClick={() => send({ action: 'doMaintenance' })}
        >
          {tr('💸 支付维护费', '💸 Pay Upkeep')}
        </button>
      );
      hint = tr('支付后等待对方完成结算', 'After paying, wait for your partner to settle');
      break;
    case 4:
      primary = (
        <button
          className="btn btn-success btn-lg"
          onClick={() => send({ action: 'ready_for_next_phase' })}
        >
          {tr('⏭️ 结束航程', '⏭️ End Voyage')}
        </button>
      );
      hint = tr(
        '可先升级商船，再结束本航程',
        'Upgrade your ship first if you like, then end the voyage',
      );
      break;
  }

  return (
    <>
      <span
        className="sync-chip"
        title={tr(
          '双方都确认后才会进入下一阶段',
          'The next phase starts once both captains confirm',
        )}
      >
        {tr(`🔄 双方就绪 ${readyCount} / 2`, `🔄 Ready ${readyCount} / 2`)}
      </span>
      <span className="control-hint">💡 {hint}</span>
      <div className="control-spacer" />
      {primary}
      <button className="btn btn-ghost" title={tr('快捷键 F1', 'Shortcut: F1')}>
        {tr('📖 手册', '📖 Manual')}
      </button>
    </>
  );
}
