# SPECs — spec-anchored SDD

**Living, verifiable anchors** for the work of the agent (ADR-0024). A SPEC is NOT an ADR:
it is **mutable and kept fresh by Skipper**. The anchor is the stable ID (`SPEC-NNNN#AC-k`),
not the content. Each SPEC declares **acceptance criteria** that the gate
(`/skipper:review` → receipt, ADR-0025) verifies; a `major` divergence blocks delivery.

## Structure

Intent → Acceptance criteria (id · method · verification) → Out of scope → Related.
Methods: `test · type · static · manual · memory · human`. No evidence ⇒ `unverified`, never green.

Create with `/skipper:new-spec "<title>"`. Project-wide Definition-of-Done defaults live in
`skipper.config.json`; a SPEC extends/overrides them with requirement-specific criteria.

## Index

| # | Title | Status |
|---|---|---|
| — | _(none yet — run `/skipper:new-spec`)_ | — |
