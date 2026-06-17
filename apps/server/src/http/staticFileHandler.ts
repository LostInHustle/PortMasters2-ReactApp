import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';

export interface StaticFileResponse {
  status: number;
  contentType: string;
  body: Buffer | string;
}

// Node has no mimetypes.guess_type stdlib equivalent; this covers the finite set of file types a
// Vite production build actually emits, falling back to application/octet-stream like the
// original does when its own guess comes back empty.
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function guessContentType(filePath: string): string {
  const dot = filePath.lastIndexOf('.');
  if (dot === -1) return 'application/octet-stream';
  return CONTENT_TYPES[filePath.slice(dot)] ?? 'application/octet-stream';
}

function isFile(path: string): boolean {
  try {
    return existsSync(path) && statSync(path).isFile();
  } catch {
    return false;
  }
}

// Ported verbatim from PortMasters2/server.py process_request (lines 1827-1850), adapted to
// serve the built React client's index.html instead of the original's single HTML file as the
// SPA entry point for "/". The WebSocket-upgrade passthrough check is dropped: Node's `http`
// server already routes upgrade requests to a separate 'upgrade' event rather than 'request', so
// they never reach this handler at all -- a library-shape simplification, not a behavior change.
export function resolveStaticFile(webRoot: string, requestPath: string): StaticFileResponse {
  let path = requestPath.split('?', 2)[0]!;
  if (path === '/' || path === '') path = '/index.html';
  if (path === '/favicon.ico' && !isFile(join(webRoot, 'favicon.ico'))) {
    return { status: 204, contentType: 'text/plain', body: '' };
  }
  const filePath = normalize(join(webRoot, path.replace(/^\/+/, '')));
  if (!(filePath === webRoot || filePath.startsWith(webRoot + sep)) || !isFile(filePath)) {
    return { status: 404, contentType: 'text/plain; charset=utf-8', body: 'Not Found' };
  }
  return { status: 200, contentType: guessContentType(filePath), body: readFileSync(filePath) };
}
