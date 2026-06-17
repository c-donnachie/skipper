# 0018 — Proactive memory: hook auto-injects governing decisions on edit

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Proposed
- **Date**: 2026-06-17
- **Deciders**: @Cristian Donnachie

## Context and problem statement

The skipper-memory engine (PRD-0004) made the project's decisions **queryable** — but only by *pull*: an agent or human must choose to call `ask`/`context_for` (MCP) or the CLI. Skipper's defining property (ADR-0009) is the opposite: *"stop messaging the user, start injecting directives Claude obeys."* A memory you must remember to consult is a wiki, not Skipper — and the failure mode is exactly the one the platform exists to kill: the agent doesn't ask, and repeats a settled mistake. The memory needs a **push** path: it must be consulted **automatically** when an agent is about to change governed code.

## Decision drivers

- Realize the proactive ethos (ADR-0009) for the memory, not just expose a queryable store.
- Reuse the proven `additionalContext` hook mechanism (ADR-0009/0011) rather than invent one.
- Keep the plugin **zero-install**; the engine is a separate opt-in package (ADR-0017).
- Respect the `additionalContext` timing constraint (ADR-0011, invariant #6).

## Decision

Add a `PostToolUse` (Edit|Write) plugin hook **`hooks/memory-guard.sh`** that, for the edited path, runs the engine's `skipper context <path> --brief` and **injects the governing decisions + a drift flag as `additionalContext`** — so the agent sees the relevant ADRs without being asked.

- **No-op if the engine isn't installed** → the plugin stays zero-install; proactive memory lights up only when you opt into the engine (ADR-0017). The bridge is: plugin hook (trigger, bash) → engine CLI (the memory).
- **Loop-safe & throttled**, like the other proactive hooks: ignores `docs/`/`*.md`/`engine/`/`.claude/`, throttles 10 min per subsystem, opt-out `SKIPPER_PROACTIVE=off`.
- **Timing**: PostToolUse `additionalContext` arrives *with the tool result* (ADR-0011 #6), so this is **inject-and-course-correct in the same turn**. Hard enforcement (blocking a change that conflicts with a governing ADR) is left to the `Stop` hook as a follow-on.

## Alternatives considered

- **PreToolUse gate (read governing ADRs *before* the edit)** — rejected: per ADR-0011 #6, PreToolUse `additionalContext` lands *after* the tool runs, so a true pre-edit gate isn't possible via this mechanism; up-front framing already lives in SessionStart/`plan-guard`.
- **Pull-only (MCP + CLI), no hook** — rejected: not proactive; relies on the agent remembering to ask — the wiki-rot failure mode.
- **Bundle the trigger into the engine** — rejected: hooks *are* the plugin's proactive surface; the clean split is plugin-hook → engine-CLI (ADR-0017).
- **Always inject (no throttle / not loop-safe)** — rejected: noise; same discipline as the other proactive hooks (ADR-0009).

## Consequences

### Positivas
- The memory becomes **proactive**: an agent editing governed code gets the relevant decisions — and drift warnings — injected automatically. *Conductor executes, Skipper knows and warns.*
- Surfaces drift **at the moment of risk** (e.g. editing `lib/detect.sh` flags the stale `detection.md`).
- Reuses the proven `additionalContext`/throttle/opt-out machinery; no new mechanism.

### Negativas / costos
- One `node` invocation per qualifying edit (throttled, ~hundreds of ms).
- The plugin gains a soft dependency surface on the engine (mitigated: silent no-op if absent).

### Qué hay que vigilar
- `--brief` output must stay tight — noise erodes trust.
- The governing seed (`engine/lib/subsystem.mjs`) is curated; keep it current or governed paths go unflagged. (Externalizing it to a committed repo override is a follow-on.)

## Confirmation

Simulated PostToolUse payloads: editing `hooks/*` injects ADR-0009/0010/0011 (+0018); `lib/detect.sh` injects ADR-0008 **+ the `detection.md` drift flag**; `docs/` edits, `SKIPPER_PROACTIVE=off`, and throttled repeats are all no-ops. The `Stop`-based hard enforcement is not yet built.

## More information

- Realizes the proactive ethos of [ADR-0009](0009-proactive-hooks-via-additional-context.md) over the engine from [PRD-0004](../prds/0004-skipper-memory-mvp.md); bridges plugin↔engine per [ADR-0017](0017-memory-engine-separate-opt-in-package.md); timing per [ADR-0011](0011-dependency-and-subsystem-proactive-hooks.md).
- Hook lifecycle: [architecture/hooks.md](../architecture/hooks.md).
