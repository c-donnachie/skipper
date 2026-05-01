# 0003 — Strongly opinionated CLAUDE.md profiles

- **Status**: Accepted (v0.2.0)
- **Date**: 2026-04-28
- **Deciders**: @c-donnachie

## Context

When `/skipper:stack-apply` generates a CLAUDE.md section for a stack, two philosophies were on the table:

**A — Strong opinion**: declare mandatory structure (e.g. `src/features/<dominio>/`), naming conventions (named exports, no `default`), recommended libs, validatable SOLID rules, explicit anti-patterns.

**B — Light**: just declare the stack id and a couple of pointers; leave conventions up to the user/team.

## Decision

Go with **strong opinion**. Each stack profile generates a CLAUDE.md with:

- Mandatory folder structure.
- Naming conventions.
- Library recommendations.
- SOLID rules with concrete numerical thresholds (e.g. "component < 200 lines").
- Anti-patterns explicitly listed with ❌.

This makes the generated CLAUDE.md actionable for both Claude (which follows it as instructions) and humans (who read it as a constitution).

## Alternatives considered

- **B — Light**: rejected. The user's main pain ("I fight with Claude because it doesn't follow my architecture") needs Claude to **know** what the architecture is. A light CLAUDE.md doesn't solve that — it just declares what stack the project uses.

- **C — Hybrid (skeleton + opt-in rules)**: considered but rejected for v1.x. Adds implementation complexity (toggles, conditional sections) for unclear value. Easier to ship strong opinion and let users delete what they don't agree with.

## Consequences

### Positive
- Generated CLAUDE.md is actually useful — Claude follows the rules most of the time.
- Cross-project consistency: if you apply `react-vite-supabase` in 5 projects, all 5 follow the same conventions. Easier to context-switch.
- `/skipper:stack-doctor` has something to validate against. Without strong opinion, the doctor would have nothing to check.

### Negative / costs
- **Friction for users with their own conventions**: if your team uses `pages/` instead of `app/router/`, you'll need to edit CLAUDE.md after applying. Mitigation: the marker `<!-- skipper:stack -->` only owns its own section — user can edit freely outside it.
- **Maintenance**: when a stack's best practices evolve (e.g. Next.js moving from Pages Router to App Router), the templates need updating. Versioning helps — users on older versions don't get the new opinion automatically.
- **Could feel "too prescriptive"** for some teams. Mitigation: the generated CLAUDE.md is a starting point, not a contract. Users can edit/remove sections.

### What to watch
- **Issue feedback**: if users complain about specific rules, evaluate whether they're stack-wide gotchas (fix in the template) or team preferences (leave as-is, document escape hatches).
- **Convention drift**: each release should review whether the rules in templates still match current best practices for the stack.
- **Stack-doctor false positives**: if the doctor flags too many things that aren't real violations, the rules are too strict — relax them.
