# 0022 — SaaS privacy posture: host graph + docs, never source by default

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Proposed
- **Date**: 2026-06-17
- **Deciders**: @Cristian Donnachie

## Context and problem statement

The OSS engine sends nothing off the machine (PRIVACY.md). The SaaS is the first thing that intentionally crosses that line, and ADR-0014 flagged that a **credible data-handling story (what leaves the machine)** is required before any enterprise sale — raw source exfiltration is the #1 objection. The architecture doc left the posture explicitly open with three tiers: **(a)** graph + embeddings only, **(b)** + docs markdown, **(c)** + full source. We must pick a default *before* Stage 1 — it is a gate, not an afterthought.

## Decision drivers

- The #1 enterprise objection is source-code exfiltration.
- Synthesis and citations need *some* doc text to ground on: tier (a) alone cripples answer quality and breaks the cited-quote contract (`verifyCitations`).
- Privacy-conscious / regulated teams need an option where nothing leaves their boundary.

## Decision

**Default to tier (b): host the typed graph + docs markdown (`doc_blobs`) + embeddings. Never host source code (tier (c)) by default. Offer self-hosting for teams that won't send even doc text.**

- The ingestion runner clones a repo to an **ephemeral scratch dir only to parse**; **source code is never written to the database** and the scratch is wiped. Persisted: the graph (`nodes/edges/mismatches/meta`) + `doc_blobs` (ADR/PRD/plan/architecture markdown) + embeddings.
- This falls naturally on the engine's design: evidence is decision/doc text + `file:line` citations, never source contents; `context_for(path)` returns the governing ADRs + the architecture doc, **not** the source of `path`.
- **Server-side synthesis** (hosted model) reads only tier-(b) data we already host — no new exfiltration beyond the stated line.
- **Self-hosted deployment** (the engine is OSS; the hosted stack is self-hostable; BYO model key / Bedrock) keeps tier (b) inside the customer's boundary for regulated buyers.
- **Gate on Stage 1:** ship Stage 1 with the data-handling story documented (what travels, retention, region, self-host option).

## Alternatives considered

- **Tier (a) — graph + embeddings only (most conservative)** — pros: minimal data leaves. Rejected as default: no doc text to ground synthesis → weak, ungrounded answers, and it breaks the cited-quote check. Kept as an optional stricter mode.
- **Tier (c) — host source for "better answers"** — rejected: the #1 enterprise dealbreaker; the engine doesn't even need source contents (it cites docs + lines), so (c) buys little and costs the sale.
- **Hosted-only, no self-host** — rejected: loses regulated / privacy-conscious teams who would otherwise adopt.

## Consequences

### Positivas
- A credible, honest data-handling story before any enterprise conversation — discharges ADR-0014's watch-item.
- The privacy line is a design fit, not a bolt-on: source never needs to leave.
- Self-host covers the strict end of the market with the same stack.

### Negativas / costos
- Hosting doc text means decision *rationale* leaves the machine — acceptable for most, a dealbreaker for some regulated orgs (→ self-host).
- Two delivery modes (hosted + self-hosted) to build and support.

### Qué hay que vigilar
- Privacy-line creep: pressure to ingest source (c) for "better answers". Hold at (b); offer self-host instead.
- Retention / region / access controls must be real, not merely stated.

## Confirmation

Stage 1 ships with a published data-handling doc; an audit confirms no source contents are persisted (only graph + `doc_blobs` + embeddings); a Stage-1 test asserts synthesis payloads contain no source file contents. Revisit per regulated-customer requirements (may add region pinning, customer-managed keys).

## More information

- Resolves the open privacy posture in [Platform memory layer](../architecture/platform-memory.md) ("what travels to the cloud: a/b/c")
- Discharges the data-handling watch-item of [ADR-0014 — Open-core boundary](0014-open-core-boundary.md)
- Consistent with [PRIVACY.md](../../PRIVACY.md) (the OSS path still sends nothing; the SaaS is opt-in)
- Gate on Stage 1 of [ADR-0020 — Platform staging](0020-platform-staging-vision-north-star.md); scoped by [PRD-0005 — Skipper Platform, Stage 1](../prds/0005-skipper-platform-stage1.md)
