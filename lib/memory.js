// lib/memory.js
// Lever 1 — Clean memory. Pure advisor: flags context entries to prune (stale/duplicate).
// No I/O, no auto-mutation: the skill decides what to actually drop.

const DEFAULT_STALE_MS = 24 * 3600 * 1000;

/**
 * Stable signature for duplicate detection. Non-string content (e.g. transcript content arrays)
 * returns null -> not deduplicated (avoid false "duplicate" on distinct structured payloads).
 */
function sigKey(e) {
  const c = e.content;
  if (typeof c !== 'string') return null;
  return `${e.role || ''}:${c.slice(0, 200)}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isStale(e, now, staleMs) {
  return typeof e.ts === 'number' && (now - e.ts) > staleMs;
}

/**
 * Partitions entries into keep / prune.
 * @param {Array<{role?:string,content?:*,ts?:number}>} entries
 * @param {{now?:number,staleMs?:number}} [opts]
 * @returns {{keep:Array,prune:Array<{reason:string}>}}
 */
export function pruneAdvisor(entries, opts = {}) {
  const now = opts.now ?? Date.now();
  const staleMs = opts.staleMs ?? DEFAULT_STALE_MS;
  const seen = new Set();
  const keep = [];
  const prune = [];

  for (const e of entries) {
    const key = sigKey(e);
    if (key !== null && seen.has(key)) { prune.push({ ...e, reason: 'duplicate' }); continue; }
    if (isStale(e, now, staleMs)) { prune.push({ ...e, reason: 'stale' }); continue; }
    if (key !== null) seen.add(key);
    keep.push(e);
  }
  return { keep, prune };
}
