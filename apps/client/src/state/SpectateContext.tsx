import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
// first one available when no specific target is requested.
export function SpectateProvider({ children }: { children: ReactNode }) {
  const [isSpectating, setIsSpectating] = useState(false);
  const [target, setTargetState] = useState<string | null>(null);
  const { serverState } = useSession();
  const wasBankrupt = useRef(false);

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

  // The window closes itself the moment THIS player stops being bankrupt (a restart while
  // bankrupt-spectating) -- tracked as an edge on the previous bankrupt state, not the current
  // level, so opening this same window from a roster click while simply not bankrupt (the
  // common case once it doubles as the Captain Viewer) doesn't immediately snap it shut.
  useEffect(() => {
    const isBankrupt = serverState?.yourGame?.bankrupt ?? false;
    if (isSpectating && wasBankrupt.current && !isBankrupt) {
      setIsSpectating(false);
      setTargetState(null);
    }
    wasBankrupt.current = isBankrupt;
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
