# 0008 — Health checks for doc/code drift (stack-sync + docs-doctor)

- **Status**: Accepted
- **Date**: 2026-05-28
- **Deciders**: @Cristian Donnachie

## Context

An audit of two sibling real-world projects exposed where skipper loses value over time:

- **not-pato** (Expo app, on skipper): the `skipper:stack` block declared `zod` and `nativewind` (neither installed — `nativewind` was replaced by `uniwind`) and omitted ~9 libraries added after generation (reanimated, react-hook-form, bottom-sheet, flash-list, …). The block was generated once and froze while `package.json` evolved.
- **not-pato** docs: ~3.5% of commits touched `docs/`. `architecture/auth-session.md` had **892 code commits** since its last edit. Drift was real but invisible — nothing measured it.
- **rail-api** (B2B API, documented by hand, *did not adopt skipper*): it needed `api/`, `integrations/`, `runbooks/` folders skipper never offered.

skipper already had generators (`new-adr`, `stack-apply`) and a reactive nudge (`update`), but **no detector** of drift. The protocol said "update docs when you change code" — and it wasn't followed, because nothing surfaced the gap.

## Decision

Add **read-only health checks** as first-class, deterministic tooling, separate from the generators:

- `lib/stack-sync.sh` + `/skipper:stack-sync` — diff `package.json` against the declared stack block; flag `undocumented` and `phantom` libraries.
- `lib/docs-doctor.sh` + `/skipper:docs-doctor` — measure doc staleness (code commits since a doc's last touch), detect stub vs. thin docs, broken intra-doc links, empty folders.

Both are deterministic shell that emit JSON; the skill layer adds judgment and severity. Fixes are *routed* (to `/skipper:update` or a confirmed block edit), never applied silently.

## Alternatives considered

- **A PostToolUse hook that auto-rewrites the stack block on every dependency change** — rejected: too invasive, fights the "conservatism / when in doubt don't write" principle, and noisy.
- **Fold the checks into `stack-doctor`** — rejected: `stack-doctor` validates *code vs. CLAUDE.md laws*; drift is a different axis (docs vs. code, declared vs. installed). Separate concerns, separate commands.
- **Parse "declared" libraries from the prose block** — rejected as fragile; instead a curated dictionary of opinionated libraries grounds the check in package names.

## Consequences

### Positivas
- Drift becomes a measurable, reportable signal instead of silent rot.
- Deterministic core → cheap, testable against real repos (validated on not-pato/rail-api during build).
- Read-only by default keeps the conservatism guarantee.

### Negativas / costos
- The stack-sync dictionary is finite — exotic libraries aren't covered (the skill says so explicitly).
- `docs-doctor` staleness is a *heuristic* (commits near code paths), not proof a doc is wrong; the skill must frame it as "candidate for review."

### Qué hay que vigilar
- Keep the library dictionary current as stacks evolve.
- Watch for false positives on stable subsystems with high nearby commit counts.

## Related

- Project-type structure (`init-structure` app/service/library) — same audit, the rail-api gap. See plan 0003.
