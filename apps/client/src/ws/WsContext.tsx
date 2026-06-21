import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ServerMessage = Record<string, unknown> & { type: string };
type MessageListener = (msg: ServerMessage) => void;

interface WsContextValue {
  connected: boolean;
  send: (action: Record<string, unknown>) => void;
  subscribe: (listener: MessageListener) => () => void;
}

const WsContext = createContext<WsContextValue | null>(null);

// VITE_WS_URL points at a backend deployed on a different origin than the client (e.g. client on
// Vercel, server on Railway) -- Vercel can't host the persistent WebSocket process itself, so
// same-origin is no longer a safe assumption in production. Unset, this falls back to /ws on the
// page's own origin, which is what the dev-time Vite proxy (vite.config.ts) forwards to the local
// backend, and what a single-process same-origin deploy would also serve.
function wsUrl(): string {
  const override = import.meta.env.VITE_WS_URL;
  if (override) return override;
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws`;
}

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30_000;

// Ported from PortMasters2/PortMasters_online.html's single global `ws` plus
// setupWebSocketHandlers' onmessage dispatch (lines 1807, 1940-2052): one connection per app
// session, fanned out to any number of subscribers (SessionContext is the main one) instead of
// a single hard-coded onmessage handler, since React components mount/unmount independently of
// the socket's lifetime.
//
// Root-caused from the production symptom "leave the tab open for a while and login stops
// working": this app has no token or expiring session of any kind -- the connection itself was
// dying silently (idle WebSocket connections get dropped by Railway's edge proxy, and most
// reverse proxies, well before anything app-level is involved), and there was no reconnect
// logic at all, so a dropped socket just sat there forever looking like a frozen page. The
// matching server-side half of this fix is heartbeat.ts, which keeps the connection from going
// idle in the first place; this auto-reconnect is the fallback for when a drop happens anyway
// (laptop sleep, wifi blip, a Railway redeploy).
export function WsProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef(new Set<MessageListener>());
  const attemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect(): void {
      const socket = new WebSocket(wsUrl());
      wsRef.current = socket;

      socket.onopen = () => {
        attemptRef.current = 0;
        setConnected(true);
      };

      socket.onclose = () => {
        wsRef.current = null;
        setConnected(false);
        if (unmountedRef.current) return;
        const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * 2 ** attemptRef.current,
          RECONNECT_MAX_DELAY_MS,
        );
        attemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      socket.onmessage = (e) => {
        const msg = JSON.parse(e.data as string) as ServerMessage;
        for (const listener of listenersRef.current) listener(msg);
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  // Stable across re-renders (refs, not state) so consumers can safely list them as effect
  // dependencies without re-subscribing on every unrelated render of this provider. Guards on
  // readyState, not just nullness: a socket mid-reconnect (CONNECTING) or on its way out
  // (CLOSING) throws or silently drops on send anyway, so this just makes that explicit instead
  // of leaking a raw DOMException out of an arbitrary call site. The dropped action isn't
  // retried -- the disconnected state is already visible via `connected` (SessionContext resets
  // to the login screen on reconnect), so there's nothing more to tell the caller per send.
  const send = useCallback((action: Record<string, unknown>): void => {
    const socket = wsRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(action));
    }
  }, []);

  const subscribe = useCallback((listener: MessageListener): (() => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  return <WsContext.Provider value={{ connected, send, subscribe }}>{children}</WsContext.Provider>;
}

export function useWs(): WsContextValue {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error('useWs must be used within a WsProvider');
  return ctx;
}
