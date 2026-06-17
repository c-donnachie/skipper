# 0014 — Open-core boundary: engine OSS, persistent shared memory SaaS

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Accepted
- **Date**: 2026-06-17
- **Deciders**: @Cristian Donnachie

## Context and problem statement

The Skipper Memory MVP (PRD-0004) turns the markdown skipper already produces into a queryable, agent-facing memory. That memory has obvious commercial potential, which forces an open-core question: **what is free and what is paid?** Get the line wrong in either direction and the product dies — too much behind a paywall kills adoption (and the agentic wedge); too little leaves no business.

Two facts constrain the answer:

1. **Who pays.** A solo dev won't pay for this; the pain of "context lost across people" is felt by the tech lead / eng manager, most acutely at onboarding. The unit of value is the **team**, not the individual.
2. **What the data flow allows.** A locally-built index is intrinsically *per-clone, per-person, single-repo, and goes cold when the laptop sleeps*. A persistent, shared, multi-repo memory is something the local engine **cannot** be, not just something we choose to withhold.

## Decision drivers

- **Adoption** — a free, fully-local engine drives the agentic wedge (every Conductor agent can call it) and OSS distribution.
- **Monetization** — needs a defensible paid tier whose value the local engine genuinely cannot replicate.
- **Honest boundary** — the OSS/paid line should fall where the *data flow* naturally splits, not at an arbitrary feature fence.
- **Privacy ethos** — consistent with PRIVACY.md: the OSS path keeps everything on the machine.

## Decision

Split along **engine (OSS) vs. persistent shared memory (SaaS)**:

**OSS (free, runs in your repo, your keys):**
- Ingest (ADR/PRD/Plan + git + PR parsers) → typed graph.
- Local vector index under `.skipper/index/` (derived, gitignored, rebuildable).
- Hybrid retrieval.
- The **`skipper-memory` MCP server** + the **CLI**.

i.e. the whole engine. A solo dev gets value; agents get context. This is the adoption and wedge layer.

**SaaS (paid, unit = team):**
- The **persistent, shared, multi-repo** index (memory that accrues over time and is the same for the whole team).
- The non-repo **surfaces** (web dashboard, graph/timeline/health viz, Slack bot) for people who never clone the repo.
- External **connectors** — later (see ADR-0016).

The boundary in one line: **the engine is free; persistent, shared, multi-repo memory plus the surfaces for non-devs is paid** — because that is exactly what a local index structurally cannot be.

## Alternatives considered

- **Fully OSS, no SaaS** — pros: simplest, maximal goodwill. Rejected: no business model; the persistent/shared memory (the thing teams pay for) needs hosting someone must fund.
- **Fully SaaS, thin/no OSS** — pros: simplest monetization. Rejected: kills the agentic wedge and OSS adoption; "Conductor = execution, skipper = knowledge" only lands if the engine is freely embeddable where the agents run.
- **Per-seat individual pricing on top of OSS** — rejected: devs won't pay individually; misreads who feels the pain (the team/lead).
- **Feature-gate inside one codebase (e.g. free = 1 repo, paid = N)** — partially folded in, but the *primary* line is persistence+sharing+surfaces, not a repo counter, because that maps to a real cost (hosting) and a real capability gap (cold local index).

## Consequences

### Positivas
- Clear value ladder: free engine → paid shared memory. Each tier's value is honest and non-overlapping.
- The free tier *is* the distribution + the agentic moat; it isn't a crippled demo.
- Monetized capability (hosted, shared, persistent) is one the OSS path genuinely can't fake, so no incentive to "just self-host the paid bits".

### Negativas / costos
- Two deployment modes to build and maintain (local engine + hosted service).
- The SaaS needs a credible data-handling story (what leaves the machine) before any enterprise sale — raw source exfiltration is the #1 objection.

### Qué hay que vigilar
- Boundary creep: pressure to pull engine features (e.g. better retrieval) behind the paywall would erode adoption. Keep the engine whole.
- That the local index stays genuinely useful solo — if the free tier feels pointless without SaaS, the wedge breaks.

## Confirmation

n/a (product/strategy decision, not a code-level rule). Revisit once the MVP engine ships and the first team-level SaaS use case is validated; the privacy posture for "what travels to the cloud" will get its own ADR.

## More information

- Originated by [PRD-0004 — Skipper Memory MVP](../prds/0004-skipper-memory-mvp.md)
- Pairs with [ADR-0015 — MVP scope: retrieval agent first](0015-mvp-scope-agent-first.md) and [ADR-0016 — Connector strategy: deferred](0016-connector-strategy-deferred.md)
- Architecture: [Platform memory layer](../architecture/platform-memory.md)
