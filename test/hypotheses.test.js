// test/hypotheses.test.js
// Characterization tests: validate the BEHAVIORS expected from the existing code,
// including edge cases the original suite does not cover. Each test names the hypothesis (Hn)
// it checks. A failure means the code does not meet its own implied contract.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pruneAdvisor } from '../lib/memory.js';
import { estimateToolCost, isRedundant } from '../lib/precision.js';
import { terseProseAdvisor } from '../lib/compress.js';
import { analyzeTranscript } from '../scripts/baseline.mjs';

const NOW = 1_700_000_000_000;

// ---- memory: pruneAdvisor ----
test('H2: an entry without ts is never stale (only a duplicate can prune it)', () => {
  const { keep, prune } = pruneAdvisor([{ role: 'user', content: 'x' }], { now: NOW, staleMs: 1 });
  assert.equal(prune.length, 0);
  assert.equal(keep.length, 1);
});

test('H3: duplicate detection is case-insensitive and whitespace-normalized', () => {
  const { keep, prune } = pruneAdvisor([
    { role: 'user', content: 'Hello   World', ts: NOW },
    { role: 'user', content: 'hello world', ts: NOW },
  ], { now: NOW });
  assert.equal(keep.length, 1);
  assert.equal(prune.length, 1);
  assert.equal(prune[0].reason, 'duplicate');
});

test('H5: a custom staleMs is honored', () => {
  const { prune } = pruneAdvisor(
    [{ role: 'user', content: 'old', ts: NOW - 1000 }],
    { now: NOW, staleMs: 500 }
  );
  assert.equal(prune.length, 1);
  assert.equal(prune[0].reason, 'stale');
});

test('H6: the first occurrence is kept, later duplicates are pruned (order preserved)', () => {
  const { keep } = pruneAdvisor([
    { role: 'user', content: 'a', ts: NOW },
    { role: 'user', content: 'a', ts: NOW },
  ], { now: NOW });
  assert.equal(keep.length, 1);
  assert.equal(keep[0].content, 'a');
});

// ---- precision ----
test('H9: estimateToolCost(undefined/empty) -> default 2', () => {
  assert.equal(estimateToolCost(undefined), 2);
  assert.equal(estimateToolCost(''), 2);
});

test('H11: isRedundant returns false on empty/undefined history', () => {
  assert.equal(isRedundant({ name: 'Read', args: { p: '/a' } }, []), false);
  assert.equal(isRedundant({ name: 'Read', args: { p: '/a' } }, undefined), false);
});

// ---- compress ----
test('H14: terseProseAdvisor("") -> ""', () => {
  assert.equal(terseProseAdvisor(''), '');
});

test('H18: terseProseAdvisor must NOT corrupt hyphenated compounds (just-in-time)', () => {
  assert.equal(terseProseAdvisor('just-in-time compilation'), 'just-in-time compilation');
  assert.equal(terseProseAdvisor('a basically-sound design'), 'a basically-sound design');
});

// ---- baseline: analyzeTranscript ----
test('H20: analyzeTranscript("") -> all zeros, no parse errors', () => {
  const m = analyzeTranscript('');
  assert.equal(m.turns, 0);
  assert.equal(m.toolCalls, 0);
  assert.equal(m.totalTokens, 0);
  assert.equal(m.cacheCreationTokens, 0);
  assert.equal(m.cacheReadTokens, 0);
  assert.equal(m.parseErrors, 0);
});

test('H22: usage tokens accumulate across multiple assistant messages (incl. cache)', () => {
  const jsonl = [
    JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 2, cache_read_input_tokens: 4 } } }),
    JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 20, output_tokens: 8 } } }),
  ].join('\n');
  const m = analyzeTranscript(jsonl);
  assert.equal(m.inputTokens, 30);
  assert.equal(m.outputTokens, 13);
  assert.equal(m.cacheCreationTokens, 2);
  assert.equal(m.cacheReadTokens, 4);
  assert.equal(m.totalInputTokens, 36);
});
