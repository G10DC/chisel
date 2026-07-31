---
name: chisel
description: Compresses and prunes conversational context in-flight to prevent context rot — word-level compression, stale-turn pruning, duplicate tool-call detection, and output truncation with head/tail summaries. Use for/when the context window is filling up mid-task, an agent starts repeating tool calls, or logs/outputs are flooding the transcript. Never compress code, regex, or literal strings; never trigger a full sandbox restart (use portage) or a filesystem rollback (use chronicle-session-memory) — chisel only prunes conversational context, it never touches disk state.
---

# chisel

Long-running agent sessions degrade semantically long before they run out of tokens — noise
crowds out signal. One rule above all: **reduce token load without ever touching semantic
payload, code, or literal strings.**

## Golden rules

1. **Code is untouchable.** Under no circumstances compress or alter code syntax, regex
   patterns, or literal strings — this is a hard boundary, not a tuning knob.
2. **Measure before optimizing.** Run `scripts/baseline.mjs` to establish a turn-by-turn token
   baseline before applying any lever; optimization without a baseline is guessing.
3. **Prune by age and redundancy, not by size alone.** Stale turns and outdated terminal output
   are candidates for deletion; large-but-current context is not.
4. **Deduplicate before truncating.** Catching a repeated `list_dir`/`cat` in consecutive turns
   (lever 3) is cheaper than truncating its output after the fact (lever 4) — apply routing
   before output discipline.
5. **Truncation must stay reversible in spirit.** Head/tail summaries with total line counts let
   the agent ask for the missing middle; silent deletion does not.

## The 4 levers

1. **Token Reduction** (`lib/compress.js`) — bilingual (EN/IT) word compression of prompts and
   thinking blocks, semantic payload untouched.
2. **Memory Cleanup** (`lib/memory.js`, `pruneAdvisor`) — flags stale turns and dead terminal
   output by age + redundancy.
3. **Operational Precision** (`lib/precision.js`) — intercepts duplicate read/tool-call
   operations across consecutive turns.
4. **Output Discipline** (`lib/output.js`, `toolOutputAdvisor`) — truncates oversized command
   output into head(N)/tail(M)/total-lines summaries.

## When to use

- Context window usage is climbing and semantic degradation is visible (repeated questions,
  lost earlier decisions within the *same* running session).
- An agent repeats a read operation it already performed this turn or the previous one.
- A tool call returns a wall of log output that would otherwise flood the transcript.

## When NOT to use

- **The agent has genuinely lost track of earlier decisions and needs a clean restart** →
  use `portage`. Chisel prunes noise inside a live session; it does not reset the session.
- **You need to roll the filesystem back to a known-clean state** (a refactor went wrong,
  you need pre-change state) → use `chronicle-session-memory`. Chisel never touches disk.
- **The task needs a workspace checkpoint/hash for audit, not just less noise** →
  `chronicle-session-memory` owns state hashing; chisel does not produce checkpoints.
