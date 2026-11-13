import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useWs } from '../../ws/WsContext.js';

// Mirrors PortMasters2/PortMasters_online.html setSailButtonHTML: the main Set Sail confirm
// button for every captain. After confirming it switches to a waiting state so the click's
// effect is clear.
export function SetSailButton() {
  const { tr } = useTranslate();
  const { serverState } = useSession();
  const { send } = useWs();
  const ready = Boolean(serverState?.youReady);

  return (
    <button
      className={`btn ${ready ? 'btn-grey' : 'btn-success'} btn-xl`}
      disabled={ready}
      onClick={() => send({ action: 'startBoon' })}
      title={tr('全员都点击后进入福缘抽取', 'The fortune draw begins once everyone confirms')}
    >
      {ready
        ? tr('⌛ 已确认，等待其他船长', '⌛ Confirmed, waiting for others')
        : tr('🚢 扬帆起航', '🚢 Set Sail')}
      <span className="btn-sub">
        {tr('全员确认后抽取本回合福缘', "Everyone confirms to draw this round's fortunes")}
      </span>
    </button>
  );
}
