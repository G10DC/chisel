# Chisel 🔨

A **Claude Code skill** that minimizes token consumption across three complementary levers —
**word reduction, clean memory, precise/punctual action** — **without reducing performance**.

> *A chisel removes the superfluous with precision to reveal the form underneath. Chisel does the
> same for the agent's token budget: cut what is redundant, keep what changes the outcome, never
> blur the result.*

## Why
Token cost grows faster than quality. Most "optimizations" trade correctness for savings and
nobody measures it. Chisel's first principle is the opposite: **measure the baseline first,
optimize only what is proven not to degrade quality, ship each layer behind a validation gate.**

## The three levers
| Lever | Question it answers | Chisel layer |
|---|---|---|
| **Word reduction** | Can the same intent be expressed in fewer tokens? | Token Reduction (compression) |
| **Clean memory** | Is the context free of stale/redundant material? | Memory Cleanup (pruning) |
| **Precise action** | Are tool calls and steps minimal and non-redundant? | Operational Precision (routing + early-stop) |

An **intercept layer** sits between user intent and agent execution: it filters, compresses, and
routes — never silently degrading output.

## Non-negotiables
1. **Performance preservation** — quality vs. baseline is the primary metric, not tokens saved.
2. **Measurement before optimization** — Phase 0 instruments the current state before anything changes.
3. **Security by design** — no `curl | bash`, no pipe execution without verification, input validation everywhere.
4. **Simplicity over comprehensiveness** — avoid the 261-skills over-engineering trap.
5. **Transparency & user control** — optimization is visible and toggleable.

## Repository layout
```
chisel/
├── SKILL.md             # the Claude Code skill (frontmatter + 3 levers)
├── README.md            # this file — vision + principles
├── REQUIREMENTS.md      # functional + non-functional requirements (FR/NFR)
├── ROADMAP.md           # action plan: Phase 0→10, milestones, exit criteria
├── ARCHITECTURE.md      # 3-layer intercept design + Claude Code integration
├── RISKS.md             # risk register + mitigations
├── STATE_OF_THE_ART.md  # the 6 reference repos: what to reuse / avoid
├── scripts/
│   └── baseline.mjs     # Phase 0 — transcript metrics (token/tool/turn)
├── lib/                 # lever advisors (pure, tested)
│   ├── memory.js        #   Lever 1 — pruneAdvisor (stale/duplicate)
│   ├── precision.js     #   Lever 2 — estimateToolCost / isRedundant
│   └── compress.js      #   Lever 3 — terseAdvisor (lossless)
├── test/                # node:test (offline)
└── refs/
    └── REFERENCES.md    # links: repos, inspiration sources, tooling
```

## Install as a Claude Code skill
```bash
# symlink (or copy) the skill into your Claude skills dir
ln -s "$PWD" ~/.claude/skills/chisel
```
Then Chisel is available in any session; Claude invokes it when the task fits the description in `SKILL.md`.

## Develop
```bash
npm install      # dev tools (eslint)
npm test         # offline unit tests
npm run baseline # node scripts/baseline.mjs <transcript.jsonl>
npm run lint     # eslint
```

## Provenance
Chisel was designed by running **GitResearcher** (../GitResearcher) on the idea *"a Claude Code
skill that minimizes token usage by being concise, keeping a clean memory, and acting precisely,
without losing performance."* The full source analysis lives in
`../GitResearcher/projects/20260702_134724/` (6 repos × 2 lenses, 5 modules, adversarial review,
inspiration). These docs are the actionable distillation of that report.

## Status
**Planning / requirements phase.** No code yet — by design: Phase 0 (baseline measurement) must
precede any implementation. See `ROADMAP.md`.
