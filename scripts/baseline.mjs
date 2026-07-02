#!/usr/bin/env node
// scripts/baseline.mjs
// Phase 0 baseline instrumentation: metrics from a Claude Code transcript (JSONL).
// Usage: node scripts/baseline.mjs <transcript.jsonl>

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Analyzes a JSONL transcript and returns baseline metrics. Pure (no I/O).
 * Tolerant of unknown event shapes (skips unparseable lines and metadata-only events).
 *
 * Token semantics (Anthropic usage): `input_tokens` EXCLUDES cached tokens; cache reads/writes
 * are reported separately in `cache_read_input_tokens` / `cache_creation_input_tokens`. We expose
 * all four components so a real cost estimate can weight them (cache read ≈ 0.1x, cache write
 * ≈ 1.25x of the base input price). `totalInputTokens` sums the three input components.
 *
 * Tool semantics: only `tool_use` blocks inside an assistant `message.content` array are counted
 * (the shape real Claude Code transcripts use). `tool_result` is not reliably in content, so it is
 * not reported.
 *
 * Retry/waste proxy: file mutations (Edit/MultiEdit/Write/NotebookEdit) are tracked per target.
 * `edits` counts mutation calls; `editCycles` counts files edited more than once (a one-shot-failure
 * signal — the agent cycling edit→test→fix on the same file); `repeatEdits` is the repeat volume
 * beyond each file's first edit. High values flag where tokens burn in fix loops.
 *
 * @param {string} raw JSONL text
 * @returns {Object} metrics
 */
const EDIT_TOOLS = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit']);

export function analyzeTranscript(raw) {
  const lines = String(raw).split('\n').filter(Boolean);
  let turns = 0, toolCalls = 0;
  let inputTokens = 0, outputTokens = 0;
  let cacheCreationTokens = 0, cacheReadTokens = 0;
  let edits = 0;
  let parseErrors = 0;
  const tools = new Map();
  const editTargets = new Map();

  for (const line of lines) {
    let evt;
    try { evt = JSON.parse(line); } catch { parseErrors++; continue; }

    const type = evt.type || evt.role || '';
    if (type === 'user') turns++;

    const content = Array.isArray(evt.message?.content) ? evt.message.content : (Array.isArray(evt.content) ? evt.content : []);
    for (const block of content) {
      if (block && block.type === 'tool_use') {
        toolCalls++;
        const name = block.name || 'unknown';
        tools.set(name, (tools.get(name) || 0) + 1);
        if (EDIT_TOOLS.has(name)) {
          edits++;
          const p = block.input?.file_path || block.input?.notebook_path || block.input?.path;
          if (p) editTargets.set(p, (editTargets.get(p) || 0) + 1);
        }
      }
    }

    const u = evt.message?.usage || evt.usage;
    if (u) {
      inputTokens += u.input_tokens || 0;
      outputTokens += u.output_tokens || 0;
      cacheCreationTokens += u.cache_creation_input_tokens || 0;
      cacheReadTokens += u.cache_read_input_tokens || 0;
    }
  }

  const editCounts = [...editTargets.values()];
  const editCycles = editCounts.filter((c) => c > 1).length;
  const repeatEdits = editCounts.reduce((s, c) => s + Math.max(0, c - 1), 0);
  const totalInputTokens = inputTokens + cacheCreationTokens + cacheReadTokens;
  return {
    turns,
    toolCalls,
    inputTokens,
    outputTokens,
    cacheCreationTokens,
    cacheReadTokens,
    totalInputTokens,
    totalTokens: totalInputTokens + outputTokens,
    toolsPerTurn: turns ? Number((toolCalls / turns).toFixed(2)) : 0,
    edits,
    editCycles,
    repeatEdits,
    parseErrors,
    tools: Object.fromEntries([...tools.entries()].sort((a, b) => b[1] - a[1])),
  };
}

/**
 * Default pricing (USD per 1M tokens), Claude-Sonnet-ish: cache read ≈ 0.1x, cache write ≈ 1.25x
 * of the fresh-input price. Override per model via the `pricing` argument.
 */
export const DEFAULT_PRICING = {
  inputPerMillion: 3,
  cacheWritePerMillion: 3.75,
  cacheReadPerMillion: 0.3,
  outputPerMillion: 15,
};

/**
 * Estimates USD cost from token metrics, weighted by component (cache reads are ~30x cheaper than
 * fresh input; output is the most expensive). Aligns the baseline with tools like ccusage.
 * @param {Object} m metrics (inputTokens, cacheCreationTokens, cacheReadTokens, outputTokens)
 * @param {Object} [pricing] USD per 1M tokens
 * @returns {{input:number, cacheWrite:number, cacheRead:number, output:number, total:number, pricing:Object}}
 */
export function estimateCost(m, pricing = DEFAULT_PRICING) {
  const M = 1_000_000;
  const input = (m.inputTokens || 0) / M * pricing.inputPerMillion;
  const cacheWrite = (m.cacheCreationTokens || 0) / M * pricing.cacheWritePerMillion;
  const cacheRead = (m.cacheReadTokens || 0) / M * pricing.cacheReadPerMillion;
  const output = (m.outputTokens || 0) / M * pricing.outputPerMillion;
  return { input, cacheWrite, cacheRead, output, total: input + cacheWrite + cacheRead + output, pricing };
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/baseline.mjs <transcript.jsonl>');
    process.exit(2);
  }
  const metrics = analyzeTranscript(fs.readFileSync(file, 'utf-8'));
  const cost = estimateCost(metrics);
  console.log(JSON.stringify({ file, ...metrics, cost }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
