# Chisel 🔨

A **Claude Code skill** that minimizes token consumption across four complementary levers —
**word reduction, clean memory, precise action, lean output** — **without reducing performance**.
Bilingual (**English + Italian**) and **code-safe** (never alters code, strings, or output).

> *A chisel removes the superfluous with precision to reveal the form underneath. Chisel does the
> same for the agent's token budget: cut what is redundant, keep what changes the outcome, never
> blur the result.*

## Why
Token cost grows faster than quality. Most "optimizations" trade correctness for savings and
nobody measures it. Chisel's first principle is the opposite: **measure the baseline first,
optimize only what is proven not to degrade quality, ship each layer behind a validation gate.**

## The levers
| Lever | Question it answers | Chisel layer |
|---|---|---|
| **Word reduction** | Can the same intent be expressed in fewer tokens? | Token Reduction (compression) |
| **Clean memory** | Is the context free of stale/redundant material? | Memory Cleanup (pruning) |
| **Precise action** | Are tool calls and steps minimal and non-redundant? | Operational Precision (routing + early-stop) |
| **Lean output** | Is tool/command output trimmed to what matters? | Output Discipline (head + tail + count) |

An **intercept layer** sits between user intent and agent execution: it filters, compresses, and
routes — never silently degrading output.

A cross-cutting principle, **context discipline**, governs the window itself: stay under ~120K tokens
/ 12% of the window, compact manually at ~60%, `/rewind` on errors, plan first, feed Markdown not
HTML/PDF/DOCX. A 500K-token session scores *worse* than a 200K one (context rot) — more space is not
better.

## Non-negotiables
1. **Performance preservation** — quality vs. baseline is the primary metric, not tokens saved.
2. **Measurement before optimization** — Phase 0 instruments the current state before anything changes.
3. **Security by design** — no `curl | bash`, no pipe execution without verification, input validation everywhere.
4. **Simplicity over comprehensiveness** — avoid the 261-skills over-engineering trap.
5. **Transparency & user control** — optimization is visible and toggleable.

## Repository layout
```
chisel/
├── SKILL.md             # the Claude Code skill (frontmatter + 4 levers)
├── README.md            # this file — vision + principles
├── CLAUDE.md            # drop-in token-discipline rules for any project
├── REQUIREMENTS.md      # functional + non-functional requirements (FR/NFR)
├── ROADMAP.md           # action plan: Phase 0→10, milestones, exit criteria
├── ARCHITECTURE.md      # intercept design + Claude Code integration
├── RISKS.md             # risk register + mitigations
├── STATE_OF_THE_ART.md  # reference repos: what to reuse / avoid
├── scripts/
│   ├── baseline.mjs        # Phase 0 — transcript metrics (token/tool/turn)
│   ├── benchmark.mjs       # lever benchmark
│   └── benchmark-cross.mjs # cross-skill comparison
├── lib/                 # lever advisors (pure, tested)
│   ├── memory.js        #   Lever 1 — pruneAdvisor (stale/duplicate)
│   ├── precision.js     #   Lever 2 — estimateToolCost / isRedundant
│   ├── compress.js      #   Lever 3 — terseProseAdvisor (lossless, EN+IT)
│   ├── output.js        #   Lever 4 — toolOutputAdvisor (head + tail + count)
│   ├── reads.js         #   read-cache — shouldRead / duplicateReads (no re-reads)
│   └── symbols.js       #   code navigation — symbolSlice (block by name)
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
- **Lever 3 — Token reduction** (`terseProseAdvisor` on agent prose): 67 → 46 tok (**−31%**). Strips filler; code/output/errors untouched.
- **Lever 1 — Memory cleanup** (`pruneAdvisor` on a context window): 6 → 3 entries (**size −51%**). Drops duplicates + stale.
- **Lever 2 — Operational precision** (`isRedundant` on a tool plan): flags 1 of 2 planned calls as redundant (cost saved).
- **Lever 4 — Output discipline** (`toolOutputAdvisor` on verbose command output): 200 → 31 lines (−85%).
- **Read-cache prevention** (`duplicateReads`): flags 2 of 4 planned reads as re-reads (cost saved).

Each lever is an **advisor** the skill reasons with — it never auto-applies a change that could lose meaning.

### Phase 0 baseline on a real session
```bash
npm run baseline -- ~/.claude/projects/<project>/<session>.jsonl
```
Example (a long coding session): 289 turns, 264 tool calls, ~99M total tokens (95.4M
cache-read, 1.8M fresh input, 1.97M output), 0 parse errors. The **cost estimate**
(default Sonnet-ish pricing) puts such a session at **≈ $63.6** — cache-read ($28.6) and
output ($29.6) dominate, not fresh input ($5.4), which is where compounding bites.
The same report flags **edit cycles** (files edited >1×) as a one-shot-failure / retry signal.

## Comparison with caveman-it & concise-output

These three installed skills all reduce agent output, on different principles:

- **chisel** — a pure, **code-safe** advisor. It removes filler and opener pleasantries from the
  agent's prose (**EN + IT**) but **never touches code, strings, commands, or errors** (a heuristic
  guard detects structured text and returns it unchanged). Reduction is **lossless**: content is
  preserved, only verbal padding goes. Use when output may contain code/data you must not corrupt.
- **caveman-it** — a **style directive** ("telegraphic Italian, no pleasantries"). Strong on prose
  filler, but it is a prompt instruction with **no code-safety guarantee** — the model following it
  could alter code/strings. Best for a terse voice in Italian conversation.
- **concise-output** — a **length-cap directive** ("≤ 3 blocks, code first"). It gets the largest
  cut on long output by **truncating** to 3 blocks, which **drops content** (lossy). Best when a
  hard length cap matters more than completeness.

**When to use which:** chisel when output may contain code/data you must not corrupt and you want
lossless trimming; caveman-it for a terse Italian voice; concise-output for a hard size cap
(accepting lost content). They compose. See [`BENCHMARK.md`](./BENCHMARK.md) for measured
reductions on a shared dataset (chisel is on par with caveman-it on lossless prose, and is the
only code-safe option).

## Develop
```bash
npm install      # dev tools (eslint)
npm test         # offline unit tests
npm run benchmark
npm run baseline # node scripts/baseline.mjs <transcript.jsonl>
npm run lint     # eslint
```

## Status
v0.3.0 — four lever advisors + read-cache + symbol-slice, a Phase 0 baseline with USD cost estimate
and an edit-cycle retry proxy, context-discipline rules (SKILL + drop-in CLAUDE.md), all with tests.
Phases 5→10 (validation/rollback infra, production hardening) per `ROADMAP.md`.
