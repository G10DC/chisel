#!/usr/bin/env node
// scripts/baseline.mjs
// Phase 0 baseline instrumentation: metrics from a Claude Code transcript (JSONL).
// Usage: node scripts/baseline.mjs <transcript.jsonl>

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Analyzes a JSONL transcript and returns baseline metrics. Pure (no I/O).
 * Tolerant of unknown event shapes (skips unparseable lines).
 * @param {string} raw JSONL text
 * @returns {Object} metrics
 */
export function analyzeTranscript(raw) {
  const lines = String(raw).split('\n').filter(Boolean);
  let turns = 0, toolCalls = 0, toolResults = 0;
  let inputTokens = 0, outputTokens = 0, parseErrors = 0;
  const tools = new Map();

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
      }
      if (block && block.type === 'tool_result') toolResults++;
    }

    const u = evt.message?.usage || evt.usage;
    if (u) {
      inputTokens += u.input_tokens || 0;
      outputTokens += u.output_tokens || 0;
    }
  }

  return {
    turns,
    toolCalls,
    toolResults,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    toolsPerTurn: turns ? Number((toolCalls / turns).toFixed(2)) : 0,
    parseErrors,
    tools: Object.fromEntries([...tools.entries()].sort((a, b) => b[1] - a[1])),
  };
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/baseline.mjs <transcript.jsonl>');
    process.exit(2);
  }
  const metrics = analyzeTranscript(fs.readFileSync(file, 'utf-8'));
  console.log(JSON.stringify({ file, ...metrics }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
