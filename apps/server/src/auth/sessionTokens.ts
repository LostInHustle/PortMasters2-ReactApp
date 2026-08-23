import { randomBytes } from 'node:crypto';
import type { ServerState } from '../lobby/onlineRegistry.js';

// Same primitive as passwordHash.ts's generateSalt (16 random bytes, hex-encoded). This only
// needs to be unguessable, there's no password or derivation involved.
function randomToken(): string {
  return randomBytes(16).toString('hex');
}

// Issued on every successful login. It lets the next fresh connection identify itself again
// silently instead of forcing the player to type their password again, whether that connection
// follows an idle timeout drop, a brief network blip, or a page refresh.
//
// One token per account, because that is already the rule everywhere else: login refuses an
// account that is online elsewhere, so a second live token for the same player could only ever
// be a leftover. Retiring the previous one on each login keeps the two rules in agreement, makes
// logging out on the last device genuinely final, and stops this map from growing by one dead
// entry per login for as long as the process runs.
export function issueToken(state: ServerState, username: string): string {
  for (const [existing, owner] of state.sessionTokens) {
    if (owner === username) state.sessionTokens.delete(existing);
  }
  const token = randomToken();
  state.sessionTokens.set(token, username);
  return token;
}

export function resolveToken(state: ServerState, token: unknown): string | undefined {
  return typeof token === 'string' ? state.sessionTokens.get(token) : undefined;
}

export function revokeToken(state: ServerState, token: unknown): void {
  if (typeof token === 'string') state.sessionTokens.delete(token);
}
