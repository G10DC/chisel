// test/benchmark-cross.test.js
// Cross-skill benchmark: each method reduces tokens on verbose prose; chisel keeps code intact.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { terseProseAdvisor } from '../lib/compress.js';
import { cavemanSim, conciseSim } from '../scripts/benchmark-cross.mjs';

const est = (s) => Math.ceil(String(s).length / 4);
const verbose =
  'Sure, let me just basically go ahead and actually explain the auth flow now. ' +
  "I'll walk you through it step by step.";

test('all three output-prose skills reduce tokens on verbose prose', () => {
  for (const [name, fn] of [['chisel', terseProseAdvisor], ['caveman-it', cavemanSim], ['concise-output', conciseSim]]) {
    const out = fn(verbose);
    assert.ok(est(out) < est(verbose), `${name} reduced tokens`);
  }
});

test('chisel preserves a fenced code block; directive approximations do not promise that', () => {
  const sample = 'Let me refactor.\n\n```js\nconst x = 1;\n```\n\nBasically done.';
  const chiselOut = terseProseAdvisor(sample);
  assert.match(chiselOut, /const x = 1;/, 'chisel leaves the code intact (code-safe guard)');
});

test('concise approximation caps output to at most 3 blocks', () => {
  const five = ['a a a.', 'b b b.', 'c c c.', 'd d d.', 'e e e.'].join('\n\n');
  const out = conciseSim(five);
  assert.equal(out.split(/\n{2,}/).length, 3, 'truncated to 3 blocks');
});
