# skipper-memory (engine)

> Local, queryable memory over a repo's decision records (ADRs/PRDs/plans) + git. **OSS, opt-in, reached via MCP** — a separate package, **not** part of the markdown plugin ([ADR-0017](../docs/decisions/0017-memory-engine-separate-opt-in-package.md)).

Status: **Phase B, M0 (foundations)** — see [plan-0004](../docs/plans/0004-skipper-memory-engine-phase-b.md) and [architecture/platform-memory.md](../docs/architecture/platform-memory.md). Scoped by [PRD-0004](../docs/prds/0004-skipper-memory-mvp.md).

## Requirements

- **Node ≥ 22.5** — uses the built-in `node:sqlite` (no npm/native deps, no database server). The index is a single local file under `.skipper/index/` (gitignored, derived, disposable).

## Usage (M0)

```bash
node bin/skipper.mjs index      # build/refresh the local graph index over the repo
node bin/skipper.mjs --version
npm test                        # M0 acceptance: idempotent rebuild (identical logical rows at same HEAD)
```

`ask` / `context` / `verify` / `eval` are stubbed until later milestones (M3–M6).

## What M0 ships

- Node project scaffold (`bin/`, `lib/`, `test/`) — runtime locked to Node + `node:sqlite`, with bash subsystems shelled out later.
- SQLite schema: `nodes`, `edges` (typed, **directed**, with `src_file:src_line` provenance), `mismatches`, `meta`. **No vector table** (deferred; `meta.schema_version` is the migration seam).
- Idempotent full-rebuild builder. The M1 parser plugs in at the marked point in `lib/build.mjs`.
