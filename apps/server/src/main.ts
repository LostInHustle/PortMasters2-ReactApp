import { fileURLToPath } from 'node:url';
import { createAppServer } from './http/createHttpServer.js';
import { createServerState } from './lobby/onlineRegistry.js';
import { UserStore } from './auth/UserStore.js';

// Configurable so a deploy host can point this at a mounted persistent volume (the container
// filesystem itself is wiped on every redeploy) without touching code.
const USERS_FILE =
  process.env.USERS_FILE_PATH ?? fileURLToPath(new URL('../data/users.json', import.meta.url));
const WEB_ROOT = fileURLToPath(new URL('../../client/dist', import.meta.url));

const PORT = Number(process.env.PORT ?? 8080);

// The client now lives on a different origin (e.g. Vercel) than this server (e.g. Railway), so
// the WebSocket upgrade is cross-origin. Unset means "allow any origin", matching today's
// behavior for local dev; set it in production to stop arbitrary sites from opening connections
// against this server.
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Ported from PortMasters2/server.py main() (lines 1852-1856): one process serves both the
// built client's static assets and the WebSocket endpoint on the same port, the same single-port
// story the original gets from `websockets.serve(..., process_request=...)`.
const state = createServerState(new UserStore(USERS_FILE));
const server = createAppServer(state, WEB_ROOT, ALLOWED_ORIGINS);

server.listen(PORT, () => {
  console.log(`✅ Server started: web http://0.0.0.0:${PORT}, WebSocket ws://0.0.0.0:${PORT}`);
});
