# Skipper Platform — business model

> The commercial layer complementary to the OSS engine. Grounded in [ADR-0014](../decisions/0014-open-core-boundary.md) (open-core boundary), [ADR-0020](../decisions/0020-platform-staging-vision-north-star.md) (staging), [ADR-0021](../decisions/0021-open-core-fence.md) (open-core fence). Internal working doc; revisited as Stage 1 validates.
> Last updated: 2026-06-17.

## Positioning

Skipper Platform is the **shared, always-fresh operating memory for an engineering team** — where decisions, the work cycle, and the *why* behind the code are visible to everyone, including people who never open the repo. It does **not** replace Jira/Linear/Notion/GitHub; it turns what they already produce into **cited, queryable, agent-callable** team knowledge.

One-liner: *"Your team's decisions and context, shared and never stale — for devs, PMs, and AI agents alike."*

**Why it isn't just a wiki/Notion:** a typed decision **graph** (supersede chains, implements, touches) not flat pages; **freshness/drift** detection (a wiki rots silently); **agent-native** (`context_for` via MCP, before an edit); **auto-built** from the repo (no manual capture).

## Who pays, and why

- **Buyer** = tech lead / eng manager. Unit of value = the **team** (a solo dev uses the free engine — ADR-0014).
- **Trigger** = the moment a second person or a second repo needs the answer the engine already knows (the cold, local, per-clone index can't serve it).
- **Why now** = agentic development makes "fresh, cited context for every agent action" a recurring, per-edit need — and the engine already proves the data exists.

## FREE vs PAID line (the fence — ADR-0021)

**FREE — the whole engine** (never paywalled): ingest → typed graph, lexical/hybrid retrieval, cited Q&A, `context_for`, `relate`, freshness/drift, the MCP server + CLI, self-hosting.

**PAID — what a local index structurally cannot be:** persistent shared index · multi-repo memory · always-fresh server re-indexing · non-repo surfaces (web/dashboards/Slack) · team auth/org/SSO · connectors.

Standing test for any paid feature: *"could a local engine do this for one user on their machine? if yes → it's free."*

## Pricing unit

**Per active seat, with a team minimum** — dev seats vs viewer seats tiered (viewer/non-dev cheaper), repos **included**, connectors as a higher tier / add-on.

- The **team minimum** preserves "a solo dev won't pay" (the engine is the solo path).
- **Per-seat** monetizes the non-dev visibility expansion — the flywheel.
- Rejected: **per-repo** (penalizes the multi-repo value we sell) and **flat per-team** (doesn't grow with the non-dev expansion).
- *Exact numbers deferred to a pricing ADR when Stage 1 nears.*

## LAND → EXPAND

- **LAND (Stage 1):** a team already on the OSS engine hits the wall — local/cold index, a teammate can't see it, multiple repos. The tech lead activates the hosted shared memory + the onboarding view.
- **EXPAND:** invite non-dev **viewer seats** (dashboards/Slack, Stage 2) → add more **repos** (included → stickiness) → pull the **first connector** (Stage 3 → Product dashboard → the buyer widens from eng to eng+product).

## Related

- ADR: [0014 — Open-core boundary](../decisions/0014-open-core-boundary.md) · [0020 — Platform staging](../decisions/0020-platform-staging-vision-north-star.md) · [0021 — Open-core fence](../decisions/0021-open-core-fence.md) · [0022 — Privacy posture](../decisions/0022-saas-privacy-posture.md)
- PRD: [0005 — Skipper Platform, Stage 1](../prds/0005-skipper-platform-stage1.md)
- Architecture: [Platform memory layer](../architecture/platform-memory.md)
