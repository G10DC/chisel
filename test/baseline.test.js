// test/baseline.test.js — analyzeTranscript metrics on synthetic + real-shape JSONL.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeTranscript, estimateCost } from '../scripts/baseline.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const realShape = fs.readFileSync(path.join(here, 'fixtures/real-shape.jsonl'), 'utf-8');

const synthetic = [
  JSON.stringify({ type: 'user' }),
  JSON.stringify({ type: 'assistant', message: { content: [
    { type: 'tool_use', name: 'Read' },
    { type: 'tool_use', name: 'Read' },
    { type: 'tool_use', name: 'Bash' },
  ], usage: { input_tokens: 100, output_tokens: 50 } } }),
  'not json',
].join('\n');

test('analyzeTranscript counts turns, tool calls, tokens; tolerates bad lines', () => {
  const m = analyzeTranscript(synthetic);
  assert.equal(m.turns, 1);
  assert.equal(m.toolCalls, 3);
  assert.equal(m.inputTokens, 100);
  assert.equal(m.outputTokens, 50);
  assert.equal(m.totalTokens, 150);
  assert.equal(m.cacheCreationTokens, 0);
  assert.equal(m.cacheReadTokens, 0);
  assert.equal(m.totalInputTokens, 100);
  assert.equal(m.toolsPerTurn, 3);
  assert.equal(m.parseErrors, 1);
  assert.equal(m.tools.Read, 2);
  assert.equal(m.tools.Bash, 1);
});

test('analyzeTranscript on a REAL-shape transcript: cache tokens + tool_use in content', () => {
  const m = analyzeTranscript(realShape);
  assert.equal(m.turns, 1);
  assert.equal(m.toolCalls, 1, 'tool_use found inside assistant message.content');
  assert.equal(m.tools.Read, 1);
  assert.equal(m.inputTokens, 13814 + 4200);
  assert.equal(m.cacheReadTokens, 18624 + 3000);
  assert.equal(m.cacheCreationTokens, 0 + 1500);
  assert.equal(m.outputTokens, 1123 + 900);
  assert.equal(m.totalInputTokens, (13814 + 4200) + (18624 + 3000) + 1500);
});

const editSession = [
  JSON.stringify({ type: 'user' }),
  JSON.stringify({ type: 'assistant', message: { content: [
    { type: 'tool_use', name: 'Read', input: { file_path: '/repo/a.js' } },
    { type: 'tool_use', name: 'Edit', input: { file_path: '/repo/a.js' } },
    { type: 'tool_use', name: 'MultiEdit', input: { file_path: '/repo/a.js' } },
    { type: 'tool_use', name: 'Write', input: { file_path: '/repo/b.js' } },
  ] } }),
].join('\n');

test('analyzeTranscript tracks edit cycles as a retry/waste proxy', () => {
  const m = analyzeTranscript(editSession);
  assert.equal(m.edits, 3, '3 mutation calls (Edit, MultiEdit, Write)');
  assert.equal(m.editCycles, 1, 'one file (a.js) edited more than once');
  assert.equal(m.repeatEdits, 1, 'one repeat edit beyond the first on a.js');
  assert.equal(m.tools.Edit, 1);
  assert.equal(m.tools.MultiEdit, 1);
  assert.equal(m.tools.Write, 1);
});

test('estimateCost weights the four token components with a pricing model', () => {
  const m = { inputTokens: 1_000_000, cacheCreationTokens: 1_000_000, cacheReadTokens: 1_000_000, outputTokens: 1_000_000 };
  const c = estimateCost(m);
  // default Sonnet-ish pricing (USD per 1M tokens): input 3, cache write 3.75, cache read 0.30, output 15
  assert.equal(c.input, 3);
  assert.equal(c.cacheWrite, 3.75);
  assert.equal(c.cacheRead, 0.3);
  assert.equal(c.output, 15);
  assert.equal(c.total, 3 + 3.75 + 0.3 + 15);
});
