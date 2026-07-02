// test/compress.test.js — terseAdvisor: lossless filler/whitespace reduction.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { terseAdvisor } from '../lib/compress.js';

test('terseAdvisor strips filler openers and padding (meaning unchanged)', () => {
  assert.equal(terseAdvisor('Let me just basically fix the bug.'), 'fix the bug.');
  assert.equal(terseAdvisor("I'll run the tests"), 'run the tests');
});

test('terseAdvisor collapses whitespace, leaves code intact', () => {
  assert.equal(terseAdvisor('foo    bar\n\n\n\nbaz'), 'foo bar\n\nbaz');
  assert.equal(terseAdvisor('const x = 1;'), 'const x = 1;');
});

test('terseAdvisor does not touch error-style content semantics', () => {
  const err = 'Error: ENOENT: no such file or directory';
  assert.equal(terseAdvisor(err), err);
});
