# PRD 0005 — Skipper Platform — Stage 1 (Shared Fresh Memory)

- **Status**: Draft
- **Owner**: @Cristian Donnachie
- **Created**: 2026-06-17
- **Target date**: TBD

## Problem

The OSS engine (PRD-0004) turns one repo into a cited, queryable decision graph — but **locally**: per-clone, per-person, single-repo, cold when the laptop sleeps, and invisible to anyone who doesn't clone. The moment a second person or a second repo needs the answer the engine already knows, the local index can't help — a teammate can't see it, a PM has no access, and there is no always-fresh shared view. This is exactly the boundary ADR-0014 drew between the free engine and a paid platform, and Stage 1 of ADR-0020.

## Users

- **Buyer / champion** — tech lead / eng manager. Feels "context lost across people", most acutely at onboarding. Unit of value = the team (ADR-0014).
- **Primary users** — the dev team and their Conductor/Claude agents already using the OSS engine.
- **Expansion users** — non-repo people (PM, stakeholder, QA): read decisions and ask "why" without cloning. Expansion, not the wedge (ADR-0020).

## Goals

- **G1** — A hosted, **shared** memory the whole team queries, **always fresh** (the server re-indexes on push; no laptop dependency).
- **G2** — A **web read surface**: browse decisions (with their typed neighborhood + freshness) and ask cited natural-language questions — usable by someone who never clones the repo.
- **G3** — Built **only from repo-sourced data** (docs + git + PRs) — no external connectors (ADR-0016).
- **G4** — Honor the privacy posture (ADR-0022): host graph + docs, never source; self-hostable.
- **G5** — **Reuse the engine, don't fork it** — the same parsers/retrieval/render produce the shared graph (anti-drift).

## Non-goals

- **NG1** — No external connectors (Jira/Slack/Notion/…) — Stage 3+ (ADR-0016 / ADR-0020).
- **NG2** — No rich visualizations (graph viz, timeline, health dashboard) — Stage 2 (ADR-0015 / ADR-0020).
- **NG3** — No Slack bot or other non-web surfaces — Stage 2.
- **NG4** — No paywalled engine features — the engine stays whole (ADR-0021).
- **NG5** — The markdown in the repo stays the source of truth; the platform reads it, never replaces it (ADR-0014).

## Requirements

### Must (Phase A — the MVP-lite validation slice)
- **M1 — Storage port + parity.** Port the engine schema to **Postgres (Supabase)** with `org_id`/`repo_id` scoping; prove parity by running `engine/eval/gold.json` against the Postgres path (identical result to SQLite).
- **M2 — Single-repo ingest, no GitHub App yet.** Point at a local clone / URL, run the engine's parsers, store graph + `doc_blobs` (privacy tier b).
- **M3 — Decision Browser (web, Next.js).** List ADRs/PRDs/plans with a freshness badge; detail view renders the doc and its directed neighborhood (supersede chain, originating PRD, deciders).
- **M4 — Project Q&A (web).** Question → server `ask` → graph-expanded cited evidence → hosted-model synthesis → cited answer; citations verified (`verifyCitations` over `doc_blobs`).
- **M5 — Minimal auth** (single demo user), **single-tenant**, **lexical retrieval only**.

### Should (Phase B — hardening to a real Stage-1 product)
- **S1 — GitHub App + webhook**: auto re-index on push to the default branch (always-fresh, no manual pointing).
- **S2 — Real auth + tenancy**: GitHub OAuth + org/team/repo/membership + **RLS on** (viewer/member/admin); a viewer with no repo access sees only what RLS allows.
- **S3 — Multi-repo**: connect several repos; `ask` across them.
- **S4 — Freshness surfaced**: index status in the UI ("memory current as of commit …, N min ago") + nightly reconcile cron.
- **S5 — Data-handling doc** published (ADR-0022): what travels, retention, region, self-host.

### Won't (this stage)
- **W1 — Hybrid/vector retrieval** (pgvector) — Stage 3, when lexical misses bite.
- **W2 — Hosted MCP server** for cloud agents — Stage 3.
- **W3 — Dashboards / viz / Slack** — Stage 2.
- **W4 — Connectors** — Stage 3+.

## Open questions

- **Q1** — Hosted synthesis model + cost controls (rate limits, per-org budget, prompt caching).
- **Q2** — *Resolved by [ADR-0023](../decisions/0023-platform-separate-closed-repo.md):* the Platform is a **separate closed-source repo** that consumes the engine as a package (`skipper-memory`) — import-not-fork, **not** a monorepo (closed code can't live in the public OSS repo).
- **Q3** — Pricing / packaging (per-seat + team minimum) — defer to its own ADR when Stage 1 nears.
- **Q4** — Auth detail: GitHub OAuth scopes; when to add SSO/SCIM (enterprise, Stage 4).
- **Q5** — Ingestion-runner hosting (Fly/Railway/Render) — a long-running Node worker, **not** a serverless function.

## Related

- ADR: [0020 — Platform staging: vision as staged north star](../decisions/0020-platform-staging-vision-north-star.md)
- ADR: [0021 — Open-core fence](../decisions/0021-open-core-fence.md)
- ADR: [0022 — SaaS privacy posture](../decisions/0022-saas-privacy-posture.md)
- ADR: [0014 — Open-core boundary](../decisions/0014-open-core-boundary.md), [0015 — MVP scope](../decisions/0015-mvp-scope-agent-first.md), [0016 — Connector strategy: deferred](../decisions/0016-connector-strategy-deferred.md)
- Builds on [PRD-0004 — Skipper Memory MVP](0004-skipper-memory-mvp.md) (the OSS engine this platform hosts)
- Architecture: [Platform memory layer](../architecture/platform-memory.md)
- Business model: [Skipper Platform](../business/skipper-platform.md)
