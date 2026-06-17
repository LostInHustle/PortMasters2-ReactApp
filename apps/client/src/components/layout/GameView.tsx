import { ControlPanel } from '../panels/ControlPanel.js';
import { LogPanel } from '../panels/LogPanel.js';
import { PartnerPanel } from '../panels/PartnerPanel.js';
import { PhasePanel } from '../panels/PhasePanel.js';
import { StatusPanel } from '../panels/StatusPanel.js';

// Ported verbatim from PortMasters2/PortMasters_online.html #app's panel layout
// (lines 1208-1213): side-by-side status/phase/partner panels, with the control bar and log
// below.
export function GameView() {
  return (
    <div id="app">
      <StatusPanel />
      <PhasePanel />
      <PartnerPanel />
      <div className="control-panel" id="control-panel">
        <ControlPanel />
      </div>
      <LogPanel />
    </div>
  );
}
