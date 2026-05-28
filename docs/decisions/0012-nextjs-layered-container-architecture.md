# 0012 — Next.js profiles adopt layered + Container architecture

- **Status**: Accepted
- **Date**: 2026-05-28
- **Deciders**: @Cristian Donnachie

## Context

skipper's Next.js profiles (`nextjs-fullstack`, `nextjs-supabase`) and the `nextjs` specialist used a flat `features/<domain>/{actions,queries,schema,components}` structure. A review of a mature production Next.js 16 app (buenisimo-web: App Router + Supabase SSR + RHF + Zod + Zustand) surfaced a more disciplined, battle-tested model that the flat structure lacked:

- A **layered** architecture (`app → actions → data → domain → presentation → global`) — the *same* layering skipper already mandates for Expo, so the flat Next.js model was an inconsistency.
- The **Container Pattern**: Page (Server, fetch) → `<Feature>Container` (Client, orchestrates) → presentational components (pure, no hooks). The container lives at feature level, not inside `components/`.
- **Standardized response types** (`ServerActionResponse<T>`, `ApiResponse<T>`); server actions return them and never throw to the client.
- A **service layer** that never throws and returns valid fallbacks with type narrowing (`unknown`, never `any`).
- A **data-fetching decision table** (RSC vs Server Action vs useActionState/useTransition/useOptimistic vs Zustand vs realtime subscription).

## Decision

Align both Next.js profiles and the `nextjs` agent to the layered + Container model proven in buenisimo-web:

- Rewrite `stacks/nextjs-supabase/claude.md.tmpl` and `stacks/nextjs-fullstack/claude.md.tmpl` with the layered structure, Container Pattern, decision table, `ServerActionResponse`, service-layer rules, and enriched anti-patterns.
- Update both `architecture.md.tmpl` (Container Pattern, standardized types, service layer; clients moved from `shared/supabase/` to `data/supabase/`).
- Rewrite `agents/nextjs.md`: Container Pattern, layered laws, `ServerActionResponse`, service layer, the decision table, domain hooks, `getUser()` over `getSession()`, and the new anti-patterns (`any`→narrowing, hooks-in-atomics, Link-vs-router.push, container placement). Update `paths` to the layered folders.
- Add `@hookform/resolvers` and `zustand` to both profiles' `recommended_libs`.

## Alternatives considered

- **Keep the flat `features/` model** — rejected: less disciplined, and inconsistent with skipper's own Expo layering. The user explicitly flagged the layered app as the better reference.
- **Invent a new structure** — rejected: buenisimo-web is a real, shipping app; copying a proven model beats theorizing.
- **Bloat the templates with everything buenisimo-web documents (486 lines)** — rejected: skipper templates stay opinionated-but-minimal; distilled the patterns into tight rules.

## Consequences

### Positivas
- Next.js now matches Expo's layered model — one mental model across skipper's stacks.
- Container Pattern + service layer + standardized responses give Claude concrete, enforceable laws (better `stack-doctor`/specialist output).
- Grounded in a production codebase, not speculation.

### Negativas / costos
- Behavior change for projects already scaffolded with the old flat structure (they keep working; new scaffolds differ). Not auto-migrated.
- Slightly larger CLAUDE.md stack block.

### Qué hay que vigilar
- Whether the Container Pattern feels heavy for tiny apps; if so, document a "lite" escape hatch.
- buenisimo-web itself doesn't document RHF+Zod in its CLAUDE.md though it uses it — skipper now codifies that gap as a rule.

## Related

- Health checks — ADR 0008. Proactive hooks — ADR 0009/0010/0011.
