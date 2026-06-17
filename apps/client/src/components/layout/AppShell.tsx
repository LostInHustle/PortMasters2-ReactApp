import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.js';
import { useSession } from '../../state/SessionContext.js';
import { LoginOverlay } from '../auth/LoginOverlay.js';
import { ChatWindow } from '../chat/ChatWindow.js';
import { LobbyOverlay } from '../lobby/LobbyOverlay.js';
import { SpectateView } from '../spectate/SpectateView.js';
import { GameView } from './GameView.js';
import { Header } from './Header.js';
import { ToastStack } from './ToastStack.js';

// Top-level view switch, replacing the original's display:none/flex toggles between
// #login-overlay/#lobby-overlay/the game view (e.g. login(), lines 1916-1918; invite_accepted
// handling, lines 1961-1969).
export function AppShell() {
  const { currentUser, chatPartner } = useSession();
  useKeyboardShortcuts();

  return (
    <>
      {currentUser && <Header />}
      {!currentUser ? <LoginOverlay /> : !chatPartner ? <LobbyOverlay /> : <GameView />}
      {currentUser && <ChatWindow />}
      {currentUser && <SpectateView />}
      <ToastStack />
    </>
  );
}
