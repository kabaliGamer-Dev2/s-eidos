import assert from 'node:assert/strict';
import test from 'node:test';

import { excerpt, looksLikeSecret, redact, stripTrailingComment } from '../src/engine/redact.mjs';

test('an excerpt is one line and bounded', () => {
  const long = `const value = "${'a'.repeat(400)}"`;
  const result = excerpt(long);
  assert.ok(result.length <= 120, `excerpt was ${result.length} chars`);
  assert.ok(!result.includes('\n'));
});

test('a trailing comment is stripped from a code line', () => {
  assert.equal(stripTrailingComment('const a = 1; // TODO fix'), 'const a = 1; ');
  assert.equal(stripTrailingComment('const a = 1;'), 'const a = 1;');
});

test('a comment-only line keeps its text, because the comment is the finding', () => {
  assert.equal(excerpt('// @ts-ignore'), '// @ts-ignore');
  assert.equal(excerpt('  /* @ts-ignore */  '), '/* @ts-ignore */');
});

test('a URL inside a string is not mistaken for a comment', () => {
  assert.equal(
    stripTrailingComment('const url = "https://example.com/a";'),
    'const url = "https://example.com/a";',
  );
});

test('credentials are redacted before they can reach a report', () => {
  const cases = [
    'const apiKey = "abcdef1234567890"',
    'password: "hunter2hunter2"',
    'token=ghp_abcdefghijklmnopqrstuvwxyz0123',
    'const key = "sk-abcdefghijklmnopqrstuvwx"',
    'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
    'const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"',
  ];
  for (const line of cases) {
    const safe = redact(line);
    assert.ok(!looksLikeSecret(safe), `still secret-shaped: ${safe}`);
    assert.ok(safe.includes('[redacted]'), `nothing was redacted in: ${line}`);
  }
});

test('ordinary code is left intact', () => {
  const line = 'const fullName = first + " " + last;';
  assert.equal(redact(line), line);
});

test('an excerpt of a credential line never contains the credential', () => {
  const result = excerpt('const secret = "super-secret-value-1234567890" // keep out of logs');
  assert.ok(!result.includes('super-secret-value'), result);
  assert.ok(result.length <= 120);
});
