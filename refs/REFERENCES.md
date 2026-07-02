# Chisel — References

## Reference repositories (state of the art)
- https://github.com/JuliusBrussee/caveman — terse/style compression
- https://github.com/affaan-m/ECC — agent "operating system" (over-engineering cautionary tale)
- https://github.com/Context-Engine-AI/Context-Engine — semantic memory via MCP
- https://github.com/huggingface/tokenizers — token-boundary reference (Rust)
- https://github.com/tonl-dev/tonl — compact serialization
- https://github.com/quantumaikr/quant.cpp — KV-cache compression

> Exact discovered URLs/metadata: `../../GitResearcher/projects/20260702_134724/2_repo_candidates.json`

## Tooling to reuse (not reinvent)
- **Claude Code** skill format + harness hooks (pre-tool / pre-step / pre-response intercept points)
- **context-mode MCP** — pull-based context management
- **@ai-sdk/anthropic** / **ai** package — API plumbing
- **huggingface/tokenizers** — token-boundary reasoning (reference only)

## Inspiration sources (community / packages / research)
Gathered by GitResearcher's multi-source fan-out for this idea; full items in
`../../GitResearcher/projects/20260702_134724/6_inspiration.json`:
- **Hacker News** — practitioner discussions (e.g. "I nerfed our coding agents on purpose"); signals
  on real token-cost pain and over-execution frustration.
- **npm** — `@ai-sdk/anthropic`, `ai`, token-counting libraries (what already exists to compose).
- **Stack Overflow** — common pitfalls in tokenization/context handling (cross-project pain).
- **OpenAlex / papers** — (degraded: API returned 503 during research; revisit for compression &
  KV-cache prior art).

## Provenance
- Full analysis report: `../../GitResearcher/architectural_report.md`
- Source artifacts (6 repos × 2 lenses, 5 modules, adversarial review, inspiration):
  `../../GitResearcher/projects/20260702_134724/`
