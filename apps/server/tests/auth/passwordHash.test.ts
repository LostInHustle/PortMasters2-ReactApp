import { describe, expect, it } from 'vitest';
import { generateSalt, hashPassword, verifyPassword } from '../../src/auth/passwordHash.js';

describe('hashPassword', () => {
  // Test vector computed independently with Python's actual hashlib.pbkdf2_hmac (not this
  // port): hashlib.pbkdf2_hmac('sha256', b'correct horse battery staple',
  // bytes.fromhex('0123456789abcdef0123456789abcdef'), 100000).hex(). Confirms this port
  // produces a byte-identical digest to PortMasters2/server.py's UserStore._hash.
  it('matches a PBKDF2-HMAC-SHA256 digest computed by Python hashlib', () => {
    const salt = '0123456789abcdef0123456789abcdef';
    const hash = hashPassword('correct horse battery staple', salt);
    expect(hash).toBe('f65afe47b6abb2e16f7af7846542865f068c026fb94aea64d4d9c0e4b62c30d6');
  });

  it('produces a 64-char hex digest (32-byte SHA-256 output)', () => {
    expect(hashPassword('any password', generateSalt())).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('generateSalt', () => {
  it('produces a 32-char hex string (16 random bytes) that differs across calls', () => {
    const a = generateSalt();
    const b = generateSalt();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(b).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toBe(b);
  });
});

describe('verifyPassword', () => {
  it('accepts the correct password and rejects a wrong one', () => {
    const salt = generateSalt();
    const hash = hashPassword('s3cret!', salt);
    expect(verifyPassword('s3cret!', salt, hash)).toBe(true);
    expect(verifyPassword('wrong', salt, hash)).toBe(false);
  });

  it('rejects rather than throws when the stored hash has an unexpected length', () => {
    const salt = generateSalt();
    expect(verifyPassword('s3cret!', salt, 'deadbeef')).toBe(false);
  });
});
