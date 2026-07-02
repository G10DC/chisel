// lib/precision.js
// Lever 2 — Precise action. Pure helpers: tool-cost estimate + redundancy detection.

/** Rough relative token cost of a tool (higher = more expensive to invoke). */
const BASE_COST = { Read: 1, Edit: 1, Grep: 1, Glob: 1, Bash: 2, WebFetch: 5, WebSearch: 5, Task: 8 };

/** Estimated relative cost of invoking a tool by name (unknown tools default to 2). */
export function estimateToolCost(name) {
  return BASE_COST[name] ?? 2;
}

function stableSig(args) {
  try { return JSON.stringify(args ?? {}); } catch { return String(args); }
}

/** True if an identical call (same tool + same args) is already in history. */
export function isRedundant(call, history) {
  const sig = stableSig(call.args);
  return (history || []).some((h) => h.name === call.name && stableSig(h.args) === sig);
}
