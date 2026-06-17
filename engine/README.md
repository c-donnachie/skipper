# skipper-memory (engine)

> Local, queryable memory over a repo's decision records (ADRs/PRDs/plans) + git. **OSS, opt-in, reached via MCP** — a separate package, **not** part of the markdown plugin ([ADR-0017](../docs/decisions/0017-memory-engine-separate-opt-in-package.md)).

Status: **Phase B, M0 (foundations)** — see [plan-0004](../docs/plans/0004-skipper-memory-engine-phase-b.md) and [architecture/platform-memory.md](../docs/architecture/platform-memory.md). Scoped by [PRD-0004](../docs/prds/0004-skipper-memory-mvp.md).

## Requirements

- **Node ≥ 22.5** — uses the built-in `node:sqlite` (no npm/native deps, no database server). The index is a single local file under `.skipper/index/` (gitignored, derived, disposable).

## Usage

```bash
node bin/skipper.mjs index                      # build/refresh the local graph index
node bin/skipper.mjs ask "why proactive hooks?" # cited, graph-expanded answer
node bin/skipper.mjs context hooks/             # governing decisions + invariants + freshness, before an edit
node bin/skipper.mjs mcp                        # run the stdio MCP server (for agents)
npm test                                        # idempotent-rebuild acceptance
node test/mcp-smoke.mjs                         # MCP protocol smoke test
```

Answers are **deterministic and cited** (no LLM call); LLM synthesis on top is a later milestone.
`verify` / `eval` are stubbed until M4/M6.

### Register the MCP server (so agents can call it)

Add to your repo's `.mcp.json` (Claude Code / Conductor auto-loads it):

```json
{
  "mcpServers": {
    "skipper-memory": { "command": "node", "args": ["engine/bin/skipper.mjs", "mcp"] }
  }
}
```

Then an agent can call `context_for("src/...")` **before editing** to pull the governing ADRs and risks — making "Conductor = execution, skipper = knowledge" literal at runtime. Tools exposed: `ask(question)`, `context_for(path)`. Synthesis runs on the caller's Claude — the server returns evidence, never a bundled API key (ADR-0014).

## What M0 ships

- Node project scaffold (`bin/`, `lib/`, `test/`) — runtime locked to Node + `node:sqlite`, with bash subsystems shelled out later.
- SQLite schema: `nodes`, `edges` (typed, **directed**, with `src_file:src_line` provenance), `mismatches`, `meta`. **No vector table** (deferred; `meta.schema_version` is the migration seam).
- Idempotent full-rebuild builder. The M1 parser plugs in at the marked point in `lib/build.mjs`.
