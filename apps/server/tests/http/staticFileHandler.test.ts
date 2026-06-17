import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveStaticFile } from '../../src/http/staticFileHandler.js';

// Expected behavior hand-derived from PortMasters2/server.py process_request (lines 1827-1850),
// adapted to serve a built SPA's index.html instead of the original's single HTML file.
describe('resolveStaticFile', () => {
  let webRoot: string;

  beforeEach(() => {
    webRoot = mkdtempSync(join(tmpdir(), 'pm2-staticroot-'));
    writeFileSync(join(webRoot, 'index.html'), '<html>hi</html>');
    writeFileSync(join(webRoot, 'app.js'), 'console.log(1)');
    mkdirSync(join(webRoot, 'assets'));
    writeFileSync(join(webRoot, 'assets', 'style.css'), 'body{}');
  });

  afterEach(() => {
    rmSync(webRoot, { recursive: true, force: true });
  });

  it('serves index.html for the root path', () => {
    const res = resolveStaticFile(webRoot, '/');
    expect(res.status).toBe(200);
    expect(res.contentType).toContain('text/html');
    expect(res.body.toString()).toBe('<html>hi</html>');
  });

  it('serves a nested asset with the right content type', () => {
    const res = resolveStaticFile(webRoot, '/assets/style.css');
    expect(res.status).toBe(200);
    expect(res.contentType).toContain('text/css');
    expect(res.body.toString()).toBe('body{}');
  });

  it('strips a query string before resolving the path', () => {
    const res = resolveStaticFile(webRoot, '/app.js?v=123');
    expect(res.status).toBe(200);
    expect(res.body.toString()).toBe('console.log(1)');
  });

  it('returns 204 for a missing favicon.ico', () => {
    const res = resolveStaticFile(webRoot, '/favicon.ico');
    expect(res.status).toBe(204);
  });

  it('returns 404 for a path that does not exist', () => {
    const res = resolveStaticFile(webRoot, '/nope.html');
    expect(res.status).toBe(404);
  });

  it('returns 404 for a directory (not a file)', () => {
    const res = resolveStaticFile(webRoot, '/assets');
    expect(res.status).toBe(404);
  });

  it('blocks path traversal outside the web root', () => {
    const res = resolveStaticFile(webRoot, '/../../../etc/passwd');
    expect(res.status).toBe(404);
  });

  it('falls back to application/octet-stream for an unknown extension', () => {
    writeFileSync(join(webRoot, 'weird.xyz'), 'data');
    const res = resolveStaticFile(webRoot, '/weird.xyz');
    expect(res.status).toBe(200);
    expect(res.contentType).toBe('application/octet-stream');
  });
});
