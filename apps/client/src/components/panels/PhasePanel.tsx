import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { ArtisansPhase } from '../phases/ArtisansPhase.js';
import { BankruptcyView } from '../phases/BankruptcyView.js';
import { BarterPhase } from '../phases/BarterPhase.js';
import { EndgameView } from '../phases/EndgameView.js';
import { FortunePhase } from '../phases/FortunePhase.js';
import { ProcurePhase } from '../phases/ProcurePhase.js';
import { SetSailPhase } from '../phases/SetSailPhase.js';
import { ShipyardPhase } from '../phases/ShipyardPhase.js';
import { Stepper } from '../phases/Stepper.js';
import { TradePhase } from '../phases/TradePhase.js';
import { UpkeepPhase } from '../phases/UpkeepPhase.js';

// Ported verbatim from PortMasters2/PortMasters_online.html renderPhase (lines 2560-2587): the
// stepper plus one phase-specific view, switched on g.phase. A bankrupt player always stays on
// the bankruptcy page even if the server sends a different phase value (the original's
// defensive `g.bankrupt ? 'bankruptcy' : g.phase`). captureTradeForm/restoreTradeForm and manual
// scroll-position preservation aren't ported -- React keeps each phase component mounted and
// preserves its own state and scroll position across re-renders for free.
export function PhasePanel() {
  const { tr } = useTranslate();
  const { serverState } = useSession();
  const g = serverState?.yourGame;
  if (!g) return null;
  const phase = g.bankrupt ? 'bankruptcy' : g.phase;

  let inner;
  switch (phase) {
    case 0:
      inner = <SetSailPhase />;
      break;
    case 5:
      inner = <FortunePhase />;
      break;
    case 1:
      inner = <ProcurePhase />;
      break;
    case 'trade':
      inner = <BarterPhase />;
      break;
    case 'worker_mgmt':
      inner = <ArtisansPhase />;
      break;
    case 2:
      inner = <TradePhase />;
      break;
    case 3:
      inner = <UpkeepPhase />;
      break;
    case 4:
      inner = <ShipyardPhase />;
      break;
    case 'bankruptcy':
      inner = <BankruptcyView />;
      break;
    case 'endgame':
      inner = <EndgameView />;
      break;
    default:
      inner = (
        <div className="center-block">
          <div className="hero-title">{tr('⚓ 准备中...', '⚓ Preparing...')}</div>
        </div>
      );
  }

  return (
    <div className="panel phase-panel" id="phase-panel">
      <div className="phase-view">
        <Stepper currentKey={phase} />
        {inner}
      </div>
    </div>
  );
}
