# PRD 0001 — Private plugin (onboarding tutorials add-on)

- **Status**: Draft
- **Owner**: @c-donnachie
- **Created**: 2026-04-30
- **Target date**: TBD (post v1.0 marketplace approval)

## Problem

When a developer installs skipper in a new stack they're unfamiliar with (e.g. their first time with Expo+Supabase), the opinionated CLAUDE.md tells them WHAT to do but not HOW to start. The existing flow assumes the user already knows the stack — it doesn't onboard them.

Today's gap:
- No interactive tutorial per stack.
- No "first day" path that teaches by doing.
- Stack-doctor finds violations but doesn't teach why each rule matters.

## Users

- Devs trying a new stack for the first time.
- Junior devs joining a project that uses one of skipper's stacks.
- People wanting to learn the recommended patterns concretely instead of reading docs.

## Goals

- G1 — Provide a 30-60 minute guided tutorial per stack that teaches conventions by writing real code.
- G2 — Each tutorial is interactive: skipper asks the user to write something, validates, gives feedback.
- G3 — On completion, the user has a working "hello world" feature following all the stack's conventions.

## Non-goals

- NG1 — NOT a full course on the underlying technology (React, Supabase, etc.) — assumes the user knows the basics, teaches the *opinionated patterns*.
- NG2 — NOT a video/text tutorial — interactive only.
- NG3 — NOT bundled into skipper-core — separate add-on plugin.

## Requirements

### Must
- M1 — `/private:tutorial <stack-id>` starts an interactive session.
- M2 — Tutorial is per-stack: 8 tutorials at minimum.
- M3 — Lives in a separate plugin (`c-donnachie/private`) listed in the madagascar marketplace.
- M4 — Reads the project's CLAUDE.md to align with the stack's actual conventions.

### Should
- S1 — Validation step at each milestone (e.g. "now create the auth feature folder, then I'll review").
- S2 — Track progress in `.claude/.private-progress.json`.
- S3 — Skipper's hooks integrate (e.g. SessionStart banner shows tutorial progress).

### Won't (this iteration)
- W1 — No video/audio.
- W2 — No real-time multi-user collaboration.

## Open questions

- Q1 — Does interactive validation work well enough in a non-chat hook context? (Probably yes — skills can pause and ask.)
- Q2 — Should tutorials be bundled into a single `private` plugin or one plugin per stack? (Lean: one plugin, parameterized by stack.)
- Q3 — Should `private` track progress per project or per user? (Per project: makes more sense.)

## Related

- ADR: [0007 — Marketplace expandable](../decisions/0007-marketplace-expandable.md)
- Plan de implementación: TBD
