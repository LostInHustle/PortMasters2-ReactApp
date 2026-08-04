import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { lst } from '../../src/i18n/serverTextRules.js';

// Root cause of "log messages appear only in Mandarin": the server always emits its log/system
// messages in canonical Chinese (see serverTextRules.ts's header comment for why -- the two
// players in a session may have different language settings, so translation has to happen on
// each client, not the server). SERVER_TEXT_RULES is a hand-maintained, flat regex table that
// has to be kept in sync, by a human remembering, with every Chinese string literal scattered
// across a dozen server files. Nothing enforced that sync; a new or edited server log line
// silently had no translation until a player happened to notice raw Chinese in an English UI.
// This test closes that gap: it statically scans the actual server source for every
// `ctx.log(...)`/`message: ...` string that contains Chinese text, and asserts lst() produces
// fully-English output for each one. A future server log line with no matching rule now fails
// `npm test` immediately, in the same change that introduced it, instead of shipping silently.
//
// This is a source-text scan, not a full TypeScript AST analysis -- it covers the two call
// shapes every translated message actually goes through in this codebase (verified by grep when
// this test was written), not arbitrary code. If a future message is constructed some other way,
// add its shape to MESSAGE_PATTERN below.
const SERVER_SRC = join(dirname(fileURLToPath(import.meta.url)), '../../../server/src');
const CJK_RE = /[一-鿿]/;
const MESSAGE_PATTERN = /(?:\.log|message:)\(?\s*(`[^`]*`|'[^']*'|"[^"]*")/g;

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listTsFiles(full));
    } else if (entry.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

// `${...}` placeholders get replaced with a representative dummy value -- the regex rules in
// serverTextRules.ts match the surrounding literal text, not the interpolated value, so any
// non-empty placeholder exercises the same rule the real value would.
function withDummyValues(template: string): string {
  return template.replace(/\$\{[^}]*\}/g, '7');
}

function findChineseMessageTemplates(): Map<string, string> {
  const templates = new Map<string, string>(); // template -> relative file path, de-duplicated
  for (const file of listTsFiles(SERVER_SRC)) {
    const source = readFileSync(file, 'utf-8');
    for (const match of source.matchAll(MESSAGE_PATTERN)) {
      const literal = match[1]!.slice(1, -1); // strip the surrounding quotes/backticks
      if (CJK_RE.test(literal) && !templates.has(literal)) {
        templates.set(literal, relative(SERVER_SRC, file));
      }
    }
  }
  return templates;
}

describe('every server-emitted message has an English translation', () => {
  const templates = findChineseMessageTemplates();

  // Sanity check on the scanner itself: if this drops to 0, MESSAGE_PATTERN or SERVER_SRC broke,
  // not that the server suddenly stopped emitting Chinese text.
  it('found a substantial number of messages to check', () => {
    expect(templates.size).toBeGreaterThan(20);
  });

  for (const [template, file] of templates) {
    it(`translates fully to English: "${template}" (${file})`, () => {
      const translated = lst(withDummyValues(template), 'en');
      expect(translated).not.toMatch(CJK_RE);
    });
  }
});
