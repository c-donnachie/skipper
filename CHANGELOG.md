# Changelog

All notable changes to skipper. Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
