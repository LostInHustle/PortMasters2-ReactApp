import { renameSync, writeFileSync } from 'node:fs';

// Mirrors PortMasters2/server.py UserStore.save: write to a
// sibling .tmp file, then rename over the real path. fs.renameSync, like Python's os.replace,
// atomically overwrites an existing destination, a reader never observes a half written file.
export function writeFileAtomic(path: string, data: string): void {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, data, 'utf-8');
  renameSync(tmp, path);
}
