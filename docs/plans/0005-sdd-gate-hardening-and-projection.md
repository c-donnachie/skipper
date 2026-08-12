# Plan 0005 — SDD gate: hardening & UI projection (what's left after PRD-0006 Phase A)

- **Status**: Active
- **Created**: 2026-08-11
- **Related PRD**: docs/prds/0006-sdd-verification-evidence-pipeline.md
- **Related ADR**: docs/decisions/0024-spec-anchored-sdd-living-spec.md · 0025 · 0026

## Context

PRD-0006 Phase A (M1–M9) + S1/S2 shipped and tested (engine suite 22/22 gate + 19/19 gold), and
skipper dogfoods its own gate. What remains is the fuzzy/subjective tail (S3 wiring), CI enforcement,
and the paid UI projection (Stage 2). This plan tracks that so nothing silently drops.

## Steps

- [ ] 1. **S3 — `/verify` → artifact wiring.** When a `manual` criterion needs proof, have the review
  invoke `/verify` (run the app, observe), capture its output to a file, and pass
  `skipper gate freeze --artifact=<AC-id>=<path>`. Inherently judgment-driven — document the flow in
  `/skipper:review` (mostly done) and add one worked example. No new engine surface expected.
- [ ] 2. **CI enforcement.** Add the gate to CI: `skipper gate validate` on PRs (block on `stale`),
  and keep `npm test` (engine) as the deterministic gate. Decide: does CI also `gate freeze`, or only
  validate a committed receipt? (leans: validate a committed receipt on protected branches).
- [ ] 3. **Graph attach for evidence/receipt nodes (deepen M6).** Today SPECs are nodes; evidence and
  receipts are in-repo files only. Optionally ingest `evidence`/`receipt` as nodes with
  `evidences`/`attests` edges so `ask`/`context` can answer "is SPEC-0003 evidenced & fresh?".
- [ ] 4. **`specs infer` (v2, deferred in ADR-0024).** Brownfield on-ramp: derive candidate SPECs from
  existing code so adoption isn't fully manual. Gate behind explicit request.
- [ ] 5. **UI projection (Stage 2, paid — ADR-0020/0023).** The DoD board (img 1), architecture/laws
  panel (img 2), setup wizard (img 3) as a projection that **writes back** to `skipper.config.json` /
  `CLAUDE.md` / `docs/specs/`. Files stay the source of truth; the UI never becomes the only surface.
  Lives in the separate closed repo.

## Critical files

- `engine/lib/evidence.mjs` — artifact plumbing already there (`runCriterion` opts.artifact)
- `engine/lib/risk.mjs` — tune `sensitive_paths` / thresholds as real usage lands
- `skills/review/SKILL.md` — the S3 worked example (step 1)
- `.github/workflows/*` — CI gate (step 2)
- `engine/lib/parse.mjs` — evidence/receipt node ingestion (step 3)

## Verification

1. `node engine/bin/skipper.mjs gate freeze --artifact=AC-2=/tmp/proof.png` → manual criterion `pass`.
2. CI: a PR that changes a SPEC-anchored file without re-freezing → `gate validate` = `stale` → red.
3. `npm test` (engine) stays green.

## Notes

S4 (unverified policy) and S5 (evidence drift) are covered by design (config.gatePolicy +
content-bound receipt invalidation) — not steps here. Keep the UI a **projection**: the fence
(ADR-0021) means the whole engine/gate stays free; only the hosted surfaces are paid.
