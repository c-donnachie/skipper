# 0011 — Dependency-change & subsystem-aware proactive hooks

- **Status**: Accepted
- **Date**: 2026-05-28
- **Deciders**: @Cristian Donnachie

## Context

After shipping proactive mode (ADR 0009) and the plan-mode guard (ADR 0010), three more high-leverage moments were identified to keep the project aligned without the user running commands:

1. **Dependency changes** are exactly when the `skipper:stack` block drifts (the original audit found `zod`/`nativewind` declared-but-uninstalled and many installed-but-undeclared libs).
2. **Editing a documented subsystem** is when the matching `docs/architecture` doc should be respected/updated — the generic docs-sync reminder didn't name the specific doc.
3. **Closing a plan** is a final chance to confirm the plan respects the architecture.

A timing constraint shaped the design: `additionalContext` from `PreToolUse` is delivered **next to the tool result** (i.e. after the tool runs), per the hooks reference. So a "read the doc *before* you edit" pre-edit injection isn't reliably possible without denying the edit (too aggressive). The right moment to point at a subsystem doc is therefore `PostToolUse`, and the pre-emptive "know the architecture" need is already covered by `SessionStart` and `plan-guard`.

## Decision

- **`hooks/stack-watch.sh`** (PostToolUse Bash|Edit|Write): on dep changes (`npm/pnpm/yarn/bun add|install|remove`, or `package.json` edits), remind Claude to keep `skipper:stack` aligned (or run `/skipper:stack-sync`). PostToolUse, not Pre, so it fires when the change has happened. Only when a `skipper:stack` block exists. Throttled 10 min.
- **`hooks/docs-sync.sh` made subsystem-aware**: map the edited path to `docs/architecture/<domain>.md` via filename keywords (segments ≥4 chars) and point Claude at that exact doc; throttled per subsystem so editing two domains nudges for each.
- **`hooks/plan-exit-guard.sh`** (PreToolUse ExitPlanMode): non-blocking best-effort checklist before a plan is presented. No-op if the matcher isn't supported.

All respect `SKIPPER_PROACTIVE=off`.

## Alternatives considered

- **Pre-edit "read the subsystem doc first" via PreToolUse(Edit)** — rejected: additionalContext lands after the result, so it can't inform the in-flight edit; the only true pre-edit gate is deny+reason, which is too aggressive for a nicety.
- **stack-watch on PreToolUse** — rejected: reminding before the install runs is worse timing than after.
- **plan-exit-guard that denies ExitPlanMode to force a revision** — rejected as default: too much friction on every plan; kept non-blocking. plan-guard already steers the plan up front.

## Consequences

### Positivas
- Stack drift is caught at its source (dependency changes), not just on demand.
- docs-sync now sends Claude to the *exact* doc for the subsystem, raising the odds it's respected/updated.
- Plan closing gets a second check where supported.

### Negativas / costos
- More injected context across a session (all throttled and opt-out).
- The subsystem keyword mapping can mis-match on generic path tokens; low harm (it just points at a doc), mitigated by the ≥4-char keyword floor.
- plan-exit-guard depends on the ExitPlanMode matcher being supported; silently no-ops otherwise.

### Qué hay que vigilar
- False subsystem matches; tighten the heuristic (prefer path-segment matches) if noisy.
- Whether ExitPlanMode fires in practice; if it does and proves valuable, consider a stricter (deny-once) variant.

## Related

- Proactive foundation — ADR 0009. Plan-mode guard — ADR 0010. Health checks — ADR 0008.
