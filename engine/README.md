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
node bin/skipper.mjs guard                        # governing ADRs + SPECs for the working-tree change
node bin/skipper.mjs gate freeze                 # run the DoD → emit a content-bound receipt (SDD)
node bin/skipper.mjs gate validate               # revalidate the receipt (valid|stale|unmanaged)
node bin/skipper.mjs gate risk                   # deterministic risk tier (low|standard|high → lenses)
node bin/skipper.mjs config init                 # write skipper.config.json (DoD, committed)
node bin/skipper.mjs mcp                         # stdio MCP server (for agents)
npm test                                         # idempotent rebuild + gate (22) + gold (19) gates
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

Committed at the repo root (NOT under `.skipper/`, so it's tracked). The engine ships with **no** project-specific defaults — each repo maps its own paths → ADRs here. Without it, `context_for` / the proactive hooks have no governance to show (but `ask`, `relate`, freshness, and who/what-touched still work).

```json
{
  "governs":     { "hooks/": ["ADR-0009", "ADR-0018"] },     // code path → governing ADRs
  "subsystems":  { "docs/architecture/hooks.md": "hooks" }   // arch doc → code dir (git-delta freshness)
}
```

### Spec-anchored delivery gate — SDD (PRD-0006)

The engine also enforces **spec-anchored SDD**: a change reaches "Done" only when evidence shows it
meets its acceptance criteria, and that approval is **content-bound**.

- **DoD policy** — `skipper.config.json` (committed, repo root) lists the Definition-of-Done items,
  each with a `method` (`test|type|static|manual|memory|human`); `skipper config init` scaffolds it
  with stack-aware defaults, inferring commands from `package.json`.
- **Evidence + receipt** — `gate freeze` runs each item's verification (orchestrating the project's own
  commands), then writes `.skipper/receipts/<branch>.json`: a **content-bound receipt** (sha256 over the
  git blob-hashes of changed files). Honest by design — `manual/human/memory` without a captured
  `--artifact=<id>=<path>` is `unverified`, never green; nothing fails silently.
- **Revalidation** — `gate validate` recomputes the hash: `valid` (unchanged) · `stale` (re-freeze) ·
  `unmanaged` (no receipt — never fabricates approval). `gate install-hook` wires a pre-push check.
- **Risk tiers** — `gate risk` classifies the change `low|standard|high` (sensitive paths, churn) so the
  review scales ceremony (silent readback → 1 lens → 4R). The tier is recorded in the receipt.
- **The gate needs no graph** — the receipt is the in-repo source of truth (ADR-0025); it runs in a bare
  git hook even when the memory engine is off (opt-in, ADR-0017).

SPECs live in `docs/specs/*.md` (living, verifiable anchors — ADR-0024) and are parsed as first-class
graph nodes; `guard` surfaces the governing SPEC when you edit the code it anchors.

**Enforce the gate in CI** — skipper deliberately does **not** generate a CI workflow (a one-time,
project-specific YAML is yours to own). If you commit receipts, add one step to your *existing* pipeline
so a PR can't merge a stale receipt:

```yaml
- run: skipper gate validate   # fails the job if the committed receipt no longer matches the content
```

Provider-agnostic; the only skipper-specific piece of CI. Everything else (running your tests) is your
normal pipeline.

## What it does

- **Typed directed graph** (SQLite): ADR/PRD/plan/arch + commit/person/module nodes; `references`/`originated-from`/`implements`/`supersedes`/`touches`/`authored-by`/`decided-by`/`doc-mediated-via` edges — each declared edge carries `file:line` provenance. No vector table (deferred; `meta.schema_version` is the seam).
- **Retrieval** (no vectors): lexical anchor → directed graph expansion → cited answer. Decoy-safe supersession; never fabricates an outbound edge from a link-less ADR.
- **Freshness/drift**: doc-declared version vs `plugin.json`, **and** git-delta (commits touching the subsystem since the doc was last edited).
- **who-decided** (`decided-by`), **what-touched / recent activity** (commits → modules), **count-mismatch** flags (e.g. 7 specialists vs 9 subagents), **hub-node `relate`**.
- **Proactive** (plugin side, ADR-0018): `memory-guard.sh` injects governing ADRs on edit; `memory-stop.sh` enforces (exit 2) on governed-code changes — and now surfaces the governing **SPEC** too.
- **Spec-anchored gate** (SDD, PRD-0006): DoD policy → evidence runner → content-bound receipt → risk-tiered review → delivery hook (see above).
- **`skipper eval`** + `test/gate.mjs` — deterministic gates locking all the above for CI (19 gold + 22 gate checks).
