# Skipper documentation

Internal docs for the skipper plugin itself. Uses the same structure that skipper applies to user projects (eating our own dog food).

## Architecture

How skipper is built internally — components, flows, design rationale.

- [Plugin architecture](architecture/plugin.md) — components, layers, data flow
- [Detection algorithm](architecture/detection.md) — how `lib/detect.sh` decides the stack
- [Subagent coordination](architecture/agents.md) — how skipper-captain routes, kowalski analyzes, technicals refactor
- [Hook lifecycle](architecture/hooks.md) — SessionStart, Stop, PostToolUse interactions

## Decisions (ADRs)

Architectural decisions with tradeoffs.

- [0001 — Monolithic plugin vs multi-plugin split](decisions/0001-monolithic-vs-multi-plugin.md)
- [0002 — Skipper as router, Kowalski as docs analyst](decisions/0002-skipper-router-kowalski-analyst.md)
- [0003 — Strongly opinionated CLAUDE.md profiles](decisions/0003-strongly-opinionated-claude-md.md)
- [0004 — Specialist subagents can write](decisions/0004-specialists-can-write.md)
- [0005 — Monolithic stack profiles then composable layers](decisions/0005-monolithic-then-layers.md)
- [0006 — Public docs in English, internal prompts in Spanish](decisions/0006-i18n-public-vs-internal.md)
- [0007 — Madagascar marketplace expandable for future add-ons](decisions/0007-marketplace-expandable.md)

## PRDs

Future features (drafts).

- [0001 — Private plugin (onboarding tutorials add-on)](prds/0001-private-plugin.md)
- [0002 — Rico plugin (aggressive refactor add-on)](prds/0002-rico-plugin.md)
- [0003 — More stacks (Astro, SvelteKit, Tauri, Remix)](prds/0003-more-stacks.md)

## Plans

Active implementation work.

- [0001 — v1.x roadmap and validation](plans/0001-v1.x-roadmap.md)
- [0002 — Anthropic marketplace submission](plans/0002-anthropic-submission.md)
