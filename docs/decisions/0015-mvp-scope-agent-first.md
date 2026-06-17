# 0015 — MVP scope: retrieval agent first, visualizations later

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Proposed
- **Date**: 2026-06-17
- **Deciders**: @Cristian Donnachie

## Context and problem statement

The original vision doc framed the MVP as three deliverables: a **knowledge-graph visualization**, a **project timeline**, and a **health dashboard**, with the *"project agent"* (ask "why was this built?") pushed to the medium term. That ordering inverts effort and value: the three "MVP" items are really three separate products (each a UI surface), while the agent is both the cheapest to build and the killer demo.

Why the agent is cheap *here* specifically: the data is already structured. skipper produces MADR ADRs, numbered PRDs/plans, supersede links, and doc↔subsystem links (via the `docs-sync` hook). Retrieval runs on top of artifacts that already exist — it is not a data-collection project, it is a query project. The graph, timeline, and dashboard, by contrast, are *projections* of that same data and only make sense once the data and its value are proven.

## Decision drivers

- **Time-to-provable-value** — fastest path to a demo that proves the thesis ("recover the *why*, cited, in seconds").
- **Cost asymmetry** — retrieval reuses existing structured artifacts; visualizations are net-new UI work.
- **Audience fit** — the first audience is agents (MCP) and devs (CLI), who want answers, not dashboards. A conversational/agentic demo fits them better than a UI.
- **Sequencing** — you can't visualize a graph you haven't built; retrieval forces us to build the graph + index first, which the visualizations then reuse for free.

## Decision

Scope the MVP to the **retrieval agent only**: ingest → typed graph + vector index → hybrid retrieval → `skipper-memory` MCP server + CLI (per PRD-0004, M1–M6).

**Defer** the knowledge-graph viz, the project timeline, and the health dashboard to **post-MVP SaaS surfaces**. They are visualizations of data the MVP already produces; build them once retrieval has proven the data is valuable.

In short: **the "project agent" *is* the MVP**, not a medium-term item. The roadmap from the vision doc is inverted on purpose.

## Alternatives considered

- **Graph-visualization-first (as in the original vision)** — pros: visually impressive, "demo-able" screenshot. Rejected: expensive UI work whose value is unproven, and it depends on the graph the retrieval path builds anyway; ships nothing an agent can consume.
- **Dashboard-first (health metrics)** — pros: appeals to managers. Rejected: a metrics dashboard over a memory nobody queries yet is a vanity surface; metrics are more credible *after* the memory is in use.
- **Everything at once (vision's 3-in-1 MVP)** — rejected: three products masquerading as one MVP; dilutes focus and delays any provable value.

## Consequences

### Positivas
- Shortest path to a demo that validates (or kills) the core thesis.
- Forces the graph + index to exist first — the deferred visualizations then become cheap reuse, not new data work.
- Output is immediately consumable by agents (the wedge), not just by humans looking at a screen.

### Negativas / costos
- No shiny UI at launch. The MVP demo is conversational/agentic (CLI + an agent calling MCP), which is less screenshot-friendly for non-technical stakeholders.
- Risk of "where's the dashboard?" pressure from audiences who equate product with UI.

### Qué hay que vigilar
- Don't let "just a small viz" creep into the MVP. Each surface is a SaaS deliverable (see ADR-0014), gated until retrieval value is proven.
- Keep the graph/index schema clean enough that the deferred visualizations can read it without rework.

## Confirmation

n/a (scope decision). Confirmed in practice when the MVP can answer a seed set of "why / what-decided / what-risk" questions with correct citations, and an agent can call `context_for(path)` before editing — *without* any visualization having shipped.

## More information

- Originated by [PRD-0004 — Skipper Memory MVP](../prds/0004-skipper-memory-mvp.md)
- Pairs with [ADR-0014 — Open-core boundary](0014-open-core-boundary.md) (the deferred surfaces are the SaaS tier) and [ADR-0016 — Connector strategy: deferred](0016-connector-strategy-deferred.md)
- Architecture: [Platform memory layer](../architecture/platform-memory.md)
