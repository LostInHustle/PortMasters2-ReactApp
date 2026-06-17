import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const ITERATIONS = 100_000;
const KEY_LENGTH = 32; // sha256 digest size; Python's pbkdf2_hmac defaults to this when dklen is omitted

// Ported verbatim from PortMasters2/server.py UserStore._hash (lines 1156-1157).
export function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, Buffer.from(salt, 'hex'), ITERATIONS, KEY_LENGTH, 'sha256').toString(
    'hex',
  );
}

// Mirrors Python's secrets.token_hex(16) (server.py line 1166): 16 random bytes, hex-encoded.
export function generateSalt(): string {
  return randomBytes(16).toString('hex');
}

// Constant-time compare, like Python's hmac.compare_digest (server.py line 1180). Unlike
// compare_digest, Node's timingSafeEqual throws on a length mismatch instead of returning
// false, so a wrong-length hash must be rejected before reaching it -- this preserves the
// original's "wrong password just fails" behavior instead of throwing on malformed records.
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
