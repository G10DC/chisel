# Cross-skill token-reduction benchmark

How the skills installed on this machine that act on **agent output prose** reduce token usage,
on a fixed dataset. Reproduce with `npm run cross-benchmark`.

## Results

Token estimate = chars / 4 (rough; the **relative reduction** is the comparison).

| Sample (before, tok) | chisel | caveman-it | concise-output |
|---|---|---|---|
| verbose prose (77) | 62 (**−19%**) | 62 (**−19%**) | 64 (**−17%**) |
| verbose prose, Italian (31) | 17 (**−45%**) | 17 (**−45%**) | 19 (**−39%**) |
| code + prose (50) | 50 (**−0%**) | 43 (**−14%**) | 43 (**−14%**) |
| long structured, 5 blocks (107) | 81 (**−24%**) | 81 (**−24%**) | 53 (**−50%**) |

## Skill profile

| Skill | Version | Mechanism | Code-safe | Strength |
|---|---|---|---|---|
| **chisel** | 0.3.0 | filler removal + code-safe guard (real deterministic function `terseProseAdvisor`) | ✅ yes | safe reduction; code/output/errors preserved |
| **caveman-it** | unversioned (user skill) | no pleasantries + no filler (deterministic approximation of its declared rules) | ❌ no | most aggressive on prose filler |
| **concise-output** | unversioned (user skill) | no filler + cap to 3 blocks (deterministic approximation of its declared rules) | ❌ no | largest cut on long output (truncates — lossy) |

## Reading

- On **lossless prose reduction**, chisel is on par with or ahead of the directive skills: equal
  to caveman-it on `verbose prose` (−19%), and equal on `long structured` (−24%). It also strips
  opener pleasantries (`Sure,` / `Well,` / `So,`), matching caveman-it there.
- **Bilingual (EN + IT)**: chisel handles Italian too — **−45%** on the Italian verbose sample
  (strips `Certo,` / `praticamente` / `fondamentalmente` / `ovviamente` / `insomma`). Conservative
  by design: words that are also verbs (`cioè` / `diciamo` / `mettiamo`) are stripped only as an
  opener with punctuation, never mid-sentence.
- chisel is the **only code-safe** skill: on `code + prose` it deliberately leaves the sample
  untouched (the guard detects the fenced block) rather than risk altering code/strings. The
  directive skills reduce it because they apply no such guard.
- **concise-output** reaches −50% on long output by **truncating** to 3 blocks — that drops
  content, so it is lossy, not directly comparable to lossless reduction.
- The three are **composable**: chisel for safe prose trimming, concise for hard length caps,
  caveman for a terse voice.

## Chisel lever benchmark (output)

`toolOutputAdvisor` (Lever 4) on a 200-line test-run sample: **200 → 31 lines (≈1323 → 202 tok,
−85%)** — the largest single cut, because verbose tool/command output is the biggest token sink.
Code-safe: no line is altered, only a contiguous middle run is elided with a count marker.

`terseProseAdvisor` (Lever 3) on agent prose: **67 → 46 tok (−31%)**. Strips filler/openers (EN+IT);
code/output/errors untouched.

## Read-cache prevention

`duplicateReads` (Lever 1/2 extension) on a 4-read plan against 3 files already in context:
**2 of 4 reads flagged as re-reads** (est. cost saved: 2× the Read cost). Re-reading a file already in
context pays for the same bytes twice; this advisor surfaces them before they run. Pure: it only
compares normalized paths, never touches the filesystem or the context.

## Baseline cost estimate

`estimateCost` (Phase 0) weights the four token components with a pricing model (default
Agent-Sonnet-ish: fresh input $3, cache write $3.75, cache read $0.30, output $15 per 1M tokens).
On the long-session shape from the README (~99M tokens: 95.4M cache-read, 1.97M output, 1.8M fresh
input): **≈ $63.6 total** — cache-read $28.6 and output $29.6 dominate, fresh input is only $5.4.

This aligns the baseline with tools like **ccusage** (offline cost reports from local JSONL): Chisel
exposes the components; multiplying by any model's per-million prices yields the estimate. The same
baseline report flags **edit cycles** (files edited more than once) as a one-shot-failure / retry
signal (the CodeBurn "where does the agent burn tokens in edit→test→fix loops" idea).

## Scope & method

- **chisel** is measured with its real function (`lib/compress.js#terseProseAdvisor`).
- **caveman-it** and **concise-output** are **directive skills** (they instruct the model; they
  expose no executable function). This benchmark uses a **deterministic approximation of each
  skill's stated rules** (from its `description`) so the numbers are reproducible. Live model output
  following those directives may differ.
- Metric: `chars / 4 ≈ tokens`. Only the relative reduction is meaningful for comparison.

## Not benchmarked here (different axes)

- **context-mode** (`ctx_*`): reduces the **context window** by processing raw bytes in a sandbox —
  a runtime-routing axis, not output-prose reduction.
- **karpathy-guidelines**: **behavioral** guidelines (surgical changes, surface assumptions) —
  reduces wasted effort, not tokens directly.
