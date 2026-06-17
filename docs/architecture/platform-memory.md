# Platform memory layer (Skipper Memory)

> Architecture for the queryable, agent-facing memory built on top of the artifacts skipper already produces. Scoped by [PRD-0004](../prds/0004-skipper-memory-mvp.md); boundary/scope/connector decisions in [ADR-0014](../decisions/0014-open-core-boundary.md), [ADR-0015](../decisions/0015-mvp-scope-agent-first.md), [ADR-0016](../decisions/0016-connector-strategy-deferred.md).

This is forward-looking design for the Skipper *platform*, distinct from the current plugin internals documented elsewhere in this folder.

## North star

> A new dev — or a Conductor agent — asks in natural language *"why Supabase and not Firebase?"* / *"what's the risk of touching payments?"* and gets a **cited** answer (ADR → originating PRD → implementing PR → who decided) in seconds, without opening the repo.

Everything else (graph viz, timeline, dashboard) is a *projection* of the same data and is deferred (ADR-0015).

## Concepts primer

Three building blocks the rest of this doc assumes.

### Knowledge graph
Today the decision log is a *pile of fiches*: relationships ("this superseded that") are buried in prose. A graph makes them first-class:
- **Nodes** = things: `ADR-0005`, `PRD-0003`, `PR #47`, a code module, a person.
- **Edges** = *typed* arrows between nodes. The type is the power: `superseded-by` ≠ `implements` ≠ `touches`, so you can ask "what replaced this decision?" separately from "what code implements it?".

Storage is humble — for v1 it is **two SQLite tables** (`nodes(id, type, title, status, …)`, `edges(from, to, type)`); traversal is JOINs. No Neo4j.

### Vector index (embeddings)
Keyword search (`grep`) matches *letters*; questions are about *meaning*. An **embedding** turns a chunk of text into a vector of numbers that captures meaning, so similar meanings land near each other even with different words ("auth con cookies" ≈ "session handling"). A **vector index** makes "find the nearest vectors to this question" fast over thousands of chunks. The embedding model is small/cheap and distinct from the chat LLM; run it once per chunk, re-run only on change.

### MCP (Model Context Protocol)
A standard plug ("USB-C for AI tools") by which an MCP **client** (Claude Code, Conductor) calls tools/data exposed by an MCP **server**. We ship `skipper-memory` as an MCP server so *any* agent in a Conductor fleet can consult the memory with zero glue. Rule of thumb: **CLI = humans, REST = apps, MCP = agents.**

## The pipeline (three layers)

```
                          ┌─────────────────────────────────────────┐
   SOURCES                │  INGEST  (OSS · local / CI)               │
   docs/decisions/*.md ──▶│  parsers → typed nodes + edges            │
   docs/prds/*.md      ──▶│  + chunking → embeddings                  │
   docs/plans/*.md     ──▶│                                           │
   git log / blame     ──▶│  output: .skipper/index/                  │
   PRs (GitHub API)    ──▶│    ├─ graph.sqlite   (nodes + edges)      │
   code (paths/symbols)─▶ │    └─ vectors        (sqlite-vec)         │
                          └───────────────────┬───────────────────────┘
                                              │
                          ┌───────────────────▼───────────────────────┐
   QUESTION  ───────────▶ │  RETRIEVAL  (hybrid)                       │
   "why Supabase?"        │  1. vector search → anchor (ADR-0003)      │
                          │  2. graph expand  → PRD, PR, author,       │
                          │     supersede chain, modules touched       │
                          │  3. LLM synthesizes a CITED answer         │
                          └───────────────────┬───────────────────────┘
                                              │
                  ┌───────────────────────────┼───────────────────────────┐
                  ▼                            ▼                           ▼
            MCP server                       CLI                    [SaaS · deferred]
         skipper-memory              skipper ask "..."          web graph/timeline/
      ask() · context_for(path)                                 dashboard · Slack bot
      ← consumed by EVERY                                       ← for PM/QA/stakeholders
        Conductor agent                                           who never open the repo
```

### 1. Ingest (OSS)
Parsers per artifact type build two derived structures: the **typed graph** and the **vector index**.

skipper's artifacts already encode much of the graph for free:

| Edge | Source signal |
|---|---|
| `supersedes` / `superseded-by` | ADR `Status: Superseded by ADR-NNNN` + `Supersedes` (the `/skipper:supersede-adr` workflow) |
| `originated-from` | PRD → ADR links in `Related` / `More information` |
| `implements` | Plan → ADR references |
| `touches` | PR / commit → changed paths (and the `docs-sync` doc↔subsystem map) |
| `authored-by` / `decided-by` | git author, ADR `Deciders` |

Indexing is **incremental**, keyed off git: only changed chunks are re-parsed/re-embedded.

### 2. Retrieval (hybrid — the differentiator)
Plain RAG over markdown answers *what*. The typed graph lets us answer *why* and *what-changed-since*:

1. **Vector search** finds the entry point by meaning (the anchor node).
2. **Graph expansion** walks the typed neighborhood (originating PRD, implementing PR, author, supersede chain, modules touched).
3. **LLM synthesis** produces a cited answer: *"decided in ADR-0003 for these drivers, requested by PRD-0002, implemented in PR #47 — note: superseded by ADR-0011."*

Vector finds the door; the graph shows the house. Neither alone suffices.

### 3. Surfaces
- **OSS:** the `skipper-memory` **MCP server** (`ask(question)`, `context_for(path)`) + the **CLI** (`skipper ask`, `skipper index`). The MCP server is the wedge — it makes "Conductor = execution, skipper = knowledge" literal: an agent calls `context_for("src/payments/")` *before* editing and gets the governing ADR + risks.
- **SaaS (deferred, ADR-0015):** web graph/timeline/health dashboard, Slack bot, and the non-repo surfaces for PM/QA/stakeholders.

## Where the data lives

Golden rule: **the repo markdown is the source of truth; everything else is derived and disposable.**

| Place | Holds | Committed? | Why there |
|---|---|---|---|
| **The repo (git)** | `docs/*.md`, code, git history | yes (already exists) | source of truth. skipper *reads* it, never replaces it |
| **Local index** `.skipper/index/` | `graph.sqlite` + vectors | **no → gitignore** | derived: regenerable via `skipper index`. Binary/large; pollutes diffs. Like `node_modules` / a build artifact |
| **Cloud (SaaS)** | persistent, shared, multi-repo index + surfaces | n/a (server) | does what local **cannot**: shared across the team, warm over time, multi-repo, reachable by non-repo users (ADR-0014) |

### What travels to the cloud (privacy)
A design choice with a real trade-off (future privacy ADR), from least to most invasive:

```
(a) graph + embeddings only   ← metadata, no raw source
(b) + docs markdown
(c) + full source code        ← #1 enterprise objection
```

Default aligned with PRIVACY.md: ship **(b) docs + graph + embeddings, not raw source** — or offer **self-hosted**. Minimize what leaves the machine.

## Build order (MVP)

Per PRD-0004 (M1–M6):

1. **ADR/PRD/Plan parser** → typed nodes + edges (structure already exists → days, not weeks).
2. **git + PR ingest** → enrich the graph (`touches`, `authored-by`).
3. **Local index** (SQLite + sqlite-vec) + **hybrid retrieval** (graph-expand + vector), incremental.
4. **MCP server `skipper-memory`** (`ask`, `context_for`) — *the demo*.
5. **CLI** (`skipper ask`, `skipper index`).

Deferred to SaaS: web viz, timeline, health dashboard, Slack, connectors.

## Open decisions

Tracked as PRD-0004 open questions; will graduate to their own ADRs as they resolve:

- **Embedding model + who pays** in the OSS path (user's key) → forces incremental indexing.
- **Freshness mechanism**: git hook vs CI vs extending skipper's existing `PostToolUse`/`Stop` hooks.
- **Graph/vector store**: confirm SQLite + sqlite-vec for v1.
- **SaaS privacy posture**: what travels (a/b/c above), self-hosting.

## Related

- [PRD-0004 — Skipper Memory MVP](../prds/0004-skipper-memory-mvp.md)
- [ADR-0014 — Open-core boundary](../decisions/0014-open-core-boundary.md)
- [ADR-0015 — MVP scope: retrieval agent first](../decisions/0015-mvp-scope-agent-first.md)
- [ADR-0016 — Connector strategy: deferred](../decisions/0016-connector-strategy-deferred.md)
