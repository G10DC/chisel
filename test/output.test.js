// test/output.test.js — toolOutputAdvisor: head + tail trimming, code-safe.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toolOutputAdvisor } from '../lib/output.js';

test('toolOutputAdvisor leaves short output unchanged', () => {
  assert.equal(toolOutputAdvisor(['a', 'b', 'c'].join('\n')), 'a\nb\nc');
});

test('toolOutputAdvisor trims long output to head + tail with an omission count', () => {
  const lines = Array.from({ length: 100 }, (_, i) => `line ${i}`);
  const out = toolOutputAdvisor(lines.join('\n'), { head: 2, tail: 2, threshold: 5 });
  const res = out.split('\n');
  assert.equal(res[0], 'line 0');
  assert.equal(res[1], 'line 1');
  assert.match(res[2], /\[96 lines omitted\]/);
  assert.equal(res[3], 'line 98');
  assert.equal(res[4], 'line 99');
});

test('toolOutputAdvisor is code-safe (lines are never altered, only the middle is elided)', () => {
  const lines = Array.from({ length: 40 }, (_, i) => `  code line ${i};`);
  const out = toolOutputAdvisor(lines.join('\n'), { head: 1, tail: 1, threshold: 5 });
  assert.match(out, /code line 0;/);
  assert.match(out, /code line 39;/);
  assert.doesNotMatch(out, /code line 20;/, 'the middle is elided, not altered');
});
