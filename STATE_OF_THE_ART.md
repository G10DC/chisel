# Chisel — State of the Art

Six reference repositories surfaced by GitResearcher for this idea. Each yields a **reuse** lesson
and an **avoid** lesson. Exact links in `../GitResearcher/projects/20260702_134724/2_repo_candidates.json`.

| Repo | Approach | ✅ Reuse | ⛔ Avoid |
|---|---|---|---|
| **JuliusBrussee/caveman** | Style-preserving compression (terse output) | The terse-output pattern; the "say less, same meaning" stance. | Its `curl \| bash` install; unverified "75% reduction" claims (no baseline). |
| **affaan-m/ECC** | "Operating system for agents" — 261+ skills, cross-harness, instincts layers | Ambition of composability across harnesses. | Over-engineering: scope爆炸 makes it unmaintainable and unauditable. Chisel stays small. |
| **Context-Engine-AI/Context-Engine** | Semantic search + memory persistence via MCP | Pull-based context + MCP integration for the memory layer. | API-key handling exposure — treat secrets as a first-class security concern. |
| **huggingface/tokenizers** | High-performance tokenization (Rust) | **Reference** for token-boundary behavior — understand where tokens break. | Don't pull it in as a heavy runtime dependency; use it to reason, not to run. |
| **tonl-dev/tonl** | Compact serialization | Compact-encoding patterns for dense data. | Query-injection surfaces — validate all inputs that feed serialization. |
| **quantumaikr/quant.cpp** | KV-cache compression | Memory-footprint reduction thinking (compress what's cached). | Memory-safety hazards in low-level compression — favor safe, validated transforms. |

## Reuse (consolidated)
- **context-mode MCP** + **Context-Engine** patterns for the memory layer (don't reinvent).
- **@ai-sdk/anthropic** and the `ai` package for API plumbing.
- **caveman**'s terse-output stance for the conservative-compression layer (Phase 4).
- **huggingface/tokenizers** as a *reference* for token boundaries (not a runtime dep).
- **tonl** compact-serialization patterns where dense payloads appear.

## Avoid (consolidated)
- `curl | bash` and any pipe-to-shell execution without verification.
- Secrets passed via CLI or logged.
- Path traversal / unvalidated inputs into transformations (injection surface).
- Unverified savings claims — every number needs a baseline (R1).
- Scope creep / "agent OS" scale (R6) — simplicity gate per phase.

## Cross-cutting lesson
Every one of these projects optimizes *something*; almost none publish a measured quality-vs-cost
trade-off against a baseline. **Chisel's differentiator is precisely that: measure first, prove
no quality loss, then claim savings.**
