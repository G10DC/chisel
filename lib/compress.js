// lib/compress.js
// Lever 3 — Word reduction for AGENT PROSE only.
// Reduces verbal filler in natural-language narrative. It is NOT safe on code, command output,
// error text, JSON, or any verbatim content: such text is detected heuristically and returned
// UNCHANGED. Apply only to the agent's own prose, never to content that must be preserved verbatim.

// Standalone filler only: not adjacent to a word char or a hyphen, so hyphenated compounds
// like "just-in-time" or "basically-sound" are never corrupted.
const FILLER = /(?<![\w-])(let me|i'll|i will|i am going to|just|basically|actually|i think|i guess|you know)(?![\w-])/gi;

// Opener pleasantries at the start of a line. Trailing punctuation is REQUIRED, so a real
// conjunction like "So the result is correct" (no comma) is never stripped.
const OPENER_PLEASANTRIES = /^\s*(sure|of course|certainly|right|ok|okay|well|so|now|great|perfect|got it|alright|anyway)[,.!]\s+/gim;

/**
 * Best-effort guard: text that looks like code / structured / verbatim content must not be touched.
 * Conservative by design — when in doubt, return unchanged (never corrupt technical text).
 */
function isLikelyCodeOrStructured(text) {
  const t = String(text);
  if (t.includes('```')) return true;                          // fenced code block
  if (/"[^"\n]*"|'[^'\n]*'/.test(t)) return true;              // quoted strings (code/data)
  if (/;\s*$/.test(t) || /(^|\n)\s{4,}\S/.test(t)) return true; // statement terminators / deep indent
  if (/=\s*[^=\n]/.test(t) && /[{};]/.test(t)) return true;    // assignment + braces/semicolons
  return false;
}

/**
 * Reduces filler in AGENT PROSE (narrative text). Returns the input UNCHANGED if it looks like
 * code, command output, quoted strings, or other structured content. Safe to apply to the agent's
 * own prose; the SKILL must never apply it to user content or output that must be echoed verbatim.
 * @param {string} text
 * @returns {string}
 */
export function terseProseAdvisor(text) {
  const t = String(text ?? '');
  if (isLikelyCodeOrStructured(t)) return t;
  return t
    .replace(OPENER_PLEASANTRIES, '')
    .replace(/^\s*(let me|i'll|i will|i am going to)\s+/i, '')
    .replace(FILLER, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
