import { createServer, type Server } from 'node:http';
import { WebSocketServer, type VerifyClientCallbackSync } from 'ws';
import type { ServerState } from '../lobby/onlineRegistry.js';
import { handleConnection } from '../ws/connectionHandler.js';
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

  return server;
}
