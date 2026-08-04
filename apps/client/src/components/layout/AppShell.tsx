import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.js';
import { useSession } from '../../state/SessionContext.js';
import { LoginOverlay } from '../auth/LoginOverlay.js';
import { ChatWindow } from '../chat/ChatWindow.js';
import { LobbyOverlay } from '../lobby/LobbyOverlay.js';
import { SpectateView } from '../spectate/SpectateView.js';
import { BgOrbs } from './BgOrbs.js';
import { ConnectionBanner } from './ConnectionBanner.js';
import { GameView } from './GameView.js';
import { ToastStack } from './ToastStack.js';

// Top-level view switch, replacing the original's display:none/flex toggles between
// #login-overlay/#lobby-overlay/the game view (e.g. login(), lines 1916-1918; invite_accepted
// handling, lines 1961-1969). The app header lives inside GameView (#app's grid-area: header),
// not here, so login/lobby (each a fullscreen overlay with its own language toggle) don't show
// it -- matching the original, where .header sits inside #app. Routes on `serverState` rather
// than a single chatPartner string: that field covers both the 1:1 fast path and a 2-5 player
// room once it has actually started, and naturally falls back to the lobby after session_ended.
export function AppShell() {
  const { currentUser, serverState } = useSession();
  useKeyboardShortcuts();

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
