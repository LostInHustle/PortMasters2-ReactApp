import { useEffect } from 'react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.js';
import { phaseSky } from '../../i18n/phaseFlow.js';
import { useSession } from '../../state/SessionContext.js';
import { LoginOverlay } from '../auth/LoginOverlay.js';
import { ChatWindow } from '../chat/ChatWindow.js';
import { LobbyOverlay } from '../lobby/LobbyOverlay.js';
import { SpectateView } from '../spectate/SpectateView.js';
import { BgOrbs } from './BgOrbs.js';
import { ConnectionBanner } from './ConnectionBanner.js';
import { GameView } from './GameView.js';
import { ToastStack } from './ToastStack.js';

// Top level view switch, replacing the original's display:none/flex toggles between
// #login-overlay/#lobby-overlay/the game view (for example login() and invite_accepted
// handling). The app header lives inside GameView (#app's grid-area: header),
// not here, so login/lobby (each a fullscreen overlay with its own language toggle) don't show
// it, matching the original, where .header sits inside #app. Routes on `serverState` rather
// than a single chatPartner string: that field covers both the direct one to one path and a room
// of two to five captains once it has actually started, and naturally falls back to the lobby
// after session_ended.
export function AppShell() {
  const { currentUser, serverState, room } = useSession();
  useKeyboardShortcuts();

  // The sky follows the round: night for the login screen and the endings, a harbor morning
  // for the lobby, lantern dusk for the waiting room, and first light through dusk for the
  // phases of a round. The stylesheet paints each one from this single attribute.
  const game = serverState?.yourGame;
  const sky = !currentUser
    ? 'night'
    : game
      ? phaseSky(game.bankrupt ? 'bankruptcy' : game.phase)
      : room
        ? 'dusk'
        : 'harbor';
  useEffect(() => {
    document.body.dataset.sky = sky;
  }, [sky]);

  return (
    <>
      <BgOrbs />
      <ConnectionBanner />
      {!currentUser ? <LoginOverlay /> : !serverState ? <LobbyOverlay /> : <GameView />}
      {currentUser && <ChatWindow />}
      {currentUser && <SpectateView />}
      <ToastStack />
    </>
  );
}
