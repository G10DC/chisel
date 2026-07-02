# Chisel — Requirements

Functional (FR) and non-functional (NFR) requirements. Each FR maps to a roadmap phase and has an
**acceptance criterion** (measurable, baseline-relative). The numbering follows implementation order.

## Global acceptance — Definition of Done (per layer)
A layer ships only when **all** hold:
- **Quality gate**: output quality on the benchmark suite is **≥ baseline − ε** (no measurable degradation).
- **Token delta**: measured before/after savings are reported with confidence interval.
- **Rollback**: the layer can be disabled at runtime with zero side-effects.
- **Security**: passes the input-validation / no-pipe-exec checklist (see `RISKS.md`).

---

## Functional requirements

| ID | Phase | Requirement | Acceptance criterion |
|---|---|---|---|
| **FR-0** | 0 | **Baseline instrumentation**: capture current token consumption (prompt/completion/tool), latency, and a quality baseline across representative tasks. | Baseline report exists; all later optimizations reference it. |
| **FR-1** | 1 | **Memory cleanup**: detect and prune stale/duplicate/low-value context entries before each step. | Context size reduced with quality ≥ baseline − ε on memory-heavy tasks. |
| **FR-2** | 2 | **Tool cost modeling + routing**: estimate per-tool token cost and suppress redundant/low-value calls. | Tool-call count ↓ on benchmark tasks with success rate unchanged. |
| **FR-3** | 3 | **Early stopping**: detect task completion and halt instead of over-executing. | Avg steps-to-completion ↓ on tasks with a verifiable done-state; no incomplete deliveries. |
| **FR-4** | 4 | **Conservative (syntactic, lossless) compression**: shorten the agent's own language without dropping meaning. | Output token rate ↓; semantic-equivalence score ≈ 1 on a paraphrase test set. |
| **FR-5** | 5 | **Validation + rollback infrastructure**: A/B harness comparing optimized vs. baseline, with one-switch rollback. | Any layer toggleable; A/B produces a quality+cost report. |
| **FR-6** | 6 | **Progressive rollout + calibration**: enable layers incrementally per user/domain, with feedback. | Per-layer telemetry; users can opt in/out per lever. |
| **FR-7** | 7* | **Semantic compression** (optional): meaning-preserving rewrite beyond syntax. | Quality gate holds; gains stack measurably over FR-4. |
| **FR-8** | 8* | **Domain-aware calibration** (optional): tune aggressiveness by task type (ML/UI/CLI/data). | Per-domain config; no cross-domain regressions. |
| **FR-9** | 9* | **Cross-session learning** (optional): carry calibrated settings across sessions (opt-in). | Settings persist; no PII leak; user can wipe. |
| **FR-10** | 10 | **Production hardening + security audit**: pin deps, signed distribution, adversarial input suite. | Security audit passes; no `curl\|bash`; input-validation 100%. |
| **FR-11** | 4 | **Output discipline**: trim verbose tool/command output to head + tail + omission count. | Output size ↓ on verbose commands (e.g. test runs); no line altered, only the middle elided. |
| **FR-12** | 4 | **Code navigation**: extract a single function/block by name instead of reading the whole file. | A named symbol is returned in full; absent names return null (no guess). |
| **FR-13** | — | **Drop-in rules**: ship a `CLAUDE.md` with terse token-discipline rules for any project. | The file is self-contained and usable without the skill mechanics. |

*\* optional phases — ship only if earlier phases clear their quality gate.*

## Cross-cutting functional requirements

| ID | Requirement | Acceptance |
|---|---|---|
| **FR-T1** | **Transparency**: every optimization logs what it changed and the measured impact. | A readable per-run changelog of applied optimizations. |
| **FR-T2** | **User control**: each of the 4 levers independently toggleable; global kill-switch. | Four flags + master switch, all honored. |
| **FR-T3** | **Composability**: integrate with the Claude Code harness + context-mode MCP; do not reinvent tokenization. | Uses harness hooks/MCP; `huggingface/tokenizers` is a reference, not a runtime dep. |

---

## Non-functional requirements

| ID | Requirement | Rationale |
|---|---|---|
| **NFR-1 Performance preservation** | Output quality must not degrade vs. baseline (the user's hard constraint). | The whole point; token savings without quality is failure. |
| **NFR-2 Security by design** | No arbitrary code execution from inputs; signed distribution; validated install. | State-of-the-art repos shipped `curl\|bash` and injection surfaces — must avoid. |
| **NFR-3 Simplicity** | Prefer the smallest design that passes the quality gate; cap scope per phase. | Over-engineering (cf. ECC's 261-skills OS) is an explicit risk. |
| **NFR-4 Measurability** | Every change is measured before/after against the baseline. | "Optimization without measurement is vanity." |
| **NFR-5 Latency** | Optimization overhead must be ≪ the token savings it enables. | Compression that costs more than it saves is a net loss. |
| **NFR-6 Reversibility** | Every layer is independently rollback-able; no irreversible state. | Progressive deployment requires safe rollback. |
| **NFR-7 Transparency** | Users can see and control what is optimized. | Optimization that "feels like degradation" harms adoption even when correct. |

---

## Out of scope (non-goals)
- Becoming a general-purpose LLM wrapper or agent framework.
- Token savings that trade away correctness for a number.
- Scraping / external network calls as part of optimization.
