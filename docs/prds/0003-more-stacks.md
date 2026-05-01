# PRD 0003 — More stacks (Astro, SvelteKit, Tauri, Remix)

- **Status**: Draft
- **Owner**: @c-donnachie
- **Created**: 2026-04-30
- **Target date**: v1.x (incremental, based on demand)

## Problem

The current 8 stacks cover ~95% of common web/mobile projects but miss several frameworks gaining traction:

- **Astro** — content/marketing sites, MPA-first.
- **SvelteKit** — Svelte's full-stack framework.
- **Tauri** — Rust + web for desktop apps.
- **Remix** — full-stack web with nested routing (post Vercel acquisition, status changing).
- **Bun + Hono** — alternative Node stack with Bun runtime.

A user on Astro/SvelteKit/Tauri can't use skipper today — `/skipper:scan` returns "no stack detected".

## Users

- Devs using these alternative frameworks.
- Teams evaluating skipper for projects on these stacks.

## Goals

- G1 — Add stack profiles for the 4 most-requested frameworks.
- G2 — Each new stack ships with: detection in `lib/detect.sh`, `profile.json`, `claude.md.tmpl`, `architecture.md.tmpl`, fixture in `examples/fixtures/`.
- G3 — Test coverage in `lib/test-detect.sh`.

## Non-goals

- NG1 — NOT a goal to support every framework ever — we ship based on real demand (GitHub issues + Discord/Twitter signals).
- NG2 — NOT obligated to go in any specific order — easier additions first (Astro, SvelteKit), harder later (Tauri requires understanding the JS+Rust split).

## Requirements

### Must
- M1 — Each new stack passes the test suite (`lib/test-detect.sh`).
- M2 — Each new stack has an opinionated CLAUDE.md template (same standard as current 8).
- M3 — Stack-doctor compatibility (reads the new template's rules and validates).

### Should
- S1 — When a new framework requests support, ship a fixture first (no profile yet) so detection works at "low confidence" → suggests user to fill in conventions.
- S2 — Support both backend variants for each stack when applicable (Astro+Supabase, Astro+Node, etc.).

### Won't (this iteration)
- W1 — No bulk addition. Each new stack is its own PRD-and-PR cycle to maintain quality.
- W2 — No support for stacks the maintainer hasn't used in production — would risk shipping bad opinions.

## Open questions

- Q1 — Astro's "framework adapter" pattern (React, Vue, Svelte islands) — does each combo need its own profile or one Astro profile with options?
- Q2 — Bun runtime support: should we duplicate node-api as bun-api, or modify node-api detection to recognize Bun?
- Q3 — Tauri: does it require a backend stack alongside (Rust)? Should there be an integrated "Tauri+Rust" stack?

## Priority order (tentative)

1. Astro+Supabase (high demand)
2. Astro+Node (medium demand)
3. SvelteKit+Supabase
4. Bun+Hono (Hono is already detected, just needs Bun runtime markers)
5. Tauri (lower priority, more complex)
6. Remix (depends on Remix+Vercel direction)

## Related

- ADR: [0005 — Monolithic profiles then layers](../decisions/0005-monolithic-then-layers.md)
- Architecture: [Detection algorithm](../architecture/detection.md)
