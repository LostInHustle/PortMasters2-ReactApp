import { createServer, type Server } from 'node:http';
import { WebSocketServer, type VerifyClientCallbackSync } from 'ws';
import type { ServerState } from '../lobby/onlineRegistry.js';
import { handleConnection } from '../ws/connectionHandler.js';
import { startHeartbeat } from '../ws/heartbeat.js';
import { resolveStaticFile } from './staticFileHandler.js';

// Ported from PortMasters2/server.py main()/process_request (lines 1821-1856): one server
// shares the web port between static file serving and the WebSocket endpoint, the same dual
// role the original gets from a single `websockets.serve(..., process_request=...)` call.
export function createAppServer(
  state: ServerState,
  webRoot: string,
  allowedOrigins?: string[],
): Server {
  const server = createServer((req, res) => {
    const { status, contentType, body } = resolveStaticFile(webRoot, req.url ?? '/');
    res.writeHead(status, { 'Content-Type': contentType });
    res.end(body);
  });

  // No allow-list (local dev) accepts any origin, same as before this option existed.
  const verifyClient: VerifyClientCallbackSync | undefined = allowedOrigins
    ? (info) => allowedOrigins.includes(info.origin)
    : undefined;
  const wss = new WebSocketServer({ server, verifyClient });
  wss.on('connection', (ws) => handleConnection(state, ws));
  // Keeps idle connections alive through Railway's (or any reverse proxy's) idle timeout and
  // reaps genuinely dead ones -- see heartbeat.ts for why this is the fix for "the page stops
  // working after sitting open for a while." Tied to the http server's own close, not just
  // process exit, so tests that spin up/tear down a server per case (fullFlow.test.ts) don't
  // leak one interval per run.
  const stopHeartbeat = startHeartbeat(wss);
  server.on('close', stopHeartbeat);

  return server;
}
