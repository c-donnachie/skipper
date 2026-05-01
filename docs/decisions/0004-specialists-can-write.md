# 0004 — Specialist subagents can write code

- **Status**: Accepted (v0.3.0)
- **Date**: 2026-04-28
- **Deciders**: @c-donnachie

## Context

When designing the 7 specialist subagents (architect, solid-coach, react-vite, react-native, nextjs, node-backend, supabase), three permission models were considered:

**A — Read-only (advisory)**: agents can Read/Grep/Glob. They return recommendations to the main chat. The user (or Claude) applies changes manually.

**B — Can write**: agents have Read/Write/Edit. When invoked via slash commands, they apply refactors directly.

**C — Mixed**: cross-cutting agents (architect, solid-coach) are advisory; stack-agents can write.

## Decision

Go with **B — Can write** for all 7 specialists.

Rationale:
- Aligns with the user's stated goal ("framework that does the work for me").
- Matches the pattern already used by `kowalski` (writes docs directly).
- Conservatism is enforced via:
  - `context: fork` isolation (a specialist gone wrong can't poison the main chat)
  - Always invoked from explicit slash commands (`/skipper:react-vite`, never auto)
  - Each agent's system prompt instructs to **propose a table first, wait for SI/NO** when applying multiple changes
  - For higher safety, users can deny `Skill(<agent>)` in their permissions

## Alternatives considered

- **A — Read-only**: rejected. Forces an extra step (user manually applies recommendations) that erodes the value proposition. The framework should do the work.

- **C — Mixed**: considered but rejected for now. Conceptually the line is fuzzy — architect changes structure (which is "writing"), solid-coach extracts hooks (which is "writing"). Better to be consistent: all specialists write, all use the same conservative pattern.

## Consequences

### Positive
- One coherent permission model — easier for users to reason about.
- `/skipper:refactor file.ts` actually refactors, not just suggests.
- Fast feedback loop: invoke → see proposal → approve → see result.

### Negative / costs
- **Risk of unwanted writes**: if a specialist misjudges, it modifies code the user didn't expect. Mitigation: `context: fork` keeps changes scoped; user can `git diff` to review.
- **Permission prompts**: Claude Code asks permission for Write/Edit by default. Users see lots of prompts unless they set `allowed-tools` in their config.
- **Test coverage gap**: subagent behavior is hard to test deterministically. Validation relies on user feedback.

### What to watch
- **User reports of "skipper wrote something I didn't want"**: track in GitHub issues.
- **Permission fatigue**: if too many users disable agents because of the prompt frequency, reconsider read-only mode for specific agents.
- **Compare to similar projects**: if similar plugins move to read-only and the community prefers that, follow.
