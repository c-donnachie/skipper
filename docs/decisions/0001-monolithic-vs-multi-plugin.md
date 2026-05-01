# 0001 — Monolithic plugin vs multi-plugin split

- **Status**: Accepted
- **Date**: 2026-04-29
- **Deciders**: @c-donnachie

## Context

In the v0.4 design phase, two distribution strategies were considered:

**Option A — Monolithic skipper**: a single plugin with all skills/agents/hooks bundled. User installs once.

**Option B — Multi-plugin split**: divide by responsibility into 3 plugins (skipper, kowalski, rico) following the Madagascar metaphor. Each plugin owns a domain (init/architecture, docs, code refactor).

Initial intuition leaned toward B for cleanliness, but the project goal is "console framework that you install once" — fragmenting the install contradicts that.

## Decision

**Stay monolithic.** skipper is a single plugin that bundles everything.

Use the Madagascar metaphor as **internal organization** (penguins as subagents inside the same plugin), not as a distribution unit.

The marketplace `c-donnachie/madagascar` is still designed to be expandable — future **optional** add-ons (rico, private) can be separate plugins without touching skipper's core.

## Alternatives considered

- **Option B — Multi-plugin split**: rejected because it forces the user to install N plugins for the full experience. UX cost (3 installs, 3 reload-plugins, mental coordination overhead) outweighs the cleanliness benefit.

- **Option C — Mono-repo with multiple plugin manifests**: rejected because Claude Code's plugin model is per-repo. A repo with multiple `.claude-plugin/plugin.json` is not how the standard works.

## Consequences

### Positive
- One install, full feature set.
- Token cost is still tiny (~355 tokens, 0.18% of context).
- Coordination across components (e.g. skipper-captain delegating to react-vite) doesn't need cross-plugin protocols.
- CLAUDE.md is the shared source of truth — readable by any subagent.

### Negative / costs
- The plugin grows over time. Need to be vigilant about feature bloat.
- Users who only want docs (kowalski-only) can't opt out of the rest. Mitigation: `Skill(...)` deny rules in their permissions, or `disable-model-invocation: true` per-skill.
- The single repo is becoming large (~100 files at v1.0.1). Could become a monorepo concern at v2.x.

### What to watch
- **Token budget**: if the plugin grows past ~800 tokens of descriptions in context, reconsider splitting.
- **Install failures**: if Anthropic's official marketplace has size limits, evaluate splitting.
- **Add-ons demand**: if many requests come for "rico-only" or "private-only" use cases, build them as separate plugins.
