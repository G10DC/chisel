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

## Install

Chisel is a Claude Code **skill**: make the repo discoverable in the skills directory. No build step, no runtime dependencies.

**Option A — local development (symlink; live edits are picked up):**
```bash
cd /path/to/chisel
ln -sf "$PWD" ~/.claude/skills/chisel
```
**Option B — stable use (copy):**
```bash
cp -R /path/to/chisel ~/.claude/skills/chisel
```
**Verify:** start a new Claude Code session — Chisel appears among the available skills and is invoked when a task matches its description. Remove with `rm ~/.claude/skills/chisel`.

## Benchmark — what each lever does

```bash
npm run benchmark        # node scripts/benchmark.mjs
```
Representative results (relative; chars/4 ≈ tokens):
- **Lever 3 — Token reduction** (`terseProseAdvisor` on agent prose): 67 → 47 tok (**−30%**). Strips filler; code/output/errors untouched.
- **Lever 1 — Memory cleanup** (`pruneAdvisor` on a context window): 6 → 3 entries (**size −51%**). Drops duplicates + stale.
- **Lever 2 — Operational precision** (`isRedundant` on a tool plan): flags 1 of 2 planned calls as redundant (cost saved).

Each lever is an **advisor** the skill reasons with — it never auto-applies a change that could lose meaning.

### Phase 0 baseline on a real session
```bash
npm run baseline -- ~/.claude/projects/<project>/<session>.jsonl
```
Example (a long coding session): 289 turns, 264 tool calls, ~99M total tokens (95.4M cache-read, 1.8M fresh input, 1.97M output), 0 parse errors.

## Develop
```bash
npm install      # dev tools (eslint)
npm test         # offline unit tests
npm run benchmark
npm run baseline # node scripts/baseline.mjs <transcript.jsonl>
npm run lint     # eslint
```

## Status
v0.1.0 — repo scaffold, Phase 0 baseline instrument, and the three lever advisors with tests.
Phases 1→10 per `ROADMAP.md`.
