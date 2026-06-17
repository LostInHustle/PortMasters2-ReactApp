import { renameSync, writeFileSync } from 'node:fs';

// Ported verbatim from PortMasters2/server.py UserStore.save (lines 1149-1153): write to a
// sibling .tmp file, then rename over the real path. fs.renameSync, like Python's os.replace,
// atomically overwrites an existing destination -- a reader never observes a half-written file.
export function writeFileAtomic(path: string, data: string): void {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, data, 'utf-8');
  renameSync(tmp, path);
}
