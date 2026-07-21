# Chisel — Architecture

## Core idea: an intercept layer
Chisel sits **between user intent and agent execution** as a filter/transform/route layer. It does
not replace the agent; it conditions what enters and leaves it.

```
user intent
   │
   ▼
┌─────────────────────────── Chisel intercept layer ───────────────────────────┐
│                                                                              │
│  1. Memory Cleanup   ──► prune stale/duplicate context                       │
│  2. Operational Precision ──► model tool cost, suppress redundant calls,      │
│                              detect done-state and stop early                 │
│  3. Token Reduction  ──► compress language (syntactic → optional semantic)   │
│  4. Output Discipline ──► trim verbose tool output (head + tail + count)      │
│  +  Read-cache ──► no re-reads of files already in context                    │
│  +  Code navigation ──► read a symbol, not the whole file                     │
│                                                                              │
│  cross-cutting:  Measure (baseline + cost + edit-cycle) · Context discipline  │
│                   (window budget) · Validate · Log · Toggle                  │
└──────────────────────────────────────────────────────────────────────────────┘
   │
   ▼
agent execution (Agent environment harness)
   │
   ▼
quality + cost telemetry ──► A/B vs. baseline ──► keep / rollback
```

## The layers

### Layer 1 — Memory Cleanup
- **Responsibility**: keep the working context lean and high-signal.
- **Mechanisms**: staleness eviction, near-duplicate dedup, cold-segment summarization.
- **Integration**: reuses the **context-mode MCP** (pull-based context) rather than reimplementing.
- **Reference**: Context-Engine-agent/Context-Engine (semantic memory via MCP).

### Layer 2 — Operational Precision
- **Responsibility**: do no more than necessary.
- **Mechanisms**:
  - **Tool cost model** + routing — suppress redundant/overlapping tool calls, batch safe ones.
  - **Early stopping** — detect verifiable done-states and halt.
  - **Read-cache** (`lib/reads.js`) — flag re-reads of files already in context (no FS access, pure
    path comparison).
- **Anti-pattern avoided**: ECC's "operating system for agents" (261+ skills) = over-engineering.
  Chisel keeps this layer small and measurable.

### Cross-cutting — Context discipline
- **Responsibility**: the *window* is the largest token sink; an over-filled window degrades both
  cost and quality (retrieval 92%→78% from 256K→1M tokens; reasoning depth falls).
- **Rules** (in `SKILL.md` + drop-in `AGENT.md`): stay under ~120K tokens / 12% of the window;
  compact manually at ~60% (never auto-compact at 95%); `/rewind` on errors; plan first; feed
  Markdown not HTML/PDF/DOCX; `/btw` for lateral questions.
- **Non-runtime**: these are operational guidance, not a hook — they cost zero and compound with
  every lever.

### Cross-cutting — Measure
- **Phase 0 baseline** (`scripts/baseline.mjs`): tokens (incl. cache), tool calls, turns.
- **Cost estimate** (`estimateCost`): per-component USD weighting (cache read ≈ 0.1×, cache write
  ≈ 1.25×, output most expensive) — aligns with ccusage-style offline reporting.
- **Retry proxy** (`editCycles` / `repeatEdits`): files edited more than once signal one-shot
  failures / fix loops (the CodeBurn "where tokens burn" lens).

### Layer 3 — Token Reduction
- **Responsibility**: say the same thing in fewer tokens.
- **Mechanisms** (progressive):
  - **Conservative / syntactic** (Phase 4): lossless language compression (terse, no meaning loss).
  - **Semantic** (Phase 7, optional): meaning-preserving rewrite.
- **Reference (not dependency)**: huggingface/tokenizers — for understanding token boundaries only.

### Layer 4 — Output discipline
- **Responsibility**: keep tool/command output (tests, logs, `find`) from flooding the context.
- **Mechanism**: head + tail window with an omission count; never alters individual lines.
- **Code navigation** (auxiliary): `symbolSlice` reads one function/block by name, not the whole file.

## Agent environment integration
- Implemented as a **Agent skill** (this repo) consumed by the harness.
- Hooks into the agent loop at the natural intercept points (pre-tool, pre-step, pre-response).
- Leverages **context-mode MCP** for memory/context operations (composable, not reinvented).
- Leverages **@ai-sdk/provider** / `ai` packages for API plumbing where relevant.
- Four runtime **levers** (memory / precision / reduction / output) + a **master kill-switch**; each is
  independently toggleable and logged.

## Data flow per turn
1. **Measure** incoming context size + expected tool cost.
2. **Memory cleanup** prunes.
3. **Operational precision** decides which tool calls (if any) are worth it; checks done-state.
4. **Token reduction** compresses the agent's output language.
5. **Log** what changed + measured delta; **A/B** against baseline; **rollback** if quality drops.

## Design constraints (from requirements)
- Every layer is **reversible** (rollback) and **measurable** (vs. baseline).
- **No network/scraping** at runtime; **no arbitrary code execution** from inputs.
- **Simplicity gate**: each layer stays minimal; scope creep triggers review, not addition.
