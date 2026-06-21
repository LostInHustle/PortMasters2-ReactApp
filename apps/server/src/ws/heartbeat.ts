import type WebSocket from 'ws';
import type { WebSocketServer } from 'ws';

const DEFAULT_INTERVAL_MS = 25_000;
const DEFAULT_MAX_MISSED_PINGS = 3;

// Root cause of "the page stops working if you leave it open for a while" on
// portmasters2.guru: nothing in this app's normal traffic (no chat, no game action) guarantees
// a socket sees any data during a quiet stretch in the lobby or between rounds, and idle
// WebSocket connections get silently dropped by Railway's edge proxy (and most reverse
// proxies/load balancers fronting a long-lived socket) well before any "session" concept is
// even involved -- this app has no token or expiring session at all, so that diagnosis was a
// red herring. The dropped connection just sits there looking alive to the client until it
// tries to send something, at which point nothing ever responds.
//
// Pinging on an interval keeps the path active through any such proxy, and doubles as real
// dead-connection detection. A *single* missed pong is not, on its own, evidence of a dead
// connection -- a backgrounded/throttled browser tab, or ordinary jitter over the public path
// to Railway, can easily delay one pong past one interval without the connection actually being
// dead. The first version of this heartbeat terminated on the very first miss, which made it
// trigger-happy enough to be a *bigger* source of disconnects than the idle timeout it was
// fixing. Tracking a per-connection miss count and only terminating once it crosses
// `maxMissedPings` gives a connection several intervals of grace to recover before being reaped,
// while still reliably clearing genuinely dead connections (laptop asleep, wifi gone, tab killed
// without a clean close) within a couple of minutes. `ws.terminate()` still emits `close` on the
// socket, so no extra wiring is needed beyond what handleConnection already does for a normal
// disconnect.
//
// Miss counts are tracked in a WeakMap rather than a property stapled onto the WebSocket
// instance, so this stays a plain function of `wss` instead of mutating objects owned by `ws`.
export function startHeartbeat(
  wss: WebSocketServer,
  intervalMs: number = DEFAULT_INTERVAL_MS,
  maxMissedPings: number = DEFAULT_MAX_MISSED_PINGS,
): () => void {
  const missed = new WeakMap<WebSocket, number>();

  const onConnection = (ws: WebSocket): void => {
    missed.set(ws, 0);
    ws.on('pong', () => missed.set(ws, 0));
  };
  wss.on('connection', onConnection);

  const timer = setInterval(() => {
    for (const ws of wss.clients) {
      const count = missed.get(ws) ?? 0;
      if (count >= maxMissedPings) {
        ws.terminate();
        continue;
      }
      missed.set(ws, count + 1);
      ws.ping();
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
    wss.off('connection', onConnection);
  };
}
