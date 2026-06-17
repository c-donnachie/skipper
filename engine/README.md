# skipper-memory (engine)

> Local, queryable memory over a repo's decision records (ADRs/PRDs/plans) + git. **OSS, opt-in, reached via MCP** — a separate package, **not** part of the markdown plugin ([ADR-0017](../docs/decisions/0017-memory-engine-separate-opt-in-package.md)).

Status: **Phase B complete** (M0–M6 + extras) — see [plan-0004](../docs/plans/0004-skipper-memory-engine-phase-b.md), [architecture/platform-memory.md](../docs/architecture/platform-memory.md), scoped by [PRD-0004](../docs/prds/0004-skipper-memory-mvp.md).

## Requirements

- **Node ≥ 22.5** — uses the built-in `node:sqlite` (no npm/native deps, no database server). The index is a single local file under `.skipper/index/` (gitignored, derived, disposable). LLM synthesis (optional) shells out to your own `claude` CLI — no bundled key (ADR-0014).

## Install in any repo

The engine indexes whatever repo you run it in (its `docs/` ADRs/PRDs/plans + git). To use it across your own projects — no npm publish needed:

```bash
# once, from this engine/ dir — exposes `skipper` globally
npm link              # or: npm install -g .

# then in ANY repo:
cd ~/my-project
skipper index
skipper ask "why did we choose X?"
skipper context src/payments/
```

For agents in that repo, drop a `.mcp.json` at its root:

```json
{ "mcpServers": { "skipper-memory": { "command": "skipper", "args": ["mcp"] } } }
```

The plugin's proactive hooks (`memory-guard`/`memory-stop`) auto-detect `skipper` on `PATH` and light up; they no-op if it isn't installed. **The memory is only as rich as the repo's decision records** — adopt the skipper docs structure (`/skipper:init-structure`) and write ADRs as you decide things. To share it beyond your machine: `npm publish` (consider a scoped name if `skipper-memory` is taken).

## Usage

```bash
node bin/skipper.mjs index                       # build/refresh the local graph index
node bin/skipper.mjs ask "why proactive hooks?"  # LLM-synthesized, cited answer (--no-llm = deterministic)
node bin/skipper.mjs context hooks/              # governing ADRs + invariants + freshness + recent activity
node bin/skipper.mjs relate ADR-0001 ADR-0014    # direct / doc-mediated via hub / not-linked
node bin/skipper.mjs mcp                         # stdio MCP server (for agents)
npm test                                         # idempotent rebuild + the 19-check gold gate
node test/mcp-smoke.mjs                          # MCP protocol smoke test
```

Answers carry inline citations (`ADR id` / `file:line`); every citation is self-verified before output. `--no-llm` renders deterministically (the CI/eval path) — `ask` otherwise synthesizes prose via your `claude` CLI over that same evidence pack.

### Register the MCP server (so agents can call it)

Add to your repo's `.mcp.json` (Claude Code / Conductor auto-loads it):

```json
{
  "mcpServers": {
    "skipper-memory": { "command": "node", "args": ["engine/bin/skipper.mjs", "mcp"] }
  }
}
```

An agent then calls `context_for("src/...")` **before editing** to pull the governing ADRs + risks — "Conductor = execution, skipper = knowledge" at runtime. Tools: `ask(question)`, `context_for(path)`. Synthesis runs on the caller's Claude; the server returns evidence, never a bundled key (ADR-0014).

### Per-repo config — `skipper-memory.config.json`

Committed at the repo root (NOT under `.skipper/`, so it's tracked). Overrides the built-in defaults; falls back to them if absent.

```json
{
  "governs":     { "hooks/": ["ADR-0009", "ADR-0018"] },     // code path → governing ADRs
  "subsystems":  { "docs/architecture/hooks.md": "hooks" }   // arch doc → code dir (git-delta freshness)
}
```

## What it does

- **Typed directed graph** (SQLite): ADR/PRD/plan/arch + commit/person/module nodes; `references`/`originated-from`/`implements`/`supersedes`/`touches`/`authored-by`/`decided-by`/`doc-mediated-via` edges — each declared edge carries `file:line` provenance. No vector table (deferred; `meta.schema_version` is the seam).
- **Retrieval** (no vectors): lexical anchor → directed graph expansion → cited answer. Decoy-safe supersession; never fabricates an outbound edge from a link-less ADR.
- **Freshness/drift**: doc-declared version vs `plugin.json`, **and** git-delta (commits touching the subsystem since the doc was last edited).
- **who-decided** (`decided-by`), **what-touched / recent activity** (commits → modules), **count-mismatch** flags (e.g. 7 specialists vs 9 subagents), **hub-node `relate`**.
- **Proactive** (plugin side, ADR-0018): `memory-guard.sh` injects governing ADRs on edit; `memory-stop.sh` enforces (exit 2) on governed-code changes.
- **`skipper eval`** — a 19-check deterministic gold gate locking all the above for CI.
