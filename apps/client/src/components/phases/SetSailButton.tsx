import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useWs } from '../../ws/WsContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html setSailButtonHTML
// (lines 2591-2598): the main Set Sail confirm button for both players; after confirming it
// switches to a waiting state so the click's effect is clear.
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
      title={tr('双方都点击后进入福缘抽取', 'The fortune draw begins once both captains confirm')}
    >
      {ready
        ? tr('⌛ 已确认，等待伙伴', '⌛ Confirmed, waiting for partner')
        : tr('🚢 扬帆起航', '🚢 Set Sail')}
      <span className="btn-sub">
        {tr('双方确认后抽取本程福缘', "Both confirm to draw this round's fortunes")}
      </span>
    </button>
  );
}
