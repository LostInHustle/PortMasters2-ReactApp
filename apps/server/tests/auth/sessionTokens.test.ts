import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { issueToken, resolveToken, revokeToken } from '../../src/auth/sessionTokens.js';
import { UserStore } from '../../src/auth/UserStore.js';
import { createServerState, type ServerState } from '../../src/lobby/onlineRegistry.js';

describe('sessionTokens', () => {
  let dir: string;
  let state: ServerState;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'pm2-tokens-'));
    state = createServerState(new UserStore(join(dir, 'users.json')));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('issues a token that resolves back to its owner', () => {
    const token = issueToken(state, 'alice');
    expect(resolveToken(state, token)).toBe('alice');
  });

  it('ignores a token that is not a string, and one it never issued', () => {
    expect(resolveToken(state, undefined)).toBeUndefined();
    expect(resolveToken(state, 42)).toBeUndefined();
    expect(resolveToken(state, 'nosuchtoken')).toBeUndefined();
  });

  it('revokes only the token it is given', () => {
    const alice = issueToken(state, 'alice');
    const bob = issueToken(state, 'bob');
    revokeToken(state, alice);
    expect(resolveToken(state, alice)).toBeUndefined();
    expect(resolveToken(state, bob)).toBe('bob');
  });

  it('retires a player previous token when they log in again', () => {
    const first = issueToken(state, 'alice');
    const second = issueToken(state, 'alice');
    expect(second).not.toBe(first);
    expect(resolveToken(state, first)).toBeUndefined();
    expect(resolveToken(state, second)).toBe('alice');
  });

  it('keeps exactly one live token per account no matter how often they log in', () => {
    for (let i = 0; i < 50; i++) issueToken(state, 'alice');
    issueToken(state, 'bob');
    expect(state.sessionTokens.size).toBe(2);
  });
});
