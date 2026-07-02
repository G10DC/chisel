# CLAUDE.md — token discipline (drop-in from Chisel)

Compact rules to cut tokens without losing quality. Drop into your project as `CLAUDE.md`
(or merge the rules into your existing one). See the `chisel` skill for the matching advisors.

## Output
- Be terse: code first, prose only if needed. No filler ("let me", "basically", "just", "Certo,", "praticamente").
- No preamble or closing ceremony. No restating the request.
- Stop when done — no speculative follow-ups.

## Context (memory)
- Don't re-read files already in context; prefer a targeted query over a bulk read.
- Drop stale/duplicate context. Never paste the same large block twice.
- Before a big read, ask: can a smaller query get the answer?

## Tools (precision)
- Before a tool call, confirm it is not redundant with one already done.
- Don't re-read a file already in context.
- Batch independent calls. Early-stop when the task is verifiably done.
- Trim verbose command/test output to head + tail + a count; don't dump hundreds of lines.

## Context discipline (window budget)
- Stay under ~120K tokens / 12% of the window — more is worse (context rot), not better.
- Compact manually at ~60%: summary → `/clear` → paste. Never rely on auto-compact at 95%.
- On an error, `/rewind` to drop the failed turn; don't reason over poisoned context.
- Plan first (~3K) to one-shot; avoid ~20K of edit→test→fix retries.
- Markdown first: convert HTML/PDF/DOCX to Markdown before feeding (−33% to −90%).
- `/btw` for lateral questions that must not pollute the history.

## Never compress
- Errors, failures, security warnings — full fidelity.
- Anything that must be verified verbatim. Clarity beats brevity when unsure.
