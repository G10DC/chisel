// test/benchmark.test.js
// Benchmark-style tests: document what each Chisel lever does and prove it reduces
// token consumption on representative inputs without losing the essential content.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pruneAdvisor } from '../lib/memory.js';
import { isRedundant, estimateToolCost } from '../lib/precision.js';
import { terseProseAdvisor } from '../lib/compress.js';

const estTokens = (s) => Math.ceil(String(s).length / 4);

test('Lever 3 — terseProseAdvisor reduces verbose agent prose and keeps the core meaning', () => {
  const verbose = 'Let me just basically go ahead and actually run the tests now.';
  const terse = terseProseAdvisor(verbose);
  assert.ok(estTokens(terse) < estTokens(verbose), 'token estimate must drop');
  assert.match(terse, /run the tests/, 'the actionable core is preserved');
});

test('Lever 1 — pruneAdvisor shrinks a context by removing duplicates and stale entries', () => {
  const now = Date.now();
  const ctx = [
    { role: 'user', content: 'a', ts: now },
    { role: 'user', content: 'a', ts: now },                // duplicate
    { role: 'user', content: 'stale', ts: now - 99 * 1e8 }, // stale
    { role: 'user', content: 'keep', ts: now },
  ];
  const { keep, prune } = pruneAdvisor(ctx, { now });
  assert.ok(keep.length < ctx.length, 'context shrinks');
  assert.ok(prune.length >= 2, 'at least the duplicate and the stale entry are pruned');
  assert.ok(keep.some((e) => e.content === 'keep'), 'the fresh, unique entry survives');
});

test('Lever 2 — isRedundant flags a repeated call and its cost is a positive saving', () => {
  const history = [{ name: 'Read', args: { path: '/a' } }];
  const repeated = { name: 'Read', args: { path: '/a' } };
  const novel = { name: 'Read', args: { path: '/b' } };
  assert.equal(isRedundant(repeated, history), true, 'identical prior call is redundant');
  assert.equal(isRedundant(novel, history), false, 'a different call is not redundant');
  assert.ok(estimateToolCost('Read') > 0, 'cost is positive, so suppressing a redundant call saves tokens');
});
