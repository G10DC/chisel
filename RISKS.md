# Chisel — Risk Register

Severity: 🔴 critical · 🟠 high · 🟡 medium. Each risk has a mitigation and the phase that owns it.

| ID | Risk | Sev | Mitigation | Owner phase |
|---|---|---|---|---|
| **R1** | **Baseline measurement problem** — the load-bearing assumption: without pre-intervention metrics, all savings are unverifiable vanity. | 🔴 | Phase 0 first; nothing ships without a baseline report. | 0 |
| **R2** | **Quality measurement subjectivity** — "quality" is partly subjective; proxies are imperfect. | 🟠 | Accept explicit, pinned proxies (tests, rubric, semantic sim); multi-metric; document limits. | 0, 5 |
| **R3** | **Security in distribution/installation** — `curl \| bash` and pipe-exec are adoption blockers (seen in caveman). | 🔴 | Signed distribution; no `curl \| bash`; verified install; Phase 10 audit. | 10 |
| **R4** | **Context-specific optimization failure** — what saves tokens in one domain regresses in another. | 🟠 | Domain-aware calibration (Phase 8); multi-domain benchmark; per-domain configs. | 0, 8 |
| **R5** | **Injection surfaces / adversarial inputs** — transformations can be hijacked by untrusted content. | 🔴 | Input validation everywhere; UNTRUSTED framing; sandbox; adversarial test suite. | 10 |
| **R6** | **Over-engineering** — complexity exceeds benefit (cf. ECC's 261-skill "agent OS"). | 🟠 | Simplicity gate per phase; scope cap; "smallest design that passes the quality gate." | all |
| **R7** | **Dependency / supply-chain risk** — grows with system complexity. | 🟠 | Minimize deps; pin + audit; prefer harness/MCP over new code. | 10 |
| **R8** | **User acceptance** — optimization can *feel* like degradation even when metrics improve. | 🟡 | Transparency + user control (per-lever toggle); explain what changed. | 6 |
| **R9** | **Performance-validation paradox** — validating optimization needs a baseline, but optimization perturbs the baseline. | 🟠 | A/B optimized-vs-baseline in parallel; never measure optimized against itself. | 5 |
| **R10** | **Multi-user / org deployment** — shared settings and drift across users/teams. | 🟡 | Config profiles; per-user opt-in; no cross-user state without consent. | 6, 9 |
| **R11** | **Output elision hides signal** — trimming tool output (Lever 4) can drop an error buried in the middle. | 🟠 | Head + tail keep the boundaries (where errors surface); the marker shows the count; no line is altered. Raise the threshold if needed. | 4 |

## Top three to watch
1. **R1 (baseline)** — if Phase 0 is skipped or weak, every later claim is unfalsifiable. Non-negotiable.
2. **R3 + R5 (security)** — distribution and injection risks can prevent adoption entirely; address
   in design, audit in Phase 10.
3. **R6 (over-engineering)** — the silent project-killer; enforce the simplicity gate every phase.

## Risk cadence
- Review the register at each phase exit; add new risks discovered during validation.
- A phase does **not** exit if a 🔴 risk it owns is open and unmitigated.
