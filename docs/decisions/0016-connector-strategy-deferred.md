# 0016 — Connector strategy: deferred, repo-first, no "connect everything"

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Accepted
- **Date**: 2026-06-17
- **Deciders**: @Cristian Donnachie

## Context and problem statement

The vision doc's long-term roadmap lists ~12 connectors (GitHub, GitLab, Jira, Conductor, Obsidian, Slack, Discord, Google Calendar, Google Tasks, Supabase, PostgreSQL, Stripe, Analytics) under the banner "centralize the operational knowledge of a company" — the "project OS". This is the most seductive and most dangerous part of the vision.

The integration-platform graveyard is full of products that tried to become the "single pane of glass" by connecting everything (and competing head-on with Backstage, Cortex, OpsLevel, Glean, Swimm, Unblocked, and others). Each connector is a recurring cost: an auth integration, ongoing API-change maintenance, and — most damaging — a *partial* integration that disappoints users who expected parity with the source tool. A young product that spreads across 12 half-integrations dilutes the one thing it does better than anyone.

skipper's defensible position is **vertical**: the decision/context memory for agentic development. The horizontal "company OS" is an *outcome* that may emerge, not a *strategy* to pursue now.

## Decision drivers

- **Focus** — protect the vertical wedge (agentic context memory) instead of sprawling horizontally.
- **Cost of breadth** — every connector is permanent auth + maintenance + partial-integration debt.
- **Differentiation** — "connect everything" puts us in a crowded graveyard; the vertical does not.
- **Source-of-truth discipline** — the repo (docs + git + PRs) is already the highest-signal, lowest-cost source and needs no external connector.

## Decision

**Defer all external connectors past the MVP**, and reject "connect everything" as a roadmap.

- The MVP and near-term source of truth is the **repo**: `docs/`, git history, and PRs (GitHub API) — the data skipper already touches. No Jira/Slack/Obsidian/Stripe/Calendar/etc. in scope.
- When connectors do come (post-MVP, SaaS tier per ADR-0014), adopt a **hub-and-spoke, demand-pulled** model: add the *single* next connector only when real users pull for it (most likely an issue tracker — Linear/Jira — since PRs are already in scope), one at a time, each justified on its own.
- Explicitly **do not** publish a "12 connectors / company OS" roadmap. Centralizing a company's operational knowledge may be a consequence of winning the vertical; it is not the plan.

## Alternatives considered

- **Connector-rich platform from day one (the vision's long-term list)** — pros: big "OS of the company" narrative, broad TAM story. Rejected: the integration graveyard; unbounded maintenance; competes horizontally with incumbents while we have no vertical moat yet.
- **A generic connector SDK early** (let others build connectors) — pros: offloads breadth. Rejected: premature; an SDK with no proven core just multiplies partial integrations and support surface.
- **One "obvious" connector now (e.g. Slack) to look complete** — rejected: even one connector is permanent cost and signals the horizontal direction we're explicitly avoiding pre-MVP.

## Consequences

### Positivas
- Focus stays on the defensible vertical; engineering isn't drained by integration maintenance.
- Clear, honest narrative: "memory for agentic development", not "yet another single-pane-of-glass".
- Repo-first keeps the MVP fully local and privacy-friendly (no third-party tokens to broker).

### Negativas / costos
- The grander "company OS" story is intentionally muted — may feel less ambitious to some audiences/investors.
- Teams whose decisions live mostly in Jira/Slack (not the repo) get less value until a connector exists; accepted trade-off for the MVP.

### Qué hay que vigilar
- Demand signal for the *first* connector — capture which integration users actually ask for, so the eventual spoke is demand-pulled, not guessed.
- Scope creep dressed as "just one integration"; every connector must clear the bar of real, repeated user pull.

## Confirmation

n/a (strategy decision). Confirmed by *absence*: the MVP ships with zero external connectors and the published positioning makes no "connect everything" promise. Revisit when a hosted SaaS tier exists and a single connector has clear, repeated demand.

## More information

- Originated by [PRD-0004 — Skipper Memory MVP](../prds/0004-skipper-memory-mvp.md) (NG2)
- Pairs with [ADR-0014 — Open-core boundary](0014-open-core-boundary.md) (connectors are a later SaaS-tier capability) and [ADR-0015 — MVP scope](0015-mvp-scope-agent-first.md)
- Architecture: [Platform memory layer](../architecture/platform-memory.md)
