# PRD 0004 — Skipper Memory MVP

- **Status**: Draft
- **Owner**: @Cristian Donnachie
- **Created**: 2026-06-17
- **Target date**: TBD

## Problem

A project takes thousands of decisions over its life — architectural, technical, product, business. Today they scatter across code, PRs, Notion, Slack, Jira, meetings, and a few developers' memory. Over time context is lost, mistakes repeat, the architecture erodes, work is duplicated, and new members can't tell *why* something was built.

skipper already fights the *capture* half of this: its hooks and `kowalski` analyst turn real work (diffs, PRs) into living ADRs/PRDs/plans that sit in the repo and stay in sync. But that output is still a **pile of markdown** — readable one file at a time, not *queryable*. The relationships ("this superseded that", "this PR implemented that decision") live buried in prose.

The pain is sharpest in two moments:

1. **An agent is about to act.** In a Conductor fleet, every agent re-derives context from scratch and repeats mistakes a human already resolved months ago — because the decision lives in a dead Slack thread, not in front of the agent.
2. **A human needs the *why*.** A new hire, a PM, or QA asks "why Supabase and not Firebase?" / "what's the risk of touching payments?" and the only path is to read the whole repo or interrupt a senior.

> Concrete evidence the problem is real *in this very repo*: the hand-maintained `docs/index.md` already rotted — it lists ADRs up to 0007 while there are 13. Nobody maintains the index by hand. The memory must build itself.

## Users

- **Primary — AI agents** (via MCP, inside Claude Code / Conductor). The consumer that calls "give me the context before I touch X." This is the agentic wedge.
- **Primary — the developer** (via CLI `skipper ask`). Same retrieval, human-facing.
- **Secondary (post-MVP, SaaS) — non-repo humans**: PMs, QA, designers, new hires, stakeholders who need the *why* without cloning the repo.

The **buyer** (for the eventual SaaS) is the tech lead / eng manager — the role that feels "context lost across people", most acutely at onboarding. A solo dev does not pay; the unit of value is the team.

## Goals

- **G1** — Prove a project can answer *"why was this built / what decided this / what's the risk of changing it"* in natural language, **cited** (pointing to the exact ADR, PR, commit, file), in seconds, without opening the repo.
- **G2** — Build the memory **only from artifacts skipper already produces** (ADRs/PRDs/plans) plus git history and PRs — no new manual capture burden.
- **G3** — Expose the memory natively to **agents** via an MCP server, so "Conductor = execution, skipper = knowledge" becomes literally true at runtime.
- **G4** — Run **fully local** in the OSS path: the repo is the source of truth, the index is derived and disposable, nothing leaves the machine.

## Non-goals

- **NG1** — NOT building the web knowledge-graph viz, project timeline, or health dashboard in the MVP. Those are *projections* of the same data and are deferred SaaS surfaces (see ADR-0015).
- **NG2** — NOT building external connectors (Jira, Slack, Obsidian, Stripe, Calendar…). The "connect everything / company OS" scope is explicitly deferred (see ADR-0016).
- **NG3** — NOT shipping the hosted multi-repo SaaS in the MVP. The MVP is the local engine + the boundary that makes a SaaS possible later (see ADR-0014).
- **NG4** — NOT replacing the markdown. skipper reads it; it never becomes the source of truth.

## Requirements

### Must
- **M1 — Ingest.** Parse `docs/decisions/*`, `docs/prds/*`, `docs/plans/*` (MADR frontmatter, numbering, supersede links), git log, and PRs (GitHub API) into a **typed graph** (nodes: ADR/PRD/Plan/PR/Commit/Module/Person; edges: `supersedes`, `originated-from`, `implements`, `touches`, `authored-by`).
- **M2 — Index.** Build a **vector index** (embeddings of chunks) alongside the graph, stored locally under `.skipper/index/` (gitignored, derived, rebuildable).
- **M3 — Hybrid retrieval.** Answer a question by: vector search → anchor node → graph expansion of the typed neighborhood → LLM synthesis of a **cited** answer.
- **M4 — MCP server `skipper-memory`** exposing `ask(question)` and `context_for(path)`.
- **M5 — CLI** `skipper ask "..."` and `skipper index` (build/refresh).
- **M6 — Incremental indexing**: only re-embed/re-parse what git says changed.

### Should
- **S1 — Freshness hook**: refresh the index automatically (reuse skipper's existing hook system / a git hook / CI).
- **S2 — Confidence + citations**: every answer links to source files/lines/PRs; low-confidence answers say so rather than hallucinate.
- **S3 — `context_for(path)`** returns the governing ADR(s) and known risks for a path *before* an edit (the agent-facing wedge).

### Won't (this iteration)
- **W1 — Visualizations** (graph/timeline/dashboard). → SaaS surface.
- **W2 — Multi-repo / hosted / shared index.** → SaaS.
- **W3 — External connectors.** → deferred (ADR-0016).
- **W4 — Non-MCP, non-CLI surfaces** (web, Slack bot). → SaaS.

## Open questions

- **Q1** — Default embedding model and who pays for embeddings in the OSS path (user's key?). Drives the incremental-indexing design.
- **Q2** — Freshness mechanism: git hook vs CI vs extending skipper's `PostToolUse`/`Stop` hooks — which is least intrusive?
- **Q3** — Graph store: confirm plain SQLite (nodes + edges tables) is enough for v1 (avoid Neo4j). Vector: `sqlite-vec` vs a separate embedded store?
- **Q4** — How much does retrieval lean on Claude already present in Claude Code vs a bundled call? (OSS uses the user's Claude; SaaS hosts its own.)
- **Q5** — Privacy posture for the eventual SaaS: ship docs + graph + embeddings but **not** raw source? self-hostable? (Feeds ADR-0016 / a future privacy ADR.)

## Related

- ADR: [0014 — Open-core boundary: engine OSS, persistent shared memory SaaS](../decisions/0014-open-core-boundary.md)
- ADR: [0015 — MVP scope: retrieval agent first, visualizations later](../decisions/0015-mvp-scope-agent-first.md)
- ADR: [0016 — Connector strategy: deferred, repo-first, no "connect everything"](../decisions/0016-connector-strategy-deferred.md)
- Architecture: [Platform memory layer](../architecture/platform-memory.md)
- Plan de implementación: [0004 — Skipper Memory engine (Phase B)](../plans/0004-skipper-memory-engine-phase-b.md)
