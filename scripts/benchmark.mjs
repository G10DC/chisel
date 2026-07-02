#!/usr/bin/env node
// scripts/benchmark.mjs
// Benchmark: what each Chisel lever does and how much it saves on representative inputs.
// Token estimate: chars / 4 (rough; the RELATIVE reduction is what matters for comparison).
// Usage: node scripts/benchmark.mjs

import { pathToFileURL } from 'node:url';
import { pruneAdvisor } from '../lib/memory.js';
import { estimateToolCost, isRedundant } from '../lib/precision.js';
import { terseProseAdvisor } from '../lib/compress.js';

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

function main() {
  const c = benchCompress();
  const m = benchMemory();
  const p = benchPrecision();

  console.log('# Chisel lever benchmark\n');
  console.log('Estimates are relative (chars/4 ≈ tokens); the point is the reduction, not absolutes.\n');

  console.log('Lever 3 — Token reduction  (terseProseAdvisor on agent prose)');
  console.log(`  ${c.before} tok  ->  ${c.after} tok   (-${c.reduction}%)\n`);

  console.log('Lever 1 — Memory cleanup   (pruneAdvisor on a context window)');
  console.log(`  ${m.before} entries  ->  ${m.after} entries   (pruned ${m.pruned}, size -${m.reduction}%)\n`);

  console.log('Lever 2 — Operational precision  (isRedundant on a planned tool sequence)');
  console.log(`  ${p.planned} planned calls  ->  ${p.redundant} flagged redundant   (est. cost saved: ${p.savedCost})\n`);

  console.log('Each lever is an ADVISOR the skill reasons with — it never auto-applies a change');
  console.log('that could lose meaning. Code/output/errors are left untouched (see terseProseAdvisor guard).');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
