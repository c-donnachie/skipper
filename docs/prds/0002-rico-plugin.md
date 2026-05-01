# PRD 0002 — Rico plugin (aggressive refactor add-on)

- **Status**: Draft
- **Owner**: @c-donnachie
- **Created**: 2026-04-30
- **Target date**: TBD (post v1.0 validation feedback)

## Problem

The current solid-coach refactors a single file at a time. For larger structural changes — e.g. "split this 800-line component into 5 features", "rename module across 30 files", "extract this domain into a shared library" — solid-coach can't reason at that scale because it's scoped to one file.

Today's gap:
- No skill for cross-file refactors.
- No skill for large-scale renames respecting imports.
- No skill for moving entire features between locations.

## Users

- Devs in projects that grew without skipper and need a one-shot cleanup.
- Teams adopting skipper on an existing repo (need to migrate to the conventions in CLAUDE.md).
- Anyone doing a big refactor that touches >5 files coherently.

## Goals

- G1 — `/rico:demolish <pattern>` performs cross-file refactors with full project awareness.
- G2 — Operates with a "dry run + review + apply" flow (mandatory — destructive operations).
- G3 — Respects the project's CLAUDE.md (uses the same opinionated rules).

## Non-goals

- NG1 — NOT a replacement for solid-coach — solid-coach handles single-file SOLID issues. Rico handles multi-file structural changes.
- NG2 — NOT for code generation — Rico moves/refactors existing code, doesn't write features from scratch.
- NG3 — NOT bundled into skipper-core — separate add-on, opt-in (high blast radius).

## Requirements

### Must
- M1 — `/rico:demolish "split src/components/Dashboard.tsx into features/"` works end-to-end.
- M2 — Always shows a plan (table of files affected, action per file) BEFORE applying.
- M3 — Requires explicit user confirmation ("yes I want to apply this") — no `disable-model-invocation` shortcuts.
- M4 — Lives in a separate plugin (`c-donnachie/rico`) listed in the madagascar marketplace.
- M5 — Updates imports automatically when moving/renaming files.

### Should
- S1 — Git-aware: refuses to act on a dirty repo without `--force`.
- S2 — Creates a single commit per refactor with a descriptive message.
- S3 — Integrates with stack-doctor: after refactor, runs doctor automatically and reports violations introduced.

### Won't (this iteration)
- W1 — No semantic refactors (e.g. "convert all useState to useReducer where it improves readability") — too subjective without per-case judgment.
- W2 — No language conversion (e.g. JS → TS) — different problem space.

## Open questions

- Q1 — Should Rico require a clean git state by default? (Lean: yes, with `--force` opt-out.)
- Q2 — Single commit vs commit-per-step? (Single — easier to revert.)
- Q3 — How does Rico handle refactors that span multiple stacks (monorepo)? (Out of scope for v0.1; consider later.)

## Related

- ADR: [0001 — Monolithic plugin](../decisions/0001-monolithic-vs-multi-plugin.md) (rationale for putting Rico in a separate plugin)
- ADR: [0004 — Specialists can write](../decisions/0004-specialists-can-write.md)
