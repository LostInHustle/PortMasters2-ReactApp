import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type ServerMessage = Record<string, unknown> & { type: string };
type MessageListener = (msg: ServerMessage) => void;

interface WsContextValue {
  connected: boolean;
  send: (action: Record<string, unknown>) => void;
  subscribe: (listener: MessageListener) => () => void;
}

const WsContext = createContext<WsContextValue | null>(null);

// /ws matches the dev-time Vite proxy (vite.config.ts) that forwards WebSocket upgrades to the
// backend on a different port; in production the same server serves both, so the path is just a
// fixed endpoint there too. The backend itself doesn't care about path -- this is a dev-workflow
// detail, not a protocol requirement.
function wsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws`;
}

// Ported from PortMasters2/PortMasters_online.html's single global `ws` plus
// setupWebSocketHandlers' onmessage dispatch (lines 1807, 1940-2052): one connection per app
// session, fanned out to any number of subscribers (SessionContext is the main one) instead of
// a single hard-coded onmessage handler, since React components mount/unmount independently of
// the socket's lifetime.
export function WsProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef(new Set<MessageListener>());

  useEffect(() => {
    const socket = new WebSocket(wsUrl());
    wsRef.current = socket;
    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data as string) as ServerMessage;
      for (const listener of listenersRef.current) listener(msg);
    };
    return () => socket.close();
  }, []);

  const send = (action: Record<string, unknown>): void => {
    wsRef.current?.send(JSON.stringify(action));
  };

  const subscribe = (listener: MessageListener): (() => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  };

  return <WsContext.Provider value={{ connected, send, subscribe }}>{children}</WsContext.Provider>;
}

export function useWs(): WsContextValue {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error('useWs must be used within a WsProvider');
  return ctx;
}
