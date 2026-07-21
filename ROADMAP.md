# Chisel — Action Plan / Roadmap

Ordering principle: **baseline first, optimize later, validate each layer independently, rollback
if the quality gate fails.** Phases 0→6 are the core path; 7→9 are optional and gated on prior
success; 10 hardens for production.

## Shipped (v0.1–v0.3)
Already implemented as **pure, tested advisors** (ahead of the phased rollout — the measurable
building blocks the phases operationalize):
- **Phase 0** — `scripts/baseline.mjs`: transcript metrics (tokens incl. cache, tool calls, turns),
  a **USD cost estimate** (`estimateCost`, per-component weighting), and an **edit-cycle retry proxy**
  (`edits` / `editCycles` / `repeatEdits`).
- **Lever 1** — `lib/memory.js` `pruneAdvisor` (stale/duplicate context).
- **Lever 2** — `lib/precision.js` `estimateToolCost` / `isRedundant` (tool cost + redundancy).
- **Lever 3** — `lib/compress.js` `terseProseAdvisor` (lossless, EN+IT, code-safe).
- **Lever 4** — `lib/output.js` `toolOutputAdvisor` (trim verbose tool output: −85% on a 200-line sample).
- **Read-cache** — `lib/reads.js` `shouldRead` / `duplicateReads` (flag re-reads of files already in context).
- **Code navigation** — `lib/symbols.js` `symbolSlice` (extract one function/block by name).
- **Context discipline** — operational rules in `SKILL.md` + drop-in `AGENT.md`: ~120K budget,
  manual compact at ~60%, `/rewind` on errors, plan-first, Markdown-first, `/btw`.
- **Drop-in** — `AGENT.md` terse rules for any project.

Phases 5+ (validation/rollback infra, progressive rollout, production hardening) remain the gating
work before a production release.

## At a glance

| Phase | Weeks | Goal | Exit criteria (DoD) |
|---|---|---|---|
| **0** | 1–2 | Baseline measurement infrastructure | Baseline report (tokens/latency/quality) exists for the benchmark suite. |
| **1** | 3–5 | Memory cleanup (context pruning) | Quality ≥ baseline − ε; context size measurably reduced. |
| **2** | 6–8 | Operational precision — tool routing | Redundant tool calls ↓; success rate unchanged. |
| **3** | 9–10 | Operational precision — early stopping | Avg steps ↓ on verifiable-done tasks; no incomplete work. |
| **4** | 11–13 | Token reduction — conservative compression | Output token rate ↓; semantic-equivalence ≈ 1. |
| **5** | 14–15 | Validation + rollback infrastructure | A/B harness + per-layer kill-switch working. |
| **6** | 16–20 | Progressive rollout + calibration | Per-user/domain enablement + telemetry live. |
| **7\*** | 21–24 | Semantic compression (optional) | Stacks over FR-4; quality gate holds. |
| **8\*** | 25–28 | Domain-aware calibration (optional) | Per-domain configs; no cross-domain regressions. |
| **9\*** | 29–32 | Cross-session learning (optional) | Opt-in persistence; no PII leak; user-wipeable. |
| **10** | 33–36 | Production hardening + security audit | Signed distribution; audit passes; no `curl\|bash`. |
| **continuous** | ongoing | Monitoring & iteration | Telemetry dashboard; monthly quality-vs-cost review. |

## Phase detail

### Phase 0 — Baseline measurement (W1–2) *[gating: nothing else starts without this]*
- Build a representative task benchmark (coding, Q&A, refactor, debugging) + a quality scoring
  method (tests pass, review rubric, semantic similarity) — accept imperfect proxies, but pin them.
- Instrument: prompt/completion/tool tokens, latency, step count, success rate.
- **Deliverable**: `baseline.md` — the single source of truth every phase is measured against.

### Phase 1 — Memory cleanup (W3–5)
- Context pruning: drop stale turns, dedupe near-identical entries, summarize cold segments.
- Integrates with context-mode MCP (reuse, don't reinvent).
- **Exit**: memory-heavy tasks show context reduction with quality ≥ baseline − ε.

### Phase 2 — Tool routing (W6–8)
- Per-tool cost model; suppress redundant/overlapping calls; batch where safe.
- **Exit**: fewer tool calls, same success rate.

### Phase 3 — Early stopping (W9–10)
- Done-state detection; halt when the task is verifiably complete.
- **Exit**: avg steps ↓ without incomplete deliveries.

### Phase 4 — Conservative compression (W11–13)
- Lossless syntactic compression of the agent's language (terse, no meaning loss).
- **Exit**: token rate ↓; paraphrase-equivalence test ≈ 1.

### Phase 5 — Validation + rollback (W14–15)
- A/B harness (optimized vs. baseline), per-layer flags, one-switch rollback.
- **Exit**: any layer toggleable; automated quality+cost report per run.

### Phase 6 — Progressive rollout + calibration (W16–20)
- Enable layers incrementally; collect user feedback; calibrate aggressiveness.
- **Exit**: per-lever telemetry + opt-in/out working.

### Phases 7–9 — Optional advanced (W21–32)
- 7: semantic compression (meaning-preserving rewrite beyond syntax).
- 8: domain-aware calibration (ML/UI/CLI/data profiles).
- 9: cross-session learning (opt-in, user-wipeable, no PII).
- **Each gated**: only proceeds if prior phases cleared their quality gate.

### Phase 10 — Production hardening (W33–36)
- Dependency pinning + supply-chain audit; signed distribution (no `curl | bash`).
- Adversarial-input test suite; input-validation 100%; security review.

## Continuous operations
- Telemetry dashboard (tokens, latency, quality proxy, layer adoption).
- Monthly review: **quality-vs-cost** trend (quality is the lead indicator).

## Sequencing rules
1. **Never skip Phase 0.** Optimization without a baseline is unmeasurable → unverifiable → unsafe.
2. **Quality gate before tokens.** A phase that fails the quality gate is rolled back, not "tuned."
3. **One lever at a time** during validation, so gains are attributable.
4. **Optional phases are optional.** Ship the core (0–6, 10) even if 7–9 are dropped.
