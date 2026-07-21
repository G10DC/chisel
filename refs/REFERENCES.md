# Chisel — References

## Reference repositories (state of the art)
- https://github.com/JuliusBrussee/caveman — terse/style compression
- https://github.com/affaan-m/ECC — agent "operating system" (over-engineering cautionary tale)
- https://github.com/Context-Engine-agent/Context-Engine — semantic memory via MCP
- https://github.com/huggingface/tokenizers — token-boundary reference (Rust)
- https://github.com/tonl-dev/tonl — compact serialization
- https://github.com/quantumaikr/quant.cpp — KV-cache compression

## Tooling to reuse (not reinvent)
- **Agent environment** skill format + harness hooks (pre-tool / pre-step / pre-response intercept points)
- **context-mode MCP** — pull-based context management
- **@ai-sdk/provider** / **ai** package — API plumbing
- **huggingface/tokenizers** — token-boundary reasoning (reference only)

## Further reading
- Hacker News — practitioner discussions on agent token cost and over-execution.
- npm — token-counting libraries and agent SDKs to compose on.
- Stack Overflow — common tokenization and context-handling pitfalls.
