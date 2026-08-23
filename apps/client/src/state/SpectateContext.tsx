import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  // A state broadcast arrives every time any captain touches anything, and each one is a fresh
  // object off the wire. openSpectate only needs the roster at the moment it is called, so it
  // reads it from a ref rather than closing over it: listing serverState as a dependency would
  // hand every consumer a new callback, and a new context value, on every broadcast in the
  // session. Nothing below renders again now unless the window itself actually opens, closes,
  // or switches captain.
  const serverStateRef = useRef(serverState);
  serverStateRef.current = serverState;

  const openSpectate = useCallback((requested?: string) => {
    setTargetState(requested ?? Object.keys(serverStateRef.current?.otherGames ?? {})[0] ?? null);
    setIsSpectating(true);
  }, []);
  const closeSpectate = useCallback(() => {
    setIsSpectating(false);
    setTargetState(null);
  }, []);
  const setTarget = useCallback((next: string) => setTargetState(next), []);

  // The window closes itself the moment THIS player stops being bankrupt (a restart while
  // bankrupt-spectating), tracked as an edge on the previous bankrupt state, not the current
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

  const value = useMemo(
    () => ({ isSpectating, target, openSpectate, closeSpectate, setTarget }),
    [isSpectating, target, openSpectate, closeSpectate, setTarget],
  );

  return <SpectateContext.Provider value={value}>{children}</SpectateContext.Provider>;
}

export function useSpectate(): SpectateContextValue {
  const ctx = useContext(SpectateContext);
  if (!ctx) throw new Error('useSpectate must be used within a SpectateProvider');
  return ctx;
}
