# 0020 — Skipper Platform: vision as staged north star (extends ADR-0016)

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Proposed
- **Date**: 2026-06-17
- **Deciders**: @Cristian Donnachie

## Context and problem statement

The broad vision keeps resurfacing as "the thing to build": *the operating memory of engineering teams — connect GitHub/Jira/Notion/Slack/Linear, build an org-wide knowledge graph, expose dashboards/APIs/MCP, be the intelligence layer over the tools.* It appears to contradict ADR-0016, which deferred all connectors and rejected "connect everything" as a roadmap. So: do we reverse ADR-0016 and pursue the company-OS now, or not?

The tension dissolves once we separate two things ADR-0016 implies but never names: **direction** (where we are going) vs **roadmap** (what we commit to build next, in order). ADR-0016 froze the *roadmap*; it never denied the *direction* — it even says the company-OS is "an outcome that may emerge". The only gap is that 0016 reads as pure negation and offers no positive frame for the vision, so the question keeps coming back (this ADR exists because it did).

## Decision drivers

- **Preserve the vision** as a motivating destination without re-entering the "connect everything" trap (ADR-0016).
- **One committed scope** — keep a single near-term roadmap; everything else explicitly sequenced.
- **Nothing lost** — every connector and dashboard from the vision must have a visible place.
- **Substrate reality** — the OSS engine produces repo-sourced value *today*; connectors produce nothing until built, so sequencing by demand strictly dominates.

## Decision

**Adopt the vision as the north star (direction) and a staged scope as the contract (roadmap). Extend ADR-0016 — do not reverse it.** The vision is the destination; the stages are the commitment. Only **Stage 1** is a committed roadmap; Stages 2+ are **demand-pulled** (a stage starts only when the prior stage's users pull for it).

| Stage | What | Source | For whom |
|---|---|---|---|
| **1 — Shared Fresh Memory** (LAND, first paid) | Hosted, shared, always-fresh multi-repo index + web read surface (decision browser, cited Q&A, freshness) + team auth | **Repo only** (docs + git + PRs) | Tech lead (buyer) + dev team; first non-dev viewers |
| **2 — Team Visibility** (first expansion) | Web dashboards (Architecture + Engineering) + knowledge-graph viz + timeline + Slack bot | Same repo-sourced graph (no connectors) | + PM / stakeholder / QA |
| **3 — First connector** (demand-pulled spoke #1) | The single most-pulled source (likely Linear/Jira) → unlocks the Product dashboard | Repo + 1 connector | + PMs whose work lives in the tracker |
| **4+ — More spokes** (one at a time, each its own ADR) | Next pulled source (Notion, Slack-as-source, Conductor…); AI dashboard matures; org-memory APIs/MCP | Repo + tracker + next pulled source | Org |

- **Land with the tech lead** (team value: shared/fresh/multi-repo memory + agent context). **Expand to non-devs** (PM/stakeholders) via the read surfaces — they are the *expansion*, not the wedge.
- The Stage-2 surfaces are exactly the visualizations deferred by ADR-0015 — now *placed*, not forgotten.
- Reaffirm ADR-0016's hub-and-spoke, demand-pulled connector model. **Do not publish a dated "N-connector / company-OS" roadmap.**

## Alternatives considered

- **Reverse ADR-0016, pursue the company-OS roadmap now** — pros: bigger narrative, broader TAM story. Rejected: re-enters the integration graveyard with no vertical moat; every connector becomes a dated promise + maintenance debt; the engine already proves repo-sourced value, so demand-pulled sequencing dominates.
- **Keep ADR-0016 as-is, say nothing about the vision** — rejected: leaves the direction/roadmap tension unresolved; it keeps resurfacing and the team has no positive frame.
- **Build a thin slice of every stage at once** — rejected: breaks the "prove value before the next gate" discipline and dilutes focus.

## Consequences

### Positivas
- The full vision is preserved and visible, but only one scope is committed — focus plus honesty.
- Clear gating: each stage builds only after the prior proved value.
- Consistent with ADR-0014 (open-core) and gives ADR-0015's deferred surfaces a home (Stage 2).

### Negativas / costos
- The grand "company OS" story stays muted in public messaging (intentional; some audiences want the big roadmap).
- Requires discipline to resist "just one connector / just one viz" creep between stages.

### Qué hay que vigilar
- Stage creep: a Stage-2 viz sneaking into Stage 1, or a Stage-3 connector into Stage 2.
- The demand signal for the *first* connector (which one users actually pull for).
- Whether Stage 1 actually converts OSS-engine users — the kill signal *before* any connector spend.

## Confirmation

n/a (strategy decision). Confirmed by *absence*: no dated multi-connector roadmap is published; the built scope matches the stage table; PRD-0005 scopes only Stage 1. Revisit when Stage 1 ships and a first connector shows clear, repeated demand.

## More information

- Extends [ADR-0016 — Connector strategy: deferred](0016-connector-strategy-deferred.md) (stays Accepted; this adds the positive vision-as-direction framing)
- Builds on [ADR-0014 — Open-core boundary](0014-open-core-boundary.md); places the deferred surfaces of [ADR-0015 — MVP scope](0015-mvp-scope-agent-first.md) at Stage 2
- Operationalized by [ADR-0021 — Open-core fence](0021-open-core-fence.md) and [ADR-0022 — SaaS privacy posture](0022-saas-privacy-posture.md)
- Scoped by [PRD-0005 — Skipper Platform, Stage 1](../prds/0005-skipper-platform-stage1.md)
- Architecture: [Platform memory layer](../architecture/platform-memory.md) · Business model: [Skipper Platform](../business/skipper-platform.md)
