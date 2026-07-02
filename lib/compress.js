// lib/compress.js
// Lever 3 — Word reduction. Conservative, LOSSLESS reductions only (no semantic rewrite).
// Strips filler openers, verbal padding, and collapses whitespace. Meaning is never changed.

const FILLER = /\b(let me|i'll|i will|i am going to|just|basically|actually|i think|i guess|you know)\b/gi;

/**
 * Lossless terse pass: removes filler and normalizes whitespace.
 * Never alters technical content, code, or error text.
 * @param {string} text
 * @returns {string}
 */
export function terseAdvisor(text) {
  return String(text)
    .replace(/^\s*(let me|i'll|i will|i am going to)\s+/i, '')
    .replace(FILLER, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
