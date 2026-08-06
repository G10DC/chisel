# Chisel Context Compression Honesty & Benchmark Bounds

The honesty layer is the operational expression of the **G10DC Trellis Standard**: **the processing engine reasons over verified evidence with stated confidence, never hallucinates capabilities or impact.**

## Domain & Scope
**Domain**: In-Flight Conversational Token Pruning

## Core Epistemic Rules

1. **Literal Preservation: Code blocks, regexes, exact prompt instructions, and error tracebacks must NEVER be compressed.**
2. **Measured Compression Ratio: Benchmark must verify compression efficiency against reference baselines.**
3. **Confidence Rating: High (measured token reduction), Medium (estimated reduction), Low (unverified context pruning).**

## Three-Tier Confidence Model

- **High Confidence**: Full AST/schema validation passing, deterministic evidence available, verified state.
- **Medium Confidence**: Heuristic analysis or partial indexing; requires agent verification step.
- **Low Confidence**: Inferred or unindexed target; candidate output ONLY, never auto-committed.

## Epistemic Invariant

> Absence of evidence is not evidence of absence. Output is presented as a structured candidate set with confidence scores so caveats cannot be silently dropped downstream.
