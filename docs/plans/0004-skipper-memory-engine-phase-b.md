# Plan 0004 — Skipper Memory engine (Phase B)

- **Status**: Active
- **Created**: 2026-06-17
- **Related PRD**: [docs/prds/0004-skipper-memory-mvp.md](../prds/0004-skipper-memory-mvp.md)
- **Related ADR**: [0014 open-core](../decisions/0014-open-core-boundary.md) · [0015 agent-first](../decisions/0015-mvp-scope-agent-first.md) · [0016 connectors deferred](../decisions/0016-connector-strategy-deferred.md)
- **Related architecture**: [platform-memory.md](../architecture/platform-memory.md)

## Context

Phase B = the **thin walking skeleton** of the Skipper Memory engine. A wizard-of-oz validation (graph-expanded retrieval vs flat retrieval over Skipper's own 16 ADRs) returned **GO, 5/5** — and its failure modes became this plan's spec: 8 hard refinements, baked in as acceptance criteria, gated by the 5 validated questions.

Pipeline (per [platform-memory.md](../architecture/platform-memory.md)): **parser → typed DIRECTED graph (SQLite) → no-vector retrieval → `skipper-memory` MCP server + CLI.** At ~16 ADRs / ~15K tokens, retrieval needs **no vector index** — the relevant nodes fit in context; vectors are deferred until the corpus outgrows it (ADR-0015 build order). OSS, local-only, runs on the user's own Claude (ADR-0014, PRIVACY.md).

This plan was produced by a 4-probe grounded design (each probe read the real corpus) + an **adversarial critic** that found **7 must-fixes** — all applied below (see Notes → "Critic corrections").

### Decisions locked up-front (were open questions; resolved per critic must-fix #3/#4/#5)

- **Runtime**: **Node/TypeScript** for `lib/memory/`, the MCP server, and `bin/skipper` (the MCP SDK is JS-first). Reuse the shipped bash subsystems (`subsystem-map.sh`, `docs-doctor.sh` mechanics) via shell-out. Greenfield: no `package.json` exists yet.
- **Idempotency** = **identical logical row content for a given HEAD**, NOT a byte-identical SQLite file (SQLite isn't byte-reproducible; `head_sha`/`git_last_ts`/`code_commits_since` legitimately change).
- **`context_for` governing-ADR resolution** = a **curated `docs/.skipper/governs.toml`** seed (path → governing ADRs) for Phase B. Graph edges are too sparse for code modules to derive this purely; commit the seed now.

## Steps

### M0 — Foundations (cheap prerequisite; de-risks gitignore + schema-versioning traps)
- [ ] 1. **Lock the runtime** (Node/TS + shell-out to bash subsystems); scaffold `package.json`, `lib/memory/`, `bin/skipper`.
- [ ] 2. **Add `.skipper/` to `.gitignore`** (today only `.claude/.skipper-*` is ignored). ✓ `git check-ignore .skipper/index/graph.sqlite` resolves; a fresh build yields zero `git status` changes.
- [ ] 3. **SQLite schema + idempotent builder**: `nodes(id, type, title, path, number, status, version_tag, date, self_freshness, reflects_version, git_last_sha, git_last_ts, code_commits_since, h1_line)`; `edges(id, from_id, to_id, type, edge_class DEFAULT 'declared', src_file, src_line, raw_text, resolved)` + idx on `(from_id,type)`/`(to_id,type)`; `mismatches(...)`; `meta(key,value)`. **No vector table** (leave a non-destructive seam: `meta.schema_version`). ✓ Two builds on the same HEAD yield **identical logical rows** (node/edge/mismatch counts + content); `meta.head_sha == HEAD`; `sqlite3` opens clean.

### M1 — Directed edges + decoy-safe supersession (RISKIEST — the only recurring error class)
- [ ] 4. **Node parser, line-accurate**: frontmatter is a markdown **bullet block, not YAML** — scan for `- **Status**:` (ADR-0014's Status is at line 6, after two comment lines), split `Accepted (v0.4.0)` → status + version_tag; capture arch `> Last updated… Reflects vX.` → `self_freshness`/`reflects_version` (NULL when absent, e.g. platform-memory.md); plan `Related PRD/ADR` comma-lists drop the path prefix on 2nd/3rd entries — re-resolve against the first entry's dir. ✓ 16 ADRs + 4 PRDs + 3 plans + 5 arch docs become nodes; README index files do **not**.
- [ ] 5. **Directed edge extraction with provenance (#1)**: scan **only** `## More information` / `## Related` for markdown `[text](target.md)` **links**; emit `references`/`implements`/`originated-from` with `from_id`=containing doc, `src_file:src_line:raw_text`. **Precedence rule (must-fix #2): link-shape wins over section membership** — a mention inside those sections that is *not* a markdown link (e.g. `ADR 0008` space-form at `0013:56`) is `edge_class='prose'`, excluded from the directed neighborhood. **Never scan body prose for outbound edges.** ✓ ADR-0001 (link-less) emits **ZERO** outbound `references`; `ADR-0007 references ADR-0001` exists only as an **inbound** `edge_class='prose'` row (from `0007:9`).
- [ ] 6. **Decoy-safe supersession (#4)**: strip all `<!-- … -->` spans **first** (deliberate — do *not* rely on `docs-doctor.sh:166`'s accidental miss), then match `superseded-by` only from frontmatter `Status: Superseded by [ADR-DDDD]` and `supersedes` only from an uncommented `- **Supersedes**: ADR-DDDD`, requiring 4 literal digits. ✓ On the current corpus `COUNT(supersede edges) = 0` (the 3 HTML-comment decoys in 0014–0016, the 2 prose decoys in `0013:25-26`, and template/skill decoys all yield nothing); a fixture with a real `Superseded by [ADR-0099]` yields exactly one pair.

### M2 — Enrichment (git, identity, doc↔code map, mismatch detection)
- [ ] 7. **git ingest**: `git log --no-merges --name-status --format=…` → commit/module/person nodes + `touches`/`authored-by` (`edge_class='derived'`); populate `git_last_sha`/`git_last_ts`/`code_commits_since` via `docs-doctor.sh` mechanics. ✓ `d8fcd5f` is a COMMIT node touching `lib/docs-doctor.sh` + `0013-*.md`.
- [ ] 8. **Person canonicalization**: seed `{@c-donnachie, @Cristian Donnachie, ugar.cristian@gmail.com} → PERSON:cristian-donnachie`; unknown handles get their own node. ✓ `decided-by` from ADR-0001/0009 collapse to one PERSON that also gets `authored-by`; **negative fixture**: an unseeded handle creates a distinct node.
- [ ] 9. **`lib/subsystem-map.sh`** (doc↔code): lift the ≥4-char keyword loop from `hooks/docs-sync.sh:42-51`, emit **all** matches both directions, read an optional `docs/.skipper/subsystem-map.toml` override first, and **extend CODE_PATHS** for this plugin-shaped repo (`hooks/ lib/ skills/ agents/ stacks/` — there is no `src/`). Refactor `docs-sync.sh` to source it (one implementation; **keep its hook behavior unchanged** — coupling risk, guarded by acceptance). ✓ maps `agents.md→agents/`, `hooks.md→hooks/`, `detection.md→lib/detect.sh` with a `source` field.
- [ ] 10. **Commit `docs/.skipper/governs.toml`** seed (path → governing ADRs), feeding `context_for`. ✓ `hooks/` → {ADR-0009, 0010, 0011}; `agents/` → {ADR-0002, 0004}.
- [ ] 11. **Reconciliation pass → `mismatches` (#7)** with **noun-normalization** (must-fix #7): normalize `specialist subagents`/`technicals`/`subagents` to one concept so `7` (ADR-0004:9) and `9` (agents.md:7) actually collide. ✓ a `kind='count'` row pairs `agents.md:7` ('9') with `0004:9` ('7'), with the `plugin.md` '7 technicals' reconciliation note.

### M3 — Retrieval core (pure, deterministic, no-LLM)
- [ ] 12. **Anchor → directed BFS (depth≤2) → Bundle**: lexical anchor scoring (exact `ADR-NNNN` weight 100, title-token 10, path 5, body 1) → top-K; `context_for(path)` anchors via the same `subsystem-map.sh` heuristic the hook uses **+ the `governs.toml` seed**; store inbound/outbound **separately**; assemble `Bundle{anchors,nodes,edges,freshness,mismatches,hub_paths,confidence}`. Zero anchors → low-confidence empty bundle ("no grounded answer"), never hallucinate. **Document** (not implement) the two vector-trigger thresholds. ✓ `expand(ADR-0001)` returns zero outbound ADR edges; no Bundle edge is absent from the `edges` table.
- [ ] 13. **Freshness/drift annotator (#2 — the biggest validated win)**: per cited node, git-delta on its **governed** paths (`STALE_CODE_COMMITS=12`, SKILL severity bands) **OR** version-drift (`Reflects vX` vs `plugin.json` 1.3.0); "header absent" ≠ "present but stale"; label `candidate for review`, never `wrong`. ✓ the four arch docs flag `version_drift` (v1.0.1 vs v1.3.0); platform-memory.md → `declared_version=NULL`.
- [ ] 14. **Hub-node doc-mediated fallback (#5 — the DOMINANT path: ADRs 0001-0006/0008-0013 have zero direct ADR→ADR edges)**: when two ADRs share no edge within depth≤2, route through an arch doc referencing both, typed `doc-mediated-via` with both file:line cites; **never** a direct ADR↔ADR edge. ✓ `relate(ADR-0002, ADR-0004)` → doc-mediated via `agents.md:92/:101`; no shared hub → 'not linked'.

### M4 — Renderer + self-verification (the answer boundary; #3, #6, #8)
- [ ] 15. **Renderer (#1,#3,#5,#6)**: WHY-first lead (≤320 chars, no hashes); each claim tagged `[quote]` (verbatim) or `[inferred]` (basis named, e.g. "inferred via hooks.json"); directed phrasing `{from} {type} {to}` (link-less ADR → "no outbound ADR references"); hub joins → "doc-mediated via <doc>"; mismatches surfaced with both cites, never averaged; body capped (~15 lines), hashes/edge-lists/freshness table → appendix. Citations assembled from the Bundle, not model memory.
- [ ] 16. **Citation self-verification suite (#8)** (`lib/memory/verify`): per citation — path exists; `[quote]` substring present at the cited line; `COMMIT-<hash>` resolves; edge-integrity vs Bundle; no-supersession invariant. Failures **downgrade to `[unverified]` + lower confidence** (transparent, never silent correction); runs inside `ask`/`context_for` before return and via `verify_answer`/`skipper verify` (exit non-zero on failure). ✓ corrupting one edge's `src_line` makes verify flag exactly that edge.

### M5 — Surfaces (the demo)
- [ ] 17. **`skipper-memory` MCP server** (stdio): `ask(question)` → EvidencePack; `context_for(path)` → ContextPack (subsystem doc + freshness flag, governing ADRs + one-line why, invariants as verbatim quotes, risks); `verify_answer(draft)`. **Server does retrieval + verification only — synthesis is the caller's Claude; NO bundled API key** (ADR-0014, PRIVACY.md). ✓ `context_for('hooks/')` returns `hooks.md` (flagged stale) + ADR-0009/0011 + the verbatim "Loop-safety is mandatory" invariant; no network call beyond the user's Claude.
- [ ] 18. **CLI `bin/skipper`**: `index [--full|--since <ref>]` (ensures `.gitignore`), `ask '<q>' [--json|--no-llm|--baseline]`, `context <path>`, `verify`, `eval`. LLM order: `claude -p` > `ANTHROPIC_API_KEY` > `--no-llm` deterministic template. `--baseline` = a **genuine** flat lexical top-K + naive concat (same anchor scorer minus graph/freshness/verify). ✓ `skipper ask --no-llm '<Q1>'` prints a WHY-first cited answer with no model call.

### M6 — Gold regression eval gate (locks the 5/5 GO behaviors)
- [ ] 19. **Author `eval/gold/Q1..Q5.json`** with expected anchors, **directed** edges + provenance, required flags, and **forbidden fabrications**. **Q5 corrected (must-fix #1): `ADR-0013 → ADR-0008`** (the real link is the prose "Builds on… ADR 0008" at `0013:56`, an `edge_class='prose'` mention, **not** a declared reference; ADR-0008's `## Related` does **not** back-link 0013). Q1 forbids any outbound ADR-0001 edge; Q3 requires `hooks.md` flagged stale; Q4 requires the 7-vs-9 mismatch.
- [ ] 20. **Eval runner + CI gate** — see Verification for the exact pass condition (composite weighting + margin defined there, must-fix #6).

## Critical files

- `.gitignore` — add `.skipper/` (M0).
- `hooks/docs-sync.sh:42-51` — keyword doc↔code loop to lift into `lib/subsystem-map.sh` (refactor in place, behavior unchanged).
- `lib/docs-doctor.sh:79-90` (git-delta), `:101-114` (link resolution), `:166` (the accidental decoy-miss to **not** rely on) — mechanics to reuse.
- `skills/update/templates/adr.md:3,10`, `skills/new-adr/SKILL.md:31`, `skills/init-structure/SKILL.md:80` — where the supersede **decoys** are baked in (permanent trap).
- `docs/architecture/agents.md:7,92,101`, `docs/decisions/0004-specialists-can-write.md:9,19` — the verified 7-vs-9 mismatch + the doc-mediated hub edges.
- **New**: `package.json`, `lib/memory/{parse,graph,retrieve,render,verify}.*`, `lib/subsystem-map.sh`, `bin/skipper`, `eval/gold/Q1..Q5.json`, `docs/.skipper/governs.toml`, `docs/.skipper/subsystem-map.toml` (optional override).

## Verification

End-to-end, the **gold-set gate** (`skipper eval`, deterministic `--no-llm`) exits 0 **only when ALL hold across Q1–Q5**:

1. `citation_validity == 1.0` — every cited claim passes the #8 self-verification (path exists, quote at file:line, hash resolves, edge in Bundle).
2. `fabrication_count == 0` — no edge/supersession emitted that isn't in the graph (incl. Q1 emitting **no** outbound ADR-0001 edge, and zero supersede claims corpus-wide).
3. Every EvidencePack `verified == true`.
4. **Engine composite > baseline composite** with a defined, stable metric (must-fix #6): `composite = 0.34·anchor_recall + 0.33·edge_correctness + 0.33·required_signals_frac` (each normalized 0–1); require **engine ≥ baseline + 0.15 absolute margin**, where the margin must come from `edge_correctness`/`required_signals` (anchor_recall can tie, since exact `ADR-NNNN` lexical match is identical for both).
5. Per-question `required_signals` present: Q1 inbound-only `ADR-0007→ADR-0001`, no fabricated outbound; Q2 the "Loop-safety is mandatory" invariant quote; Q3 `hooks.md` flagged stale; Q4 the 7-vs-9 mismatch with both cites; **Q5 `ADR-0013→ADR-0008` (prose build-on link)** + `implements` edge to plan-0003.

Any failure exits non-zero and fails CI. Plus the 8 global acceptance criteria (one per refinement) and the M0 logical-row idempotency check.

## Notes

**Scope OUT (deferred — do not build in Phase B):** vector index/embeddings/sqlite-vec (PRD M2/M3 — defer until the corpus outgrows context; M3 documents the trigger, M0 leaves a non-destructive schema seam); web graph/timeline/health dashboard (ADR-0015, PRD W1); Slack + any non-MCP/CLI surface (W4); external connectors (ADR-0016, W3); multi-repo/hosted SaaS (ADR-0014, W2); **bundled API key** (forbidden by ADR-0014/PRIVACY.md); GitHub **PR ingest** (keep node shape reserved, ingest git log only in Phase B); auto-refresh hook (the engine exposes `skipper index`; wiring it into PostToolUse/Stop/CI is a follow-on).

**Top risks:** (1) the ADR template permanently bakes in supersede decoys → HTML-comment stripping must run before *any* supersede scan forever (M6 gate hard-asserts 0 supersede edges). (2) `docs-doctor`'s `CODE_PATHS` miss this repo's `hooks/ skills/ agents/ stacks/` → freshness reads falsely fresh unless extended (M2). (3) lexical-only anchoring + Spanish questions vs English ADRs will under-retrieve on synonymy → `anchor_recall` is the early-warning trigger to add vectors. (4) the `--baseline` must be a *genuine* lexical retriever, or the "beats baseline" win is unattributable.

**Remaining open questions:** MCP synthesis contract — is a mandatory `verify_answer` round-trip acceptable UX, or should the server return a stricter pre-rendered answer the agent only rephrases? · ADR/PRD freshness authority — Status `(v1.3.0)` tag vs README rows vs `plugin.json` (or ADRs get git-delta only)? · confirm empty PR nodes don't break schema/answers.

**Critic corrections applied (7 must-fixes, from the adversarial review):** #1 Q5 edge direction flipped to `ADR-0013→ADR-0008` (prose); #2 parse-precedence "link-shape wins over section membership" made explicit (M1.5); #3 `context_for` resolution committed to `governs.toml` seed (M2.10); #4 idempotency re-spec'd as logical-row, not byte-identical (M0.3); #5 runtime decision (Node/TS) moved to M0 prerequisite; #6 composite metric weighting + 0.15 margin defined (Verification.4); #7 noun-normalization for the count detector (M2.11).
