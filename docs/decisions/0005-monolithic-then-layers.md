# 0005 — Monolithic stack profiles in v0.2, composable layers in v0.6

- **Status**: Accepted (v0.2.0 onwards)
- **Date**: 2026-04-28
- **Deciders**: @c-donnachie

## Context

When designing how to model "stack" in the plugin, two architectures were considered:

**A — Monolithic profiles**: each combo (e.g. `react-vite-supabase`) is a fixed bundle with its own CLAUDE.md template, architecture template, and metadata. 8 profiles cover the main combos.

**B — Composable layers from day one**: a stack is composed of layers. `react-vite + supabase + tailwind` is built by combining 3 layer fragments at install time.

The tradeoff: A is faster to build, less flexible. B is more flexible, takes 2x to build the first version.

## Decision

**Phased approach**:
- **v0.2**: ship monolithic profiles (option A). 8 stacks covering 95% of common combos.
- **v0.6**: add composable layers (option B-style) as an additive feature. The 6 layers (tailwind, shadcn-ui, tanstack-query, zustand, zod, nativewind) are bolt-on extras applied via `/skipper:stack-add <layer>`.

Both models coexist:
- The **stack** declares the foundation (mandatory parts of the architecture).
- **Layers** declare optional additions that don't change the foundation.

## Alternatives considered

- **B from v0.2**: rejected. Would have delayed v0.2 by 1-2 weeks for marginal flexibility. The 8 monolithic combos cover what 95% of users need on day one.

- **Only A forever**: rejected. As soon as someone wants `react-vite-supabase + Framer Motion`, they'd need a custom profile. Layers solve that without N×M combinations.

- **Layers replacing profiles**: rejected. A pure-layer model loses the "opinionated foundation" — someone composing react+vite+supabase should get the same conventions as someone choosing the `react-vite-supabase` preset. The preset is the ergonomic happy path.

## Consequences

### Positive
- **Fast time-to-value**: v0.2 shipped with 8 ready-to-use stacks.
- **Predictable presets**: a user picking `react-vite-supabase` knows exactly what conventions they'll get.
- **Extensibility via layers**: niche additions (Framer Motion, shadcn-ui, etc.) don't bloat the core.
- **Clear separation**: stack = foundation, layer = bolt-on.

### Negative / costs
- **Two mental models**: users have to know about both stacks and layers. Mitigation: README documents both clearly; `init-structure` defaults to the simpler stack-only flow.
- **Compatibility matrix**: each layer declares `compatible_with: [stacks]`. As we add layers and stacks, the matrix grows. Mitigation: layers are per-feature, not per-stack — most layers are stack-agnostic.

### What to watch
- **Layer demand**: if many users compose the same 3 layers on top of a stack, consider creating a new monolithic profile (e.g. "the full SaaS stack" preset).
- **Conflict cases**: layers that contradict the stack's CLAUDE.md (e.g. Tailwind layer trying to add web-specific rules to an Expo stack). Layers declare `compatible_with` to prevent incompatible combinations, but the warning system for soft conflicts could be improved.
