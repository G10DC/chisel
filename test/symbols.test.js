// test/symbols.test.js — symbolSlice: extract one block by name.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { symbolSlice } from '../lib/symbols.js';

const code = `
const x = 1;
function alpha(a) {
  return a + 1;
}
function beta(a) {
  if (a) {
    return a * 2;
  }
  return 0;
}
class Gamma { constructor() {} }
`;

test('symbolSlice extracts a function by name (balanced braces)', () => {
  const out = symbolSlice(code, 'beta');
  assert.ok(out, 'found');
  assert.match(out, /^function beta/);
  assert.match(out, /return a \* 2/);
  assert.match(out, /return 0/);
  assert.ok(out.endsWith('}'), 'ends at the matching brace');
});

test('symbolSlice returns null when the name is absent or empty', () => {
  assert.equal(symbolSlice(code, 'missing'), null);
  assert.equal(symbolSlice(code, ''), null);
});

test('symbolSlice does not bleed past the matched block', () => {
  const out = symbolSlice(code, 'alpha');
  assert.ok(out);
  assert.doesNotMatch(out, /beta/, 'alpha block does not contain beta');
});
