# 0019 — Proactive specialist auto-routing (inspired by Superpowers)

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Proposed
- **Date**: 2026-06-17
- **Deciders**: @Cristian Donnachie

## Context and problem statement

skipper's memory layer is proactive (hooks inject context on their own), but the **specialists were still pull-only**: you had to type `/skipper:react-native`, `/skipper:supabase`, etc. A competitive analysis of **obra/Superpowers** — a development-process framework whose standout is that *"the agent checks for relevant skills before any task; mandatory workflows, not suggestions"* (skills auto-activate by context via a session-start directive, no slash command) — plus the user's own feedback ("it doesn't feel proactive, it's all commands") made the gap clear: the proactive ethos (ADR-0009) hadn't been extended to the stack expertise. Editing a `.tsx` in an Expo app should engage the RN specialist's judgment **without a command**.

## Decision drivers

- Extend the proactive ethos (ADR-0009) to specialists, not just docs/memory.
- Match the bar set by Superpowers (auto-activation by context) for the agentic UX.
- Reuse the existing, proven SessionStart `additionalContext` injection — no new machinery.
- Respect the runtime constraint: a hook **cannot** spawn a subagent (ADR-0009), so "auto-routing" must mean *inject the specialist's laws/persona as a directive Claude applies itself*, not literally invoke the specialist subagent.

## Decision

`SessionStart` (`hooks/session-start.sh`) now injects a **stack-aware specialist-routing directive**: it derives the relevant specialist(s) from the detected `skipper:stack` (e.g. *React Native Expo + Supabase* → `react-native` + `supabase`) and instructs Claude to **apply that specialist's laws and judgment proactively by context — without a `/skipper:<specialist>` command**. Cross-cutting: structure/layers → reason as `architect`; smells/SOLID → as `solid-coach`. Slash commands are reserved for a dedicated, deep refactor pass. Opt-out via `SKIPPER_PROACTIVE=off` (the whole proactive block is gated).

## Alternatives considered

- **Per-prompt classification hook (UserPromptSubmit matching the prompt to a specialist)** — pros: per-query precision. Rejected (for now): noisier, more complex bash keyword-matching; the standing SessionStart directive is simpler and is exactly how Superpowers does it ("check before any task").
- **A hard router that spawns the specialist subagent automatically** — rejected: impossible; hooks are run by the harness and can't invoke a subagent (ADR-0009). Auto-routing = inject the specialist's laws for the main agent to apply.
- **Leave specialists pull-only** — rejected: not proactive; the user explicitly flagged the command friction.

## Consequences

### Positivas
- Specialists feel proactive: open the project, and the right expert's laws are applied by context — no command (the Superpowers-style UX).
- Reuses the proven SessionStart injection; one directive per session, cheap.
- Stack-aware: only names specialists that match the project.

### Negativas / costos
- It is **guidance, not enforcement** — Claude may not always honor the standing directive over a long session (same nature as Superpowers' skills; mitigated by the strong "no esperes un comando" framing + the laws living in CLAUDE.md).
- Slightly longer SessionStart context injection.

### Qué hay que vigilar
- The stack→specialist mapping is keyword-based on the `## Stack:` string; an unusual stack name could under-match. Keep the keywords aligned with the shipped stack profiles.

## Confirmation

`session-start.sh` emits the specialist line for a stack-aware repo — verified against a real Expo+Supabase project (not-pato): banner + proactive block + *"aplicá proactivamente … (react-native supabase) … NO esperes /skipper"*. No-op when `SKIPPER_PROACTIVE=off` or no `skipper:stack` block.

## More information

- Inspired by [obra/Superpowers](https://github.com/obra/Superpowers); extends the proactive model of [ADR-0009](0009-proactive-hooks-via-additional-context.md); complements the proactive memory hooks ([ADR-0018](0018-proactive-memory-injection.md)).
- Hook lifecycle: [architecture/hooks.md](../architecture/hooks.md).
