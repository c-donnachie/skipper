# Subagent coordination

> Last updated: 2026-04-30. Reflects v1.0.1.

## The team

skipper ships 9 subagents organized in 3 categories. The Madagascar metaphor is intentional: penguins have personality and roles; technical specialists are the "contracted experts" — separate concept on purpose.

### Penguins (with personality)

| Penguin | Role | Writes? | Invoked by |
|---|---|---|---|
| 🐧 **skipper** | Captain / router. Reads context, decides which specialist to invoke. | No (read-only) | `/skipper:ask`, `/skipper:review` |
| 🐧 **kowalski** | Analyst. Reads diff, classifies changes, writes docs from templates. | Yes | `/skipper:update` |
| 🐧 rico (reserved) | Aggressive refactor / mass renames / move files. | Yes (planned) | (v1.x add-on) |
| 🐧 private (reserved) | Apprentice / tutorials / web lookups. | No (planned) | (future add-on) |

### Cross-cutting technicals

| Technical | Domain | Writes? |
|---|---|---|
| `architect` | Structure, layers, dependencies, boundaries | Yes |
| `solid-coach` | Clean Code, SOLID, function/class refactor | Yes |

### Stack technicals

| Technical | Stack(s) | Writes? |
|---|---|---|
| `react-vite` | react-vite-supabase, react-vite-node | Yes |
| `react-native` | expo-supabase, expo-node | Yes |
| `nextjs` | nextjs-fullstack, nextjs-supabase | Yes |
| `node-backend` | node-api | Yes |
| `supabase` | any *-supabase stack | Yes |

## Routing logic (skipper-captain)

When `/skipper:ask` is invoked, skipper-captain runs in `context: fork` and applies these signals in priority order:

### Priority 1 — Intent keywords in the question

| Keywords | Specialist |
|---|---|
| "structure", "layers", "organization", "where should", "boundaries" | `architect` |
| "SOLID", "SRP", "OCP", "smells bad", "refactor", "extract", "Clean Code" | `solid-coach` |
| "document", "ADR", "PRD", "plan", "update docs" | `kowalski` (via `/skipper:update`) |
| "RLS", "policy", "auth", "SQL migration", "Storage", "Realtime" | `supabase` |
| "endpoint", "route handler", "service", "repository" | `node-backend` |

### Priority 2 — Edited paths

If the diff dominates a clear domain (using `paths:` glob from each agent's frontmatter):

- `src/features/**/*.tsx` (react-vite stack) → `react-vite`
- `app/**/*.tsx` (nextjs stack) → `nextjs`
- `app/**/_layout.tsx`, `src/data/services/*` (expo stack) → `react-native`
- `src/routes/**`, `src/services/**` (node-api) → `node-backend`
- `supabase/migrations/**`, `*.sql` → `supabase`

### Priority 3 — Stack fallback

If no clear paths nor explicit intent, use the frontend specialist of the declared stack from `CLAUDE.md`.

### Ambiguous

If multiple matches with similar weight, list 2-3 options and ask the user to pick.

## Communication patterns

### Skill → subagent (delegation)

```yaml
# In the skill SKILL.md frontmatter:
context: fork
agent: <agent-name>
```

The skill body becomes the subagent's task. Skill `argument-hint` and `$ARGUMENTS` substitution work normally — the substituted text goes into the subagent's prompt.

### Subagent → user (output)

A subagent can't ask the user mid-flow (no chat access in fork). It must:
- Write directly when confident
- Or return a "recommendation" string back to the main chat with a suggested next action
- Conservative bias: when in doubt, don't write

### Subagent → subagent (NOT supported)

Subagents can't directly invoke other subagents. The **main chat** is the orchestrator. skipper-captain returns a recommendation; the user (or Claude in main chat) runs the next slash command.

## Why skipper-captain doesn't write

Decision documented in [ADR-0002](../decisions/0002-skipper-router-kowalski-analyst.md). Summary:

- Captain's role is **decision-making**, not execution.
- If the captain wrote code, it would compete with the technicals (race conditions on intent).
- Read-only is also smaller token-wise — captain only needs Read/Grep/Glob/Bash, not Write/Edit.
- This makes Madagascar's roles cleaner: penguins coordinate (skipper) and analyze (kowalski); technicals execute.

## Why technicals can write (controversial)

Decision documented in [ADR-0004](../decisions/0004-specialists-can-write.md). Summary:

- User explicitly chose this in the v0.3 design phase.
- Mitigations: they always come from explicit slash commands, run in `context: fork` (isolated), and are conservative by default.
- For higher safety, users can install with `Skill(<agent>)` denied in their permissions.

## Future: rico

Reserved penguin for v1.x. Concept:
- More aggressive than solid-coach (can move/split/merge files across the project)
- Larger blast radius → requires extra confirmation step
- Possibly bundled as a separate optional plugin (`c-donnachie/rico` add-on in madagascar marketplace)

## Future: private

Reserved penguin for the future. Concept:
- Onboarding tutorials per stack
- Web lookups for libraries / patterns
- "Private, you take notes" — captures knowledge in the project's docs as the user works
- Likely a separate optional plugin too
