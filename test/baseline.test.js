// test/baseline.test.js — analyzeTranscript metrics on a synthetic JSONL.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeTranscript } from '../scripts/baseline.mjs';

const jsonl = [
  JSON.stringify({ type: 'user' }),
  JSON.stringify({ type: 'assistant', message: { content: [
    { type: 'tool_use', name: 'Read' },
    { type: 'tool_use', name: 'Read' },
    { type: 'tool_use', name: 'Bash' },
  ], usage: { input_tokens: 100, output_tokens: 50 } } }),
  JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result' }] } }),
  'not json',
].join('\n');

test('analyzeTranscript counts turns, tool calls, tokens; tolerates bad lines', () => {
  const m = analyzeTranscript(jsonl);
  assert.equal(m.turns, 2);
  assert.equal(m.toolCalls, 3);
  assert.equal(m.toolResults, 1);
  assert.equal(m.inputTokens, 100);
  assert.equal(m.outputTokens, 50);
  assert.equal(m.totalTokens, 150);
  assert.equal(m.toolsPerTurn, 1.5);
  assert.equal(m.parseErrors, 1);
  assert.equal(m.tools.Read, 2);
  assert.equal(m.tools.Bash, 1);
});
