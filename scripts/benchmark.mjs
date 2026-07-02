#!/usr/bin/env node
// scripts/benchmark.mjs
// Benchmark: what each Chisel lever does and how much it saves on representative inputs.
// Token estimate: chars / 4 (rough; the RELATIVE reduction is what matters for comparison).
// Usage: node scripts/benchmark.mjs

import { pathToFileURL } from 'node:url';
import { pruneAdvisor } from '../lib/memory.js';
import { estimateToolCost, isRedundant } from '../lib/precision.js';
import { terseProseAdvisor } from '../lib/compress.js';
import { toolOutputAdvisor } from '../lib/output.js';
import { duplicateReads } from '../lib/reads.js';
import { estimateCost } from './baseline.mjs';

const estTokens = (s) => Math.ceil(String(s).length / 4);
const pct = (a, b) => (b ? Math.round(((b - a) / b) * 100) : 0);

// Lever 3 — Token reduction: trim verbal filler from the agent's own prose.
function benchCompress() {
  const samples = [
    "Let me just basically go ahead and actually run the tests now, and then I'll check the output.",
    "I think we should basically just refactor the function to actually handle the edge case properly.",
    "So, I'll now read the file and basically summarize what it does for you.",
  ];
  let before = 0, after = 0;
  for (const s of samples) { before += estTokens(s); after += estTokens(terseProseAdvisor(s)); }
  return { before, after, reduction: pct(after, before) };
}

// Lever 1 — Memory cleanup: drop duplicate + stale entries from a context window.
function benchMemory() {
  const now = Date.now();
  const context = [
    { role: 'user', content: 'Explain the auth flow', ts: now },
    { role: 'assistant', content: 'It uses OAuth2 with PKCE...', ts: now },
    { role: 'user', content: 'Explain the auth flow', ts: now },             // duplicate
    { role: 'user', content: 'old TODO note from yesterday', ts: now - 48 * 3600 * 1000 }, // stale
    { role: 'assistant', content: 'It uses OAuth2 with PKCE...', ts: now },   // duplicate
    { role: 'user', content: 'Now add the tests', ts: now },
  ];
  const { keep, prune } = pruneAdvisor(context, { now });
  const beforeChars = JSON.stringify(context).length;
  const afterChars = JSON.stringify(keep).length;
  return { before: context.length, after: keep.length, pruned: prune.length, reduction: pct(afterChars, beforeChars) };
}

// Lever 2 — Operational precision: suppress redundant tool calls before they happen.
function benchPrecision() {
  const history = [
    { name: 'Read', args: { path: '/src/a.js' } },
    { name: 'Read', args: { path: '/src/b.js' } },
  ];
  const planned = [
    { name: 'Read', args: { path: '/src/a.js' } },  // redundant (already in history)
    { name: 'Grep', args: { pattern: 'TODO' } },     // new, worth doing
  ];
  let redundant = 0, savedCost = 0;
  for (const c of planned) {
    if (isRedundant(c, history)) { redundant++; savedCost += estimateToolCost(c.name); }
  }
  return { planned: planned.length, redundant, savedCost };
}

// Lever 4 — Output discipline: trim verbose tool/command output to head + tail + count.
function benchOutput() {
  const lines = Array.from({ length: 200 }, (_, i) => `test result line ${i}: pass`);
  const text = lines.join('\n');
  const trimmed = toolOutputAdvisor(text);
  const before = estTokens(text);
  const after = estTokens(trimmed);
  return { beforeLines: lines.length, afterLines: trimmed.split('\n').length, before, after, reduction: pct(after, before) };
}

// Read-cache prevention: flag planned reads of files already in context (re-reads = wasted tokens).
function benchReads() {
  const alreadyRead = ['/src/a.js', '/src/b.js', '/src/c.js'];
  const plan = [
    { name: 'Read', args: { file_path: '/src/a.js' } },  // already in context
    { name: 'Read', args: { file_path: '/src/b.js' } },  // already in context
    { name: 'Read', args: { file_path: '/src/d.js' } },  // new
    { name: 'Read', args: { file_path: '/src/e.js' } },  // new
  ];
  const reReads = duplicateReads(plan, alreadyRead).length;
  const savedCost = reReads * estimateToolCost('Read'); // each avoided Read
  return { planned: plan.length, reReads, savedCost };
}

// Baseline cost estimate on a long-session shape (cache-read dominates the bill).
function benchCost() {
  const m = { inputTokens: 1_800_000, cacheCreationTokens: 0, cacheReadTokens: 95_400_000, outputTokens: 1_970_000 };
  const c = estimateCost(m);
  return c;
}

function main() {
  const c = benchCompress();
  const m = benchMemory();
  const p = benchPrecision();
  const o = benchOutput();
  const r = benchReads();
  const $ = benchCost();

  console.log('# Chisel lever benchmark\n');
  console.log('Estimates are relative (chars/4 ≈ tokens); the point is the reduction, not absolutes.\n');

  console.log('Lever 3 — Token reduction  (terseProseAdvisor on agent prose)');
  console.log(`  ${c.before} tok  ->  ${c.after} tok   (-${c.reduction}%)\n`);

  console.log('Lever 1 — Memory cleanup   (pruneAdvisor on a context window)');
  console.log(`  ${m.before} entries  ->  ${m.after} entries   (pruned ${m.pruned}, size -${m.reduction}%)\n`);

  console.log('Lever 2 — Operational precision  (isRedundant on a planned tool sequence)');
  console.log(`  ${p.planned} planned calls  ->  ${p.redundant} flagged redundant   (est. cost saved: ${p.savedCost})\n`);

  console.log('Lever 4 — Output discipline  (toolOutputAdvisor on verbose command output)');
  console.log(`  ${o.beforeLines} lines  ->  ${o.afterLines} lines   (${o.before} tok -> ${o.after} tok, -${o.reduction}%)\n`);

  console.log('Read-cache prevention  (duplicateReads on a planned read sequence)');
  console.log(`  ${r.planned} planned reads  ->  ${r.reReads} flagged as re-reads   (est. cost saved: ${r.savedCost})\n`);

  console.log('Baseline — Cost estimate  (estimateCost on a ~99M-token session, default pricing)');
  console.log(`  total $${$.total.toFixed(2)}   (cache-read $${$.cacheRead.toFixed(2)}, output $${$.output.toFixed(2)}, fresh input $${$.input.toFixed(2)})\n`);

  console.log('Each lever is an ADVISOR the skill reasons with — it never auto-applies a change');
  console.log('that could lose meaning. Code/output/errors are left untouched (see terseProseAdvisor guard).');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
