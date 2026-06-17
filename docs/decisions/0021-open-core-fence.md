# 0021 — Open-core fence: engine features are never paywalled

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Proposed
- **Date**: 2026-06-17
- **Deciders**: @Cristian Donnachie

## Context and problem statement

ADR-0014 drew the open-core boundary — engine free; persistent, shared, multi-repo memory plus non-repo surfaces paid — and named the #1 risk: **boundary creep**, the pressure to pull engine features (e.g. better retrieval) behind the paywall, which would turn the free tier into a crippled demo and break the agentic wedge that drives adoption. A boundary stated once erodes over time unless there is a standing rule to test every paid feature against.

## Decision drivers

- **Adoption** depends on the free engine staying whole (ADR-0014); a crippled free tier kills the wedge.
- **An operational test**, not just a principle, is needed to resist creep in day-to-day decisions.
- **Honest value** — the paid tier must sell hosting/sharing/surfaces, not gated capability.

## Decision

**The engine stays whole and free, forever. Paid = only what a local index structurally cannot be.** Every proposed paid feature must pass a standing test:

> **"Could a local engine do this for a single user on their own machine?"**
> If **yes** → it ships free, in the engine. If **no** (it requires hosting, sharing across people, multi-repo, persistence beyond a laptop, or a non-repo surface) → it may be paid.

- **FREE (never paywalled):** ingest → typed graph; lexical/hybrid retrieval; cited Q&A; `context_for`; `relate`; freshness/drift; the `skipper-memory` MCP server + CLI; self-hosting the engine.
- **PAID:** persistent shared index; multi-repo memory; always-fresh server re-indexing; non-repo surfaces (web/dashboards/Slack); team auth/org/SSO; connectors.
- **Engine improvements (retrieval quality, parsing, new edge types) are always free** — they are never moved behind the wall to differentiate tiers.

## Alternatives considered

- **Feature-gate inside the engine** (free = 1 repo / paid = N; or free = lexical / paid = vector) — rejected: ties the line to an arbitrary fence instead of the real cost (hosting); a crippled free tier kills the wedge and invites "just self-host the paid bits".
- **No standing rule, decide case-by-case** — rejected: that is precisely how boundary creep wins over time.

## Consequences

### Positivas
- The free tier *is* the distribution and the agentic moat, not a demo. No incentive to self-host the paid bits — you cannot fake hosted/shared/persistent locally.
- A crisp, one-line test anyone can apply in a PR or a pricing discussion.

### Negativas / costos
- Forecloses easy monetization shortcuts (no gating a popular engine feature to upsell).
- Revenue must come entirely from the hosted value; "obviously valuable" engine improvements can't be used as paid bait.

### Qué hay que vigilar
- Any proposed paid feature that *fails* the test (a local engine could do it for one user) — that is creep; keep it free.
- Pressure to degrade the free engine so the SaaS looks better by comparison.

## Confirmation

Every new paid capability is checked against the "could a local engine do this for one user?" test in review. The engine's OSS surface (CLI + MCP tools) never loses a capability to the paid tier. Revisit only if the hosted value proves insufficient to monetize without gating engine features (that would reopen ADR-0014).

## More information

- Operationalizes the boundary-creep watch-item of [ADR-0014 — Open-core boundary](0014-open-core-boundary.md)
- Under the staging of [ADR-0020 — Platform: vision as staged north star](0020-platform-staging-vision-north-star.md)
- Business model: [Skipper Platform](../business/skipper-platform.md)
