import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UserStore } from '../../src/auth/UserStore.js';

// Expected validation rules and messages hand-derived from UserStore.register/verify
// (PortMasters2/server.py lines 1159-1182).
describe('UserStore', () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pm2-userstore-'));
    path = join(dir, 'users.json');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('starts empty when the file does not exist yet', () => {
    const store = new UserStore(path);
    expect(store.verify('nobody', 'whatever')).toEqual([false, '用户名或密码错误']);
  });

  it('rejects usernames outside 3-20 chars and passwords outside 6-128 chars', () => {
    const store = new UserStore(path);
    expect(store.register('ab', 'longenough')).toEqual([false, '用户名需为 3-20 个字符']);
    expect(store.register('a'.repeat(21), 'longenough')).toEqual([false, '用户名需为 3-20 个字符']);
    expect(store.register('gooduser', 'short')).toEqual([false, '密码需为 6-128 位']);
  });

  it('registers a new user, then accepts correct credentials and rejects wrong ones', () => {
    const store = new UserStore(path);
    expect(store.register('gooduser', 'longenough')).toEqual([true, '注册成功，请登录']);
    expect(store.verify('gooduser', 'longenough')).toEqual([true, '登录成功']);
    expect(store.verify('gooduser', 'wrongpass')).toEqual([false, '用户名或密码错误']);
  });

  it('rejects registering the same username twice', () => {
    const store = new UserStore(path);
    store.register('gooduser', 'longenough');
    expect(store.register('gooduser', 'otherpassword')).toEqual([false, '该用户名已被注册']);
  });

  it('persists registered users to disk as {salt, hash, created_at}', () => {
    const store = new UserStore(path);
    store.register('gooduser', 'longenough');
    const onDisk = JSON.parse(readFileSync(path, 'utf-8'));
    expect(onDisk.gooduser).toMatchObject({
      salt: expect.stringMatching(/^[0-9a-f]{32}$/),
      hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    });
  });

  it('a fresh UserStore instance pointed at the same file sees previously registered users', () => {
    new UserStore(path).register('gooduser', 'longenough');
    const reloaded = new UserStore(path);
    expect(reloaded.verify('gooduser', 'longenough')).toEqual([true, '登录成功']);
  });
});
