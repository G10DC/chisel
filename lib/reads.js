// lib/reads.js
// Lever 1/2 extension — read-cache advisor. Flags re-reads of files ALREADY in context so the
// agent does not pay for the same bytes twice (SuperClaude's local-cache idea, but pure: it only
// compares paths, never touches the filesystem or the context). Code-safe by definition (no output).

import { posix } from 'node:path';

/** Deterministic path key: unify separators, drop ./ and trailing slash so variants match. */
function pathKey(p) {
  if (typeof p !== 'string' || p === '') return '';
  return posix.normalize(p.replace(/\\/g, '/')).replace(/\/$/, '');
}

/** Extract a file path from a tool-call-like object (Read/Write/Edit) or a bare string. */
function readPath(call) {
  if (call == null) return null;
  if (typeof call === 'string') return call;
  const args = call.args ?? call.input ?? {};
  return call.path ?? args.file_path ?? args.notebook_path ?? args.path ?? null;
}

/**
 * Advises whether `path` needs reading given the set of paths already in context.
 * @param {string} path
 * @param {string[]} alreadyRead paths already present in context
 * @returns {{read: boolean, reason: string}}
 */
export function shouldRead(path, alreadyRead = []) {
  const key = pathKey(path);
  if (key === '') return { read: true, reason: 'empty' };
  const seen = new Set((alreadyRead || []).map(pathKey).filter(Boolean));
  return seen.has(key)
    ? { read: false, reason: 'already-in-context' }
    : { read: true, reason: 'new' };
}

/**
 * Returns the planned reads that are already in context (re-reads = wasted tokens).
 * @param {(string|{name?:string, args?:object, input?:object, path?:string})[]} plan
 * @param {string[]} alreadyRead
 * @returns {{path: string, reason: string}[]}
 */
export function duplicateReads(plan, alreadyRead = []) {
  const seen = new Set((alreadyRead || []).map(pathKey).filter(Boolean));
  const dupes = [];
  for (const call of plan || []) {
    const p = readPath(call);
    const key = pathKey(p);
    if (key && seen.has(key)) dupes.push({ path: p, reason: 'already-in-context' });
  }
  return dupes;
}
