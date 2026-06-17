import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSession } from './SessionContext.js';

interface SpectateContextValue {
  isSpectating: boolean;
  openSpectate: () => void;
  closeSpectate: () => void;
}

const SpectateContext = createContext<SpectateContextValue | null>(null);

// Ported verbatim from PortMasters2/PortMasters_online.html openSpectate/closeSpectate/
// renderSpectate's auto-close check (lines 3222-3235): the spectator window closes itself once
// this player is no longer bankrupt (the session restarted), matching the original's check
// inside renderAll() rather than requiring a separate manual close.
export function SpectateProvider({ children }: { children: ReactNode }) {
  const [isSpectating, setIsSpectating] = useState(false);
  const { serverState } = useSession();

  const openSpectate = useCallback(() => setIsSpectating(true), []);
  const closeSpectate = useCallback(() => setIsSpectating(false), []);

  useEffect(() => {
    if (isSpectating && serverState?.yourGame && !serverState.yourGame.bankrupt) {
      setIsSpectating(false);
    }
  }, [isSpectating, serverState]);

  return (
    <SpectateContext.Provider value={{ isSpectating, openSpectate, closeSpectate }}>
      {children}
    </SpectateContext.Provider>
  );
}

export function useSpectate(): SpectateContextValue {
  const ctx = useContext(SpectateContext);
  if (!ctx) throw new Error('useSpectate must be used within a SpectateProvider');
  return ctx;
}
