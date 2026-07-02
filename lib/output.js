// lib/output.js
// Lever 4 — Output discipline. Trims verbose tool/command output (test runs, find, logs) to a
// head + tail window with an omission count. Pure and code-safe: it never alters individual
// lines, only elides a contiguous middle run. Language-agnostic.

/**
 * Trims an output block to a head + tail window, replacing the elided middle with a count marker.
 * Returns the input unchanged when it is short enough (<= threshold lines).
 * @param {string} text
 * @param {{head?:number, tail?:number, threshold?:number}} [opts]
 * @returns {string}
 */
export function toolOutputAdvisor(text, opts = {}) {
  const head = opts.head ?? 15;
  const tail = opts.tail ?? 15;
  const threshold = opts.threshold ?? head + tail + 5;
  const raw = String(text ?? '');
  const lines = raw.split('\n');
  if (lines.length <= threshold) return raw;
  const omitted = lines.length - head - tail;
  return [...lines.slice(0, head), `… [${omitted} lines omitted]`, ...lines.slice(-tail)].join('\n');
}
