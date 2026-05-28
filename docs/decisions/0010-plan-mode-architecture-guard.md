# 0010 — Plan-mode architecture guard

- **Status**: Accepted
- **Date**: 2026-05-28
- **Deciders**: @Cristian Donnachie

## Context

Plan mode is the highest-leverage moment to apply skipper's value: a plan decides *where* code will live and *whether* it gets built at all. If the architecture laws (CLAUDE.md layers, anti-patterns) and the existing docs/code are absent from Claude's context while planning, the plan can place a feature in the wrong layer, or rebuild functionality that already exists. Fixing that after implementation is expensive; steering the plan is nearly free.

Verified against the Claude Code hooks reference:

- There is **no dedicated plan-mode hook event**, and matching the `ExitPlanMode`/`EnterPlanMode` tools via a `PreToolUse` matcher is not reliably documented.
- But `permission_mode` is present in hook stdin and takes the value `"plan"` during plan mode, and `UserPromptSubmit` receives it.
- `UserPromptSubmit` supports `hookSpecificOutput.additionalContext`, injected "alongside the submitted prompt".

So the reliable injection point is a `UserPromptSubmit` hook gated on `permission_mode == "plan"`, firing before Claude researches and forms the plan.

## Decision

Add `hooks/plan-guard.sh` (UserPromptSubmit). When in plan mode in a skipper-aware repo, inject an architecture protocol as `additionalContext`:

1. **Apply the laws** — respect the layers/structure/anti-patterns from CLAUDE.md and `docs/architecture`.
2. **Reuse before build** — search the codebase for existing functionality before proposing new code; extend/reuse if found.
3. **Reference docs** — link relevant existing docs/ADRs (the hook lists available `docs/architecture` files and ADR filenames so Claude knows what to read).
4. **Flag decisions** — note tradeoff decisions that should become an ADR at implementation.

Same opt-out (`SKIPPER_PROACTIVE=off`) and throttle discipline (5 min/session) as the other proactive hooks.

## Alternatives considered

- **PreToolUse on `ExitPlanMode`** — rejected as primary: matcher reliability for that tool isn't documented, and injecting at exit is too late to shape the research the plan is built on. (Could be added later as a backstop if it proves matchable.)
- **Always inject the protocol on every prompt** — rejected: noisy and irrelevant outside planning; `permission_mode == "plan"` scopes it precisely.
- **Bake the protocol into CLAUDE.md prose only** — rejected as insufficient: static prose competes with everything else in context; an in-the-moment injection at plan time is far more likely to be applied, and can include the live list of available docs.

## Consequences

### Positivas
- Plans are born inside the project's architecture and avoid duplicating existing functionality.
- The injected doc inventory tells Claude exactly what to read/reference.
- Precisely scoped (only plan mode), so near-zero noise.

### Negativas / costos
- A few hundred tokens per planning turn.
- Depends on `permission_mode` being populated for `UserPromptSubmit`; if a future Claude Code build omits it, the hook silently no-ops (acceptable degradation).

### Qué hay que vigilar
- If `ExitPlanMode` becomes a documented, matchable tool, consider a lightweight PreToolUse backstop that re-checks the plan cites docs and reuse.

## Related

- Proactive hooks foundation — ADR 0009. Health checks that feed awareness — ADR 0008.
