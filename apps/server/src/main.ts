import { fileURLToPath } from 'node:url';
import { createAppServer } from './http/createHttpServer.js';
import { createServerState } from './lobby/onlineRegistry.js';
import { UserStore } from './auth/UserStore.js';

const USERS_FILE = fileURLToPath(new URL('../data/users.json', import.meta.url));
const WEB_ROOT = fileURLToPath(new URL('../../client/dist', import.meta.url));

const PORT = Number(process.env.PORT ?? 8080);

// Ported from PortMasters2/server.py main() (lines 1852-1856): one process serves both the
// built client's static assets and the WebSocket endpoint on the same port, the same single-port
// story the original gets from `websockets.serve(..., process_request=...)`.
const state = createServerState(new UserStore(USERS_FILE));
const server = createAppServer(state, WEB_ROOT);

server.listen(PORT, () => {
  console.log(`✅ Server started: web http://0.0.0.0:${PORT}, WebSocket ws://0.0.0.0:${PORT}`);
});
