# 0007 — Madagascar marketplace expandable for future add-ons

- **Status**: Accepted (v0.4.0)
- **Date**: 2026-04-29
- **Deciders**: @c-donnachie

## Context

After deciding to keep skipper monolithic (ADR-0001), the marketplace structure was reconsidered.

Two strategies:

**A — Single-plugin marketplace**: marketplace lists only `skipper`. Forever.

**B — Expandable marketplace**: marketplace structure ready to list multiple plugins, even if today there's only `skipper`. Future add-ons (`private`, `rico`) can be added without restructuring.

## Decision

**Option B — Expandable**.

The marketplace is named `madagascar` (the universe), not `skipper-marketplace`. The `marketplace.json` structure declares an array of plugins (currently just `skipper`), but adding more is trivial — append to the array, push, users discover via `/plugin marketplace browse`.

## Alternatives considered

- **A — Single-plugin marketplace**: rejected. Locks future add-ons into either:
  - Bundling them into skipper (contradicts ADR-0001's monolithic but small core).
  - Creating separate marketplaces per add-on (worst UX — users add N marketplaces).
  
  Better to plan for expansion now.

- **No marketplace, only direct GitHub install**: rejected. `/plugin marketplace add` with a single `marketplace.json` source is the standard Claude Code distribution pattern. Skipping it makes installation harder and discovery impossible.

## Consequences

### Positive
- **Future-ready**: add-ons (`private`, `rico`, niche stacks) can be published as separate plugins listed in the same marketplace. Users add the marketplace once, opt into add-ons individually.
- **Brand consistency**: "Madagascar" is the universe, "Skipper" is the captain. Adding "Private" or "Rico" plugins fits the metaphor.
- **No migration**: the marketplace name change from `c-donnachie/skipper-marketplace` → `c-donnachie/madagascar` happened with GitHub redirect support, so existing users weren't broken.

### Negative / costs
- **Naming overhead**: distinction "marketplace = madagascar, plugin = skipper" needs to be explained in README. Mitigation: explicit "Madagascar universe" section.
- **No plugins listed yet**: at v1.0.1, the only plugin is skipper. The "expandable" structure is symbolic until `private` or `rico` ship. Some might see this as over-engineering.

### What to watch
- **Add-ons demand**: if no add-ons emerge by v1.5, reconsider whether the expandable structure was justified. If demand is real (issues asking for "skipper but only docs", etc.), build them.
- **Submission to official marketplace**: if accepted, users may install via Anthropic's marketplace instead of madagascar. Both should work in parallel without conflict.
