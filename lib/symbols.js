// lib/symbols.js
// Code-navigation lever (heuristic, zero-dep). Extracts a single function/method/block by name,
// so you can read only the symbol you need instead of the whole file. Best-effort brace matching
// for { }-delimited languages (JS/TS/Rust/Go/C-like). Returns null if the symbol is not found.

const KEYWORDS = 'function|def|fn|func|const|let|var|class|async function|pub fn|impl';

/** Escapes a string for safe embedding in a RegExp. */
function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts the source of the block whose declaration line contains `name` (after a function-like
 * keyword), up to the matching closing brace. Returns null if not found or braces are unbalanced.
 * @param {string} code
 * @param {string} name
 * @returns {string|null}
 */
export function symbolSlice(code, name) {
  const src = String(code ?? '');
  if (!name) return null;
  const re = new RegExp(`(^|\\n)[^{}\\n]*(?:${KEYWORDS})\\s+${escapeRe(name)}\\b[^{};]*\\{`);
  const m = src.match(re);
  if (!m) return null;
  const declStart = m.index + (m[1] ? m[1].length : 0);
  const openBrace = src.indexOf('{', declStart);
  if (openBrace < 0) return null;
  let depth = 0;
  for (let i = openBrace; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(declStart, i + 1).trim();
    }
  }
  return null; // unbalanced braces
}
