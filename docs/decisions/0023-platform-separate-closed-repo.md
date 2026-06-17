# 0023 — Platform is a separate closed-source repo that consumes the engine as a package

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Proposed
- **Date**: 2026-06-17
- **Deciders**: @Cristian Donnachie

## Context and problem statement

ADR-0014 splits the product into the **OSS engine** (free, public, published to the plugin marketplaces) and the **paid Platform** (SaaS). The Platform is **proprietary / closed-source**; the engine repo is **public**. The Stage-1 plan initially leaned toward a *monorepo* (`engine/` + a `platform/` workspace that imports it) to avoid the doc↔code drift the engine fights. But a monorepo would put closed-source SaaS code in the public OSS repo — incompatible with the open/closed split: different license, different visibility, different release cadence. So: where does the Platform code live, and how does it reuse the engine **without forking** it?

## Decision drivers

- **Open/closed separation** — proprietary code must not live in the public OSS repo (license + visibility).
- **No fork / anti-drift** — the Platform must use the *same* engine code (parsers/retrieval/render), not a copy that drifts; the engine exists to prevent doc↔code drift, so forking it reintroduces that.
- **Independent cadence** — the closed Platform and the OSS engine version and release on their own schedules.
- ADR-0017 already makes the engine a self-contained, installable package — the seam exists.

## Decision

**The Platform lives in its own separate, closed-source repository and consumes the engine as a published package — not a monorepo, not a fork.**

- The OSS repo keeps `engine/` as the public **`skipper-memory`** package (ADR-0017): clean, importable, published (npm). The public repo stays 100% OSS.
- The **closed-source `skipper-platform` repo** depends on `skipper-memory` like any dependency and builds the SaaS on top (HTTP API, ingestion runner, Postgres adapter, web, auth, hosted synthesis). It **imports** the engine's pure modules (`parseRepo`, `ingestGit`, retrieval, `render`); it never copies them.
- **Dev-time consumption** before an npm release: a local link (`file:` dependency / `npm pack`) to the engine dir; switch to the published version for CI/release.
- This **resolves** the open "monorepo vs sibling repo" question (left open in the Stage-1 plan and PRD-0005 Q2) in favor of **separation**.

## Alternatives considered

- **Monorepo (`engine/` + `platform/` in the public repo)** — pros: simplest local dev, one place, trivial import. Rejected: puts closed-source code in a public OSS repo (license/visibility violation) and couples release cadences.
- **Fork the engine into the closed repo** — pros: no cross-repo dependency. Rejected: reintroduces exactly the drift the engine prevents; two diverging graph builders is the worst outcome.
- **Private monorepo with the OSS engine mirrored out** — rejected: mirror tooling is fragile, inverts the natural "OSS is the source" direction, and makes leaking closed code easy.

## Consequences

### Positivas
- Clean open/closed boundary: the public repo stays fully OSS; the proprietary Platform is private.
- Anti-drift preserved: one engine, consumed as a versioned dependency, never forked.
- Independent versioning/release for engine vs Platform.
- Forces the engine to stay a genuinely good standalone package (also serves the "installable in any repo" goal).

### Negativas / costos
- Cross-repo dev ergonomics: a local link is needed during development; a breaking engine change spans two repos.
- The engine must actually be published (npm) for clean CI — an extra release step.

### Qué hay que vigilar
- Engine API stability: the Platform depends on the engine's exported surface (`parseRepo`, retrieval, `render`) — treat it as a semver'd public API.
- The "just copy one file" temptation under deadline — that is a fork; forbid it (import or extend the package instead).

## Confirmation

The public repo contains no proprietary Platform code; the closed repo lists `skipper-memory` as a dependency and contains **no copied engine source** (check: no `parse.mjs`/`retrieve.mjs` duplicated in the Platform). Engine parity in the Platform is proven by running the engine's `eval/gold.json` against the Platform's Postgres-backed path. Revisit if cross-repo friction outweighs the separation benefit.

## More information

- Refines [ADR-0017 — Memory engine as a separate opt-in package](0017-memory-engine-separate-opt-in-package.md) (the package seam that makes this possible)
- Implements the open/closed split of [ADR-0014 — Open-core boundary](0014-open-core-boundary.md) and the fence of [ADR-0021 — Open-core fence](0021-open-core-fence.md)
- Under the staging of [ADR-0020 — Platform staging](0020-platform-staging-vision-north-star.md); resolves Q2 of [PRD-0005](../prds/0005-skipper-platform-stage1.md)
