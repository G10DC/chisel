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
| **chisel** | 0.1.0 | filler removal + code-safe guard (real deterministic function `terseProseAdvisor`) | ✅ yes | safe reduction; code/output/errors preserved |
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
