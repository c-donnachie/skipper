# 0017 — Memory engine as a separate opt-in package, not bundled in the plugin

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Proposed
- **Date**: 2026-06-17
- **Deciders**: @Cristian Donnachie

## Context and problem statement

The Skipper Memory engine (PRD-0004, plan-0004) is a Node/TypeScript program with a local SQLite index. The existing Skipper product is the opposite: a **zero-install** Claude Code plugin made of markdown + bash, loaded once with no runtime dependencies (~355 tokens; ADR-0001 chose "install once, monolithic"). This raises a distribution question that the build plan fixed the *runtime* for (Node/TS) but not the *packaging*: **how does a Node+SQLite engine relate to a zero-install markdown plugin without breaking the "just works" property?**

Two facts constrain the answer:

1. **Claude Code plugins are cloned git repos** — the harness does not run `npm install` for you. A bundled Node engine would mean either committing `node_modules` or asking the user to run an install step inside the plugin dir, both of which break zero-install.
2. **Most Skipper users want the markdown layer** (stack profiles, docs scaffolding, hooks). Forcing a Node toolchain on every user — including doc-only ones — to get features they may never use is a regression of the plugin's ethos.

SQLite itself is *not* a server (no daemon, no `brew install`): the DB is a single local file, and Node ships `node:sqlite` built-in — so the engine adds **no database install**, only a Node prerequisite for those who opt into memory.

## Decision drivers

- Preserve the plugin's zero-install, lightweight, conservative ethos (ADR-0001, ADR-0003).
- Don't impose a Node toolchain on users who only want the markdown layer.
- The engine's primary consumer is **agents** — it should be reached the agent-native way (MCP), not stitched into the plugin's skill/hook mechanism.
- Align with the open-core boundary (ADR-0014), which already frames the engine as a separately-deployable OSS component, local, running on the user's own Claude.

## Decision

Ship the memory engine as a **separate, opt-in OSS package** (Node, `npx`/`npm install`-able), reached by Claude Code / Conductor via the **`skipper-memory` MCP server**. It is **not bundled** into the markdown plugin.

- The plugin stays pure markdown + bash, zero-install. It MAY detect the engine and suggest installing it, but never requires it.
- The engine persists a local SQLite file under `.skipper/` (gitignored, derived, disposable), using `node:sqlite` (built-in — no extra npm/native deps, no DB server).
- The bridge is MCP: the agent calls `ask`/`context_for` on the server; synthesis runs on the user's own Claude (no bundled API key — ADR-0014, PRIVACY.md).

## Alternatives considered

- **Bundle the engine inside the plugin** — pros: one install, one artifact. Rejected: plugins are cloned, not `npm install`-ed; would require committing `node_modules` or a manual install step (breaks zero-install) and forces Node on doc-only users.
- **Rewrite the engine in pure bash to keep zero-install** — pros: matches the existing `lib/`/`hooks/` style. Rejected: the MCP SDK is JS-first and graph/retrieval/verification logic in bash would be fragile and painful; this is genuinely a *program*, not a script (it can still shell out to the existing bash subsystems).
- **A hosted service the plugin calls** — rejected for the OSS path: that is the SaaS tier (ADR-0014); the OSS engine must run locally on the user's machine and keys (PRIVACY.md).

## Consequences

### Positivas
- The plugin keeps its zero-install, lightweight property; memory is **additive and opt-in**.
- Clean mapping to open-core (ADR-0014): the plugin is the free markdown layer, the engine is the (also OSS) installable component, the SaaS is the hosted shared memory.
- MCP makes the engine agent-native: every Conductor agent can consult it with no glue.

### Negativas / costos
- Two artifacts to version and release (plugin + engine), with a compatibility surface between them.
- Users who want memory take on a Node prerequisite + an install step.
- Needs a detection/handshake so the plugin knows whether the engine is installed (to suggest vs use).

### Qué hay que vigilar
- Keep the install path a frictionless one-liner (`npx skipper-memory …`); friction here kills adoption of the wedge.
- `node:sqlite` is still experimental-flagged in some Node versions — pin a supported Node range in the engine's `package.json`.
- Plugin↔engine version drift: the plugin's suggestions must match the engine's actual tools.

## Confirmation

The plugin continues to install and work with zero Node/dependencies (unchanged behavior). The engine installs separately, registers an MCP server, and a Skipper user who never installs the engine sees no regression. Validated when `bin/skipper` runs from a clean checkout with only Node present (no `sqlite3` server, no native build).

## More information

- Originated by [PRD-0004 — Skipper Memory MVP](../prds/0004-skipper-memory-mvp.md) and surfaced while planning [plan-0004 M0](../plans/0004-skipper-memory-engine-phase-b.md).
- Refines the OSS side of [ADR-0014 — Open-core boundary](0014-open-core-boundary.md); consistent with [ADR-0001 — Monolithic plugin](0001-monolithic-vs-multi-plugin.md) (the *plugin* stays monolithic; the engine is a distinct artifact, not a plugin split).
- Architecture: [Platform memory layer](../architecture/platform-memory.md).
