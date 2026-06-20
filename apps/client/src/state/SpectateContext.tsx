import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSession } from './SessionContext.js';

interface SpectateContextValue {
  isSpectating: boolean;
  target: string | null;
  openSpectate: (target?: string) => void;
  closeSpectate: () => void;
  setTarget: (target: string) => void;
}

const SpectateContext = createContext<SpectateContextValue | null>(null);

// Generalizes PortMasters2/PortMasters_online.html's openSpectate/closeSpectate (lines
// 3222-3235) and the prototype's later openCaptainViewer (which doubles this same window as a
// "click any roster widget" detail view, not just the self-bankruptcy auto-watch) into one
// target-aware viewer: `target` names which other captain's fleet is shown, defaulting to the
// first one available when no specific target is requested. The auto-close check is unchanged --
// the window closes itself once this player is no longer bankrupt (the session restarted),
// matching the original's check inside renderAll() rather than requiring a manual close.
export function SpectateProvider({ children }: { children: ReactNode }) {
  const [isSpectating, setIsSpectating] = useState(false);
  const [target, setTargetState] = useState<string | null>(null);
  const { serverState } = useSession();

  const openSpectate = useCallback(
    (requested?: string) => {
      setTargetState(requested ?? Object.keys(serverState?.otherGames ?? {})[0] ?? null);
      setIsSpectating(true);
    },
    [serverState],
  );
  const closeSpectate = useCallback(() => {
    setIsSpectating(false);
    setTargetState(null);
  }, []);
  const setTarget = useCallback((next: string) => setTargetState(next), []);

  useEffect(() => {
    if (isSpectating && serverState?.yourGame && !serverState.yourGame.bankrupt) {
      setIsSpectating(false);
      setTargetState(null);
    }
  }, [isSpectating, serverState]);

  return (
    <SpectateContext.Provider
      value={{ isSpectating, target, openSpectate, closeSpectate, setTarget }}
    >
      {children}
    </SpectateContext.Provider>
  );
}

export function useSpectate(): SpectateContextValue {
  const ctx = useContext(SpectateContext);
  if (!ctx) throw new Error('useSpectate must be used within a SpectateProvider');
  return ctx;
}
