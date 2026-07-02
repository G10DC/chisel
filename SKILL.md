---
name: chisel
description: Minimize token usage across four levers — concise prose, clean memory, precise action, lean output — without degrading output quality. Bilingual (English + Italian) and code-safe (never alters code/strings/output). Use on long sessions, large contexts, repetitive tool calls, or when cost/latency matter. Measure before optimizing; never trade quality for tokens.
---

# Chisel

Cut tokens, keep quality. Four levers, applied in order. One rule above all:
**measure the baseline before optimizing; never ship a change that degrades quality.**

## Golden rules
1. **Quality is the metric, not tokens.** A saving that loses correctness is a bug.
2. **Measure first.** Run `scripts/baseline.mjs` on a transcript before and after any change.
3. **Say less, same meaning.** No filler, no preamble, no restating the request.
4. **Read once, remember.** Don't re-read files already in context; prefer search/execute over bulk reads.
5. **Act, don't narrate.** Drop "let me…", "I'll now…", "here's what I'll do".
6. **Stop when done.** No speculative follow-ups, recaps, or "let me know if…" unless asked.

## Lever 1 — Clean memory
- Prefer **search/execute over read** for large outputs (`ctx_search`, `ctx_execute_file`).
- Drop stale context: a fact used once and not recurring should not be echoed.
- Deduplicate: never paste the same large block twice.
- Before a big read, ask: can a smaller query get the answer?

## Lever 2 — Precise action
- Before a tool call, confirm it is not redundant with one already in context.
- Batch independent calls; don't serialize what can parallelize.
- **Early stop**: when the request is satisfied, stop. No speculative extra steps.

## Lever 3 — Word reduction
- Densest correct form: code first, prose only if needed.
- Terse by default: fragments over sentences when unambiguous.
- No restating the user's words back. No ceremonial openers or closers.
- Bilingual (EN + IT) and code-safe: strips filler/openers in both languages, never alters code, strings, or output.

## Lever 4 — Output discipline
- Trim verbose tool/command output (tests, logs, `find`) to head + tail + an omission count; don't dump hundreds of lines.
- Never alter individual lines — only elide a contiguous middle run.

## Code navigation
- Read only the symbol you need, not the whole file (function/block extraction by name).
- Don't re-read files already in context — check the read set first (`lib/reads.js`).

## Context discipline (window budget, not word count)
The biggest token sink is an over-filled window: retrieval drops (92%→78% from 256K→1M tokens) and
reasoning depth falls as the session grows. A 500K-token session scores worse than a 200K one.
- **Stay under ~120K tokens / 12% of the window.** The large window is insurance, not a target.
- **Compact manually at ~60%**: ask for a summary → `/clear` → paste it. Never trust auto-compact
  at 95% (it runs at peak degradation, loses 70–80% of detail).
- **On an error, `/rewind`** to drop the failed turn; don't reason further over poisoned context.
- **Plan first.** ~3K tokens of plan up front avoids ~20K of edit→test→fix retries.
- **Markdown first.** Convert HTML/PDF/DOCX to Markdown before feeding (HTML −90%, PDF −65/70%,
  DOCX −33%).
- **`/btw` for lateral questions** (regex, syntax) that must not pollute the history.

## When NOT to compress
- Errors, failures, security warnings — full fidelity always.
- Anything the user must verify verbatim.
- When in doubt: clarity beats brevity.

## Tools (reason with these, don't auto-apply)
- `scripts/baseline.mjs <transcript.jsonl>` — token/tool/turn metrics, USD cost estimate, and an edit-cycle retry proxy (Phase 0).
- `lib/memory.js` `pruneAdvisor` — flags stale/duplicate context entries.
- `lib/precision.js` `estimateToolCost` / `isRedundant` — tool-cost + redundancy checks.
- `lib/reads.js` `shouldRead` / `duplicateReads` — flags re-reads of files already in context.
- `lib/compress.js` `terseProseAdvisor` — filler reduction for the agent's PROSE only (never apply to code/output/errors; it auto-skips text that looks structured).
- `lib/output.js` `toolOutputAdvisor` — trims verbose tool/command output to head + tail + count.
- `lib/symbols.js` `symbolSlice` — extracts a single function/block by name (read the symbol, not the file).
- `CLAUDE.md` — drop-in token-discipline rules for any project.
