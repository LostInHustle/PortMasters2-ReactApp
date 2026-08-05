import { randomBytes } from 'node:crypto';
import type { ServerState } from '../lobby/onlineRegistry.js';

// Same primitive as passwordHash.ts's generateSalt (16 random bytes, hex-encoded). This only
// needs to be unguessable, there's no password or derivation involved.
function randomToken(): string {
  return randomBytes(16).toString('hex');
}

// Issued on every successful login, interactive or resumed. It lets the next fresh connection
// re-identify itself silently instead of forcing the player to type their password again,
// whether that connection follows an idle-timeout drop, a brief network blip, or a page refresh.
export function issueToken(state: ServerState, username: string): string {
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
