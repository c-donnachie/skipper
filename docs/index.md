# Skipper documentation

Internal docs for the skipper plugin itself. Uses the same structure that skipper applies to user projects (eating our own dog food).

## Architecture

How skipper is built internally — components, flows, design rationale.

- [Plugin architecture](architecture/plugin.md) — components, layers, data flow
- [Detection algorithm](architecture/detection.md) — how `lib/detect.sh` decides the stack
- [Subagent coordination](architecture/agents.md) — how skipper-captain routes, kowalski analyzes, technicals refactor
- [Hook lifecycle](architecture/hooks.md) — SessionStart, Stop, PostToolUse interactions
- [Platform memory layer](architecture/platform-memory.md) — **forward-looking**: the Skipper Memory platform (graph + vector index + MCP, where data lives)

## Decisions (ADRs)

Architectural decisions with tradeoffs.

- [0001 — Monolithic plugin vs multi-plugin split](decisions/0001-monolithic-vs-multi-plugin.md)
- [0002 — Skipper as router, Kowalski as docs analyst](decisions/0002-skipper-router-kowalski-analyst.md)
- [0003 — Strongly opinionated CLAUDE.md profiles](decisions/0003-strongly-opinionated-claude-md.md)
- [0004 — Specialist subagents can write](decisions/0004-specialists-can-write.md)
- [0005 — Monolithic stack profiles then composable layers](decisions/0005-monolithic-then-layers.md)
- [0006 — Public docs in English, internal prompts in Spanish](decisions/0006-i18n-public-vs-internal.md)
- [0007 — Madagascar marketplace expandable for future add-ons](decisions/0007-marketplace-expandable.md)
- [0008 — Health checks for doc/code drift (stack-sync + docs-doctor)](decisions/0008-doc-code-drift-health-checks.md)
- [0009 — Proactive hooks via additionalContext + Stop enforcer](decisions/0009-proactive-hooks-via-additional-context.md)
- [0010 — Plan-mode architecture guard](decisions/0010-plan-mode-architecture-guard.md)
- [0011 — Dependency-change & subsystem-aware proactive hooks](decisions/0011-dependency-and-subsystem-proactive-hooks.md)
- [0012 — Next.js layered + Container architecture](decisions/0012-nextjs-layered-container-architecture.md)
- [0013 — MADR-aligned ADR lifecycle + supersede workflow](decisions/0013-madr-aligned-adr-lifecycle.md)
- [0014 — Open-core boundary: engine OSS, persistent shared memory SaaS](decisions/0014-open-core-boundary.md) · *Accepted*
- [0015 — MVP scope: retrieval agent first, visualizations later](decisions/0015-mvp-scope-agent-first.md) · *Proposed*
- [0016 — Connector strategy: deferred, repo-first, no "connect everything"](decisions/0016-connector-strategy-deferred.md) · *Accepted*
- [0017 — Memory engine as a separate opt-in package, not bundled in the plugin](decisions/0017-memory-engine-separate-opt-in-package.md) · *Proposed*
- [0018 — Proactive memory: hook auto-injects governing decisions on edit](decisions/0018-proactive-memory-injection.md) · *Proposed*
- [0019 — Proactive specialist auto-routing (inspired by Superpowers)](decisions/0019-proactive-specialist-auto-routing.md) · *Proposed*

## PRDs

Future features (drafts).

- [0001 — Private plugin (onboarding tutorials add-on)](prds/0001-private-plugin.md)
- [0002 — Rico plugin (aggressive refactor add-on)](prds/0002-rico-plugin.md)
- [0003 — More stacks (Astro, SvelteKit, Tauri, Remix)](prds/0003-more-stacks.md)
- [0004 — Skipper Memory MVP](prds/0004-skipper-memory-mvp.md)

## Plans

Active implementation work.

- [0001 — v1.x roadmap and validation](plans/0001-v1.x-roadmap.md)
- [0002 — Anthropic marketplace submission](plans/0002-anthropic-submission.md)
- [0003 — v1.1 health checks and project types](plans/0003-v1.1-health-checks-and-project-types.md)
- [0004 — Skipper Memory engine (Phase B)](plans/0004-skipper-memory-engine-phase-b.md) · *Active*
