# 0009 — Proactive hooks via additionalContext + Stop enforcer

- **Status**: Accepted
- **Date**: 2026-05-28
- **Deciders**: @Cristian Donnachie

## Context

skipper's promise is "an automated tool" — after initial setup the user shouldn't have to run commands. But until now every hook *spoke to the user* (`"Capitán, considera correr /skipper:update"`), which means the human still had to type the command. The maintenance burden never actually left the user; it was just surfaced.

Research of the Claude Code hook system (verified against the official hooks reference) clarified what is actually possible:

- A hook **cannot** type a slash command or invoke a skill directly.
- A hook **can** inject text via `hookSpecificOutput.additionalContext` on `SessionStart`, `UserPromptSubmit` and `PostToolUse`. That text is added to Claude's context ("saved in the session transcript", placed next to the tool result / alongside the prompt) — Claude reads and acts on it.
- A `Stop` hook that **exits 2** has its stderr "fed back to Claude as an error message", forcing Claude to keep working before it yields control.

So the lever for proactivity is: stop messaging the user, start injecting directives Claude obeys.

## Decision

Make skipper **proactive by default (Tier 2: sync-on-stop)**, opt-out via `SKIPPER_PROACTIVE=off`:

1. `SessionStart` injects a standing directive (keep docs/ADRs/stack in sync as you code).
2. `PostToolUse(Edit|Write)` → `hooks/docs-sync.sh` injects `additionalContext` when app code is edited.
3. `Stop` → `hooks/suggest.sh` becomes an enforcer: if code in a documented area changed without `docs/` being touched, exit 2 with a directive to sync before yielding.

Loop-safety is mandatory: ignore edits to `docs/`/`*.md`, honor `stop_hook_active`, throttle the `Stop` block to once per 30 min, and skip when `docs/` was already touched in the change set.

## Alternatives considered

- **Keep messaging the user (status quo)** — rejected: contradicts the "automated tool" promise; the user remained the executor.
- **Tier 1 (awareness only, never force)** — rejected as the default: sync isn't guaranteed, it depends on Claude's in-the-moment judgment. Kept conceptually as what `SKIPPER_PROACTIVE=off` minus the nag approximates.
- **Tier 3 (also block on stack drift / stub ADRs)** — rejected as default: too noisy, fights quick one-off edits. Can revisit if users ask.
- **`/loop` or `/schedule` to run `/skipper:update` on a cron** — rejected as the mechanism: out-of-band, not tied to the actual edits, and still command-driven.

## Consequences

### Positivas
- After init, docs stay in sync as a side-effect of coding — no manual commands.
- Built on verified mechanisms (additionalContext + Stop exit-2), not speculation.
- Fully opt-out; degrades to the prior conservative behavior.

### Negativas / costos
- Extra tokens per turn (injected context + occasional doc work at Stop).
- The `Stop` enforcer keys off the working-tree diff, so long-standing uncommitted code can trigger it until the 30-min throttle/`docs/`-touched guard quiets it.
- Behavior change for existing users — mitigated by the opt-out and CHANGELOG note.

### Qué hay que vigilar
- False fires on stable code with lots of uncommitted churn; tune the throttle if reported.
- That Claude doesn't over-document trivial changes (the directive says not to; watch real usage).

## Related

- Health checks that feed the awareness: docs-doctor / stack-sync — ADR 0008.
- Implementation tracked in plan 0003.
