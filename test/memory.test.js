// test/memory.test.js — pruneAdvisor: stale + duplicate detection.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pruneAdvisor } from '../lib/memory.js';

const NOW = 1_700_000_000_000;

test('pruneAdvisor flags duplicates and stale entries, keeps the rest', () => {
  const entries = [
    { role: 'user', content: 'hello', ts: NOW },
    { role: 'user', content: 'hello', ts: NOW },           // duplicate
    { role: 'assistant', content: 'old answer', ts: NOW - 48 * 3600 * 1000 }, // stale
    { role: 'user', content: 'fresh', ts: NOW },
  ];
  const { keep, prune } = pruneAdvisor(entries, { now: NOW });
  assert.equal(keep.length, 2);
  assert.equal(prune.length, 2);
  assert.deepEqual(prune.map((p) => p.reason).sort(), ['duplicate', 'stale']);
});

test('pruneAdvisor empty input -> empty partition', () => {
  const { keep, prune } = pruneAdvisor([], { now: NOW });
  assert.deepEqual(keep, []);
  assert.deepEqual(prune, []);
});
