# Changelog

All notable changes to skipper. Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.2] — 2026-06-25

### Changed
- **Unified chat visual identity** — every skipper-originated message now uses one consistent banner, `━━━ 🐧 SKIPPER · <category> ━━━`, so the user can tell skipper's voice from Claude's at a glance. Categories: `session`/`proactive` (session-start), `docs` (Stop docs-sync), `specialist` (routing), `memory` (engine `context`/`guard`). Color is intentionally avoided — Claude Code renders hook output as plain markdown and strips ANSI, so the text signature is the only reliable differentiator. See [`docs/architecture/hooks.md`](./docs/architecture/hooks.md).

## [1.4.1] — 2026-06-25

### Fixed
- **MCP packaging** — stop shipping the root `.mcp.json` with the plugin. Because it was committed, the plugin bundled and auto-registered the `skipper-memory` MCP server, which (a) produced a duplicate warning (`skipped — same command/URL`) in any repo that also configured it, and (b) used a broken relative path (`engine/bin/skipper.mjs`) for end users who install the plugin. This violated [ADR-0017](./docs/decisions/0017-memory-engine-separate-opt-in-package.md) (engine is opt-in, **not** bundled). The plugin now stays pure markdown+bash; each repo opts into memory via its own `.mcp.json` (see [`engine/README.md`](./engine/README.md)).

## [1.4.0] — 2026-06-17

### Added
- **🧠 Skipper Memory** — a new **opt-in OSS engine** (`engine/`, Node + built-in `node:sqlite`, zero deps) that turns the markdown skipper already produces into a **queryable, cited, drift-aware memory**. Separate package, reached via MCP — the plugin stays zero-install (ADR-0017). Scoped by PRD-0004, built per plan-0004; validated **GO 5/5** via a multi-agent wizard-of-oz.
  - **Typed directed graph** of ADRs/PRDs/plans/arch + commits/people/modules; every declared edge carries `file:line` provenance. Decoy-safe supersession; never fabricates an outbound edge from a link-less ADR.
  - **`skipper ask`** — cited, graph-expanded answers (LLM prose via *your own* `claude` CLI, or `--no-llm` deterministic). **`skipper context <path>`** — the ADRs governing a path + invariants + freshness + recent activity. **`skipper relate <A> <B>`** — direct / doc-mediated-via-hub / not-linked.
  - **`skipper-memory` MCP server** (`ask`, `context_for`) — a Conductor agent consults the project memory **before** editing. *Conductor = execution, Skipper = knowledge.*
  - **Freshness/drift**: doc version vs `plugin.json` **+** git-delta (commits touching the subsystem since the doc was last edited). Plus **who-decided**, **what-touched**, and **count-mismatch** flags.
  - **`skipper eval`** — a 19-check deterministic **gold regression gate** for CI.
- **Proactive memory hooks** (ADR-0018) — `hooks/memory-guard.sh` (PostToolUse) injects the ADRs governing the edited path as `additionalContext`; `hooks/memory-stop.sh` (Stop) `exit 2`s if governed code changed, so Claude self-verifies compliance before yielding. No-op without the engine; loop-safe, throttled, opt-out `SKIPPER_PROACTIVE=off`.
- **`skipper-memory.config.json`** — committed per-repo config: `governs` (code path → governing ADRs) and `subsystems` (arch doc → code dir); falls back to built-in defaults.
- New decision records **ADR-0014…0018** (open-core boundary, MVP scope, connector strategy, engine-as-separate-package, proactive memory) + **PRD-0004** + **plan-0004**.

### Changed
- `hooks/hooks.json` now wires **9 scripts** across 5 events — added `memory-guard.sh` (PostToolUse Edit|Write) and `memory-stop.sh` (Stop).
- `docs/architecture/hooks.md` + `plugin.md` corrected to the **proactive model** (were stale at v1.0.1 / "suggest, never execute") — drift surfaced by Skipper Memory's own validation.

---

## [1.3.0] — 2026-05-30

### Added
- **`/skipper:supersede-adr <old> "title"`** — the missing ADR lifecycle operation. ADRs are immutable: instead of editing an Accepted decision, this marks the old one `Superseded by ADR-NNNN` (status only), creates the replacement with `Supersedes ADR-MMMM`, links both bidirectionally, and updates the index. (ADR 0013)
- **`docs-doctor` ADR hygiene** — new `adr_issues` check: `broken-supersede` (link to a nonexistent ADR), `stuck-proposed` (Proposed > 30 days), `missing-status`.

### Changed
- **ADR template aligned to MADR 4.0** (`skills/update/templates/adr.md`): adds the lifecycle vocabulary to Status (`Proposed → Accepted | Rejected → Deprecated | Superseded by ADR-NNNN`), `Decision drivers`, `Confirmation`, and optional `Supersedes`/`Consulted`/`Informed`. Existing ADRs stay valid (superset).
- `new-adr` and the `decisions/` protocol now document the lifecycle and the immutability rule (supersede, don't rewrite).

---

## [1.2.0] — 2026-05-28

### Changed
- **Next.js profiles + specialist upgraded to layered + Container architecture** (ADR 0012), distilled from a mature production Next.js 16 app:
  - `nextjs-supabase` and `nextjs-fullstack` `claude.md.tmpl`/`architecture.md.tmpl` now mandate the layered structure (`app → actions → data → domain → presentation → global`, same as the Expo profile), the **Container Pattern** (Page→Container→pure components), standardized `ServerActionResponse<T>`/`ApiResponse<T>`, a service layer that never throws (type narrowing, no `any`), and a data-fetching decision table (RSC / Server Action / useActionState / useTransition / useOptimistic / Zustand / realtime).
  - `agents/nextjs.md` rewritten with the same laws + enriched anti-patterns (hooks-in-atomics, container placement, `getSession`→`getUser`, `<Link>` vs `router.push`, `any`→narrowing); `paths` updated to the layered folders.
  - Supabase clients moved from `shared/supabase/` to `data/supabase/`.
  - Added `@hookform/resolvers` and `zustand` to both profiles' recommended libs.

---

## [1.1.0] — 2026-05-28

### Added
- **`/skipper:stack-sync`** — diffs `package.json` against the declared `skipper:stack` block and flags drift: `undocumented` (installed but not declared) and `phantom` (declared but not installed). Backed by `lib/stack-sync.sh` with a curated dictionary of opinionated libraries. Read-only by default; offers to update the block on confirmation.
- **`/skipper:docs-doctor`** — health check for `docs/`: detects **stale** docs (code kept moving while the doc didn't, measured in code commits since the doc's last touch), **stub** ADRs/PRDs/plans (unfilled template placeholders vs. merely thin), **broken** intra-doc links, and **empty** folders. Backed by `lib/docs-doctor.sh`. Read-only; routes fixes to `/skipper:update`.
- **`/skipper:init-structure [app|service|library]`** — project-type-aware scaffolding. `service` adds `api/`, `integrations/`, `runbooks/`; `library` adds `api/`, `references/`; `app` keeps the original set (`business/`, `legal/`). READMEs modeled on real-world service docs.
- **Proactive mode (on by default).** Hooks now inject *directives Claude acts on* instead of messages for the user to read manually:
  - `SessionStart` injects the standing "keep docs in sync as you code" directive.
  - `UserPromptSubmit` `hooks/plan-guard.sh`: detects **plan mode** (`permission_mode == "plan"`) and injects the architecture protocol — apply CLAUDE.md laws/layers, search for existing functionality before building (reuse > rebuild), and reference relevant existing docs/ADRs (the hook lists the available `docs/architecture` files and ADRs). Throttled 5 min/session.
  - `PreToolUse` (ExitPlanMode) `hooks/plan-exit-guard.sh`: best-effort checklist before a plan is presented (layer placement, reuse, doc references, ADR flags). No-op if the matcher isn't supported by the running Claude Code build.
  - `PostToolUse` `hooks/stack-watch.sh` (Bash/Edit/Write): on dependency changes (`npm/pnpm/yarn/bun add|install|remove`, or editing `package.json`) reminds Claude to keep the `skipper:stack` block aligned. Only fires when a `skipper:stack` block exists. Throttled 10 min/session.
  - `hooks/docs-sync.sh` is now **subsystem-aware**: it maps the edited path to the matching `docs/architecture/<domain>.md` and points Claude at that exact doc (throttled per subsystem), instead of a generic reminder.
  - `PostToolUse` `hooks/docs-sync.sh` injects `additionalContext` when you edit app code, so Claude updates the matching doc/ADR in the same turn (ignores `docs/`/`*.md`, throttled per session).
  - `Stop` `hooks/suggest.sh` becomes an enforcer: if the turn changed code in a documented area without touching `docs/`, it exits 2 to instruct Claude to sync docs **before yielding** (loop-safe via `stop_hook_active` + 30-min marker; silent if `docs/` was already touched).
  - Opt-out with `SKIPPER_PROACTIVE=off` (falls back to the prior 1×/24h user suggestion).

### Changed
- `hooks/hooks.json`: `Stop` timeout 5→10s; `PostToolUse` now runs `docs-sync.sh` before `specialist-suggest.sh`.
- `.gitignore` covers skipper's own hook scratch files (`.claude/.skipper-*`).

### Why
- Real-world audit of two sibling projects (an Expo app on skipper, a B2B API documented by hand) surfaced two recurring failures: the declared stack froze while `package.json` evolved, and `docs/` drifted out of sync with code (~3.5% of commits touched docs). The hand-built API project also needed `api/`/`integrations/`/`runbooks/` folders skipper didn't offer — hence project types.

---

## [1.0.1] — 2026-04-29

### Changed
- All public docs translated to English: `README.md`, `PRIVACY.md`, `CHANGELOG.md`, `SUBMISSION.md`, marketplace `README.md` and `marketplace.json` description.
- Frontmatter `description` of every skill and agent translated to English (visible in marketplace browser).

### Notes
- Internal system prompts and stack templates remain in Spanish — subagents detect the project language from `CLAUDE.md`/docs and adapt their output accordingly.

---

## [1.0.0] — 2026-04-29

### Added
- **CHANGELOG.md** with complete history since v0.1.
- **`examples/fixtures/`** with mini-projects per stack to validate detection.
- **`lib/test-detect.sh`** runs detector regression against fixtures.
- **`SUBMISSION.md`** with guide for submitting to the official Anthropic marketplace.
- **Redesigned README** with "Why skipper" section + 30-second demo + screenshots.

### Notes
- The **1.0.0** mark indicates a stable feature set ready for public distribution.
- API/skills/agents are backwards compatible with v0.4–v0.6.
- Future iterations (v1.x) will mostly be fixes and additional stacks based on real usage feedback.

---

## [0.6.0] — 2026-04-29

### Added
- **Composable layers** in `stacks/_layers/`: `tailwind`, `shadcn-ui`, `tanstack-query`, `zustand`, `zod`, `nativewind`. Each layer ships its own rules and anti-patterns as a fragment that gets inserted into CLAUDE.md.
- **`/skipper:stack-add <layer>`** adds a layer to CLAUDE.md without touching the stack block or other layers (idempotent via HTML markers).
- **`/skipper:stack-doctor`** validates that the code follows the laws declared in CLAUDE.md. Delegates to the `architect` subagent in context fork. Reports a violations table by severity (high/medium/low). Read-only.
- **`SessionStart` hook** with a banner showing active stack, present layers, doc count and age of the last update.

### Changed
- README documents all 3 hooks (`SessionStart`, `Stop`, `PostToolUse`).

---

## [0.5.0] — 2026-04-29

### Added
- **`PostToolUse` hook** that accumulates edited paths (Edit/Write) and suggests a specialist when ≥3 files of the same domain are edited within a 30-min window. Throttle: one suggestion per agent per session.
- **`paths:` glob** in stack-agent frontmatter (`react-vite`, `react-native`, `nextjs`, `node-backend`, `supabase`) — declarative, read by the PostToolUse hook for matching.
- **`/skipper:lib-lookup "query"`** — wrapper over WebSearch + WebFetch scoped to official docs per stack (react.dev, nextjs.org, docs.expo.dev, fastify.dev, etc.). Summarizes with the stack specialist's judgment.

---

## [0.4.0] — 2026-04-29

### Added
- **`skipper` subagent** (NEW role): captain/router. Reads context (CLAUDE.md, diff, user intent) and decides which specialist to invoke. No Write access — read-only.
- **Madagascar universe** documented in README: skipper (captain), kowalski (analyst), rico/private (reserved future), technical specialists separated from the metaphor.

### Changed
- **Docs subagent `skipper` → `kowalski`**: the subagent that analyzes diffs and proposes docs is now called Kowalski. The culturally iconic phrase "Kowalski, analysis" matches its role.
- **Router skills now delegate to the skipper subagent**: `/skipper:ask` and `/skipper:review` run in `context: fork` with `agent: skipper`. Previously routed in the main chat.
- **`/skipper:update` skill** now delegates to `kowalski` (previously `skipper`).
- **Marketplace**: repo renamed from `c-donnachie/skipper-marketplace` → `c-donnachie/madagascar`. GitHub keeps a redirect for the old name. `marketplace.json` now uses `name: "madagascar"` (was `name: "c-donnachie"`).

### Notes
- User-facing slash commands remain **identical** (`/skipper:xxx`) — zero breaking changes.
- Existing users: `/plugin update skipper` pulls v0.4 without reinstalling.

---

## [0.3.0] — 2026-04-28

### Added
- **7 specialist subagents** that can refactor/write code in `context: fork`:
  - `architect` — structure, layers, dependencies, boundaries (cross-cutting).
  - `solid-coach` — Clean Code, SOLID, refactor of functions/classes (cross-cutting).
  - `react-vite` — React + Vite, features-first, TanStack Query, Zustand.
  - `react-native` — RN + Expo, data/domain/presentation layers, NativeWind.
  - `nextjs` — App Router, RSC, Server Actions, revalidateTag.
  - `node-backend` — Fastify + Zod + Drizzle, strict layers.
  - `supabase` — RLS, auth flow, migrations, Realtime.
- **7 wrapper skills**, one per agent: `/skipper:{architect, solid-coach, react-vite, react-native, nextjs, node-backend, supabase}`.
- **3 smart router skills**:
  - `/skipper:ask "..."` — routes to the right specialist by paths + intent + stack.
  - `/skipper:refactor <file>` — always delegates to solid-coach with context fork.
  - `/skipper:review` — the stack specialist reviews the current diff.

---

## [0.2.0] — 2026-04-28

### Added
- **`lib/detect.sh`** — 3-layer stack detector (marker files, deps, structure). Supports 8 stacks.
- **`/skipper:scan`** — runs the detector and reports candidate + confidence, no writes.
- **`/skipper:stack-apply <id>`** — applies the stack's opinionated profile. Generates/updates the `<!-- skipper:stack -->` section in CLAUDE.md (idempotent via HTML markers) and creates `docs/architecture/stack.md`.
- **8 stack profiles** in `stacks/<id>/`:
  - `react-vite-supabase`, `react-vite-node`
  - `nextjs-fullstack`, `nextjs-supabase`
  - `expo-supabase`, `expo-node`
  - `node-api` (Fastify + Zod)
  - `python-fastapi` (Pydantic + SQLAlchemy)
- Each profile includes `profile.json` (metadata + detection) + `claude.md.tmpl` (strongly opinionated CLAUDE.md) + `architecture.md.tmpl` (detailed doc).
- **`/skipper:init-structure`** now invokes the detector and proposes `stack-apply` after creating the `docs/` structure.

### Notes
- Decision: stacks as **monolithic profiles** in v0.2. Composable layers arrive in v0.6.

---

## [0.1.1] — 2026-04-28

### Changed
- The `/skipper:update` skill now runs in an isolated subagent (`context: fork`, `agent: skipper`). Analysis no longer pollutes the main conversation — only the final report comes back. The subagent is conservative: when in doubt, don't write.

---

## [0.1.0] — 2026-04-28

### Added
- Initial release. "doc-keeper" plugin for Claude Code.
- **5 skills**:
  - `/skipper:init-structure` — creates `docs/{architecture, business, decisions, prds, plans, legal}` tree with protocol READMEs.
  - `/skipper:update` — analyzes git diff and proposes docs (ADR/PRD/plan/architecture/business). Delegated to skipper subagent.
  - `/skipper:new-adr "title"` — creates a numbered ADR with standard template.
  - `/skipper:new-prd "title"` — creates a numbered PRD.
  - `/skipper:new-plan "title"` — creates a numbered implementation plan.
- **1 subagent**: `skipper` (docs analyst, conservative).
- **1 `Stop` hook** with `suggest.sh` that suggests `/skipper:update` 1×/24h after code changes (`src/`, `app/`, `lib/`, `packages/`).
- **5 doc templates** in `skills/update/templates/`: `adr.md`, `prd.md`, `plan.md`, `architecture.md`, `business.md`. They substitute `{{NUMBER}}`, `{{TITLE}}`, `{{DATE}}`, `{{AUTHOR}}`.
- 4-digit sequential numbering for ADR/PRD/plan.

[1.0.1]: https://github.com/c-donnachie/skipper/releases/tag/v1.0.1
[1.0.0]: https://github.com/c-donnachie/skipper/releases/tag/v1.0.0
[0.6.0]: https://github.com/c-donnachie/skipper/releases/tag/v0.6.0
[0.5.0]: https://github.com/c-donnachie/skipper/releases/tag/v0.5.0
[0.4.0]: https://github.com/c-donnachie/skipper/releases/tag/v0.4.0
[0.3.0]: https://github.com/c-donnachie/skipper/releases/tag/v0.3.0
[0.2.0]: https://github.com/c-donnachie/skipper/releases/tag/v0.2.0
[0.1.1]: https://github.com/c-donnachie/skipper/releases/tag/v0.1.1
[0.1.0]: https://github.com/c-donnachie/skipper/releases/tag/v0.1.0
