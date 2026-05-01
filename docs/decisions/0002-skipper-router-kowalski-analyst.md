# 0002 — Skipper as router, Kowalski as docs analyst

- **Status**: Accepted (v0.4.0)
- **Date**: 2026-04-29
- **Deciders**: @c-donnachie

## Context

Until v0.3, the subagent named `skipper` was the **docs analyst** — it read git diffs and proposed ADRs/PRDs/plans (invoked by `/skipper:update`). The plugin and that subagent shared the same name.

Two issues:

1. **Confusing naming**: plugin-skipper and subagent-skipper had the same name but different roles.
2. **Missing role**: the routing skills (`/skipper:ask`, `/skipper:review`) routed in the **main chat** without a dedicated subagent. That meant the captain "didn't exist" as an entity — it was implicit logic in skill bodies.

## Decision

Split responsibilities cleanly using Madagascar's character roles:

1. **Rename the docs analyst from skipper → kowalski**. Frase icónica "Kowalski, análisis" matches the role.
2. **Create a NEW subagent named skipper** with the captain/router role: reads context (CLAUDE.md, diff, intent) and decides which specialist to invoke. **Read-only** — doesn't write code or docs.
3. The plugin keeps the name `skipper` because skipper IS the captain who orchestrates the team. The plugin name = the captain's name = consistent metaphor.

## Alternatives considered

- **Rename plugin to madagascar**: rejected. Would break slash commands for existing users (`/skipper:xxx` → `/madagascar:xxx`). Marketing-wise, "skipper" is more memorable than "madagascar" and matches a single character (the leader) rather than the whole group.

- **Keep skipper subagent doing both routing AND docs**: rejected. Mixing routing and writing creates competing intent (router decides where; docs writer applies). Separation of concerns is cleaner.

- **No captain subagent, route in main chat**: that was the v0.3 state. Worked but felt incomplete — every router skill repeated the routing logic instead of delegating to a single source of truth.

## Consequences

### Positive
- Clear mental model: skipper coordinates, kowalski analyzes, technicals execute.
- The plugin name carries the captain's persona consistently.
- Easier to extend: future router decisions live in `agents/skipper.md` only.
- "Kowalski, analysis" branding for the docs flow is memorable.

### Negative / costs
- **Backwards compatibility**: skipper subagent name changed roles. If any user wrote custom code referencing `agent: skipper` to mean the docs analyst, that broke. Mitigation: most users only use slash commands, never agent names directly.
- **Context fork tax**: routers (`ask`, `review`) now run in `context: fork` (new subagent) instead of main chat. Slightly more expensive but cleaner output (the routing analysis doesn't pollute the main chat).

### What to watch
- User confusion when naming clashes appear ("which skipper is this?"). The README's "Madagascar universe" section addresses this explicitly.
- If users complain about the context fork latency for `/skipper:ask`, consider adding a fast-path that decides in main chat for trivially obvious cases.
