import { useEffect } from 'react';
import { useModal } from '../modal/ModalContext.js';
import { OnboardingTour, shouldShowOnboarding } from '../onboarding/OnboardingTour.js';
import { ControlPanel } from '../panels/ControlPanel.js';
import { LogPanel } from '../panels/LogPanel.js';
import { PartnerPanel } from '../panels/PartnerPanel.js';
import { PhasePanel } from '../panels/PhasePanel.js';
import { StatusPanel } from '../panels/StatusPanel.js';

// Ported verbatim from PortMasters2/PortMasters_online.html #app's panel layout
// (lines 1208-1213): side-by-side status/phase/partner panels, with the control bar and log
// below. maybeShowOnboarding() (lines 1968, 1976) fires once, the first time a session is
// entered; this component only ever mounts as a result of that same transition (chatPartner
// becoming set), so a mount-time effect is the equivalent trigger point.
export function GameView() {
  const { openModal } = useModal();

  useEffect(() => {
    if (shouldShowOnboarding()) openModal(<OnboardingTour />, true);
  }, [openModal]);

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
