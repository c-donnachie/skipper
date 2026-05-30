# 0013 — MADR-aligned ADR lifecycle + supersede workflow

- **Status**: Accepted
- **Date**: 2026-05-30
- **Deciders**: @Cristian Donnachie

## Context and problem statement

ADRs have become a de-facto industry convention, and **MADR 4.0.0** (Markdown Any Decision Records) is the leading standard. skipper already created and nudged ADRs well (the `new-adr` skill plus five proactive hooks that prompt an ADR when a tradeoff decision appears), and already used the MADR file convention (`NNNN-title-with-dashes.md`). But it was missing the parts that make ADRs *durable*:

- The **immutability principle**: an Accepted ADR is history — you don't rewrite it, you supersede it with a new one and cross-link them. skipper had no supersede operation, so changed decisions were either lost or silently edited.
- The template was Nygard-ish and lacked MADR's **decision drivers** and **confirmation** fields.
- `docs-doctor` checked staleness/stubs but ignored ADR hygiene (decisions stuck in Proposed, broken supersede links, missing status).

## Decision drivers

- Align with the standard the user (and the industry) already follows (MADR 4.0).
- Keep skipper opinionated-but-minimal — adopt MADR's rigor without its full heavyweight template.
- Make the decision log *durable*: lifecycle + immutability + automated hygiene.

## Decision

Adopt a MADR-lite lifecycle across skipper:

- **Template** (`skills/update/templates/adr.md`): add the lifecycle vocabulary to Status (`Proposed → Accepted | Rejected → Deprecated | Superseded by ADR-NNNN`), `Decision drivers`, `Confirmation`, and optional `Supersedes`/`Consulted`/`Informed` metadata — keeping skipper's structure.
- **New skill `/skipper:supersede-adr <old> "title"`**: marks the old ADR `Superseded by ADR-NNNN` (status only — body untouched), creates the replacement with `Supersedes ADR-MMMM`, links both, updates the index.
- **`docs-doctor` ADR hygiene**: flag `broken-supersede` (link to a nonexistent ADR), `stuck-proposed` (Proposed > 30 days), and `missing-status`.
- **Protocol** (`decisions/README`, `new-adr`): document the lifecycle and the immutability rule (supersede, don't rewrite).

## Alternatives considered

- **Full MADR template (frontmatter YAML, pros/cons per option)** — rejected: too heavyweight for skipper's minimal ethos; adopted the high-value subset instead.
- **Extend `new-adr` with a `--supersedes` flag instead of a new skill** — rejected: superseding is a distinct two-file operation (mutate old + create new) with its own rules; a dedicated skill is clearer and discoverable.
- **Leave superseding to the user by hand** — rejected: that's exactly where decision logs rot (broken/empty links, edited-in-place Accepted ADRs).

## Consequences

### Positivas
- skipper's ADRs now follow the recognized standard, with a real lifecycle.
- Changed decisions stay traceable (bidirectional supersede links), and `docs-doctor` keeps the chain healthy.
- Existing ADRs remain valid — the new template is a superset; nothing is broken.

### Negativas / costos
- One more skill in the catalog; slightly larger ADR template.

### Qué hay que vigilar
- `stuck-proposed` relies on the file's last git commit as a proxy for "when proposed"; a touched-but-not-ratified ADR could reset the clock. Acceptable.

## Confirmation

`docs-doctor` reports `adr_issues`; `/skipper:supersede-adr` produces the bidirectional links; validated in a synthetic repo (broken-supersede + missing-status caught) and skipper's own ADRs report clean.

## More information

- MADR 4.0.0: https://adr.github.io / https://github.com/adr/madr
- Builds on the docs health checks — ADR 0008.
