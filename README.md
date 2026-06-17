# 🐧 skipper

> *"Kowalski, status report."* — Skipper

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Marketplace: madagascar](https://img.shields.io/badge/marketplace-madagascar-blue)](https://github.com/c-donnachie/madagascar)
[![Version](https://img.shields.io/badge/version-1.4.0-green)](./CHANGELOG.md)

**English** · [Español](./README.es.md)

**A Claude Code framework that scaffolds, documents, maintains — and now *remembers* — your project, following Clean Code and SOLID principles.**

skipper makes Claude understand *your* project — its stack, its layers, its decisions — and keeps the living docs in sync **on its own** while you code. Detects your stack, generates an opinionated CLAUDE.md, ships specialist sub-agents that refactor with stack-aware judgment, and proactively keeps ADRs/PRDs/architecture from rotting.

> Other plugins give you templates. skipper gives you a crew member that knows the ship, enforces the rules, and keeps the logbook up to date — so you just sail.

## 🧠 Skipper Memory — *new in v1.4*

Skipper now **remembers**. The ADRs/PRDs/decisions it keeps stop being a pile of markdown and become a **queryable, cited, drift-aware memory** — for you *and* your agents.

```bash
skipper ask "why are the hooks proactive?"   # cited, LLM-synthesized answer over your decisions
skipper context hooks/                        # the ADRs governing a path + invariants + freshness
skipper relate ADR-0001 ADR-0014              # how two decisions connect (direct / via a hub)
```

- **For agents** — a `skipper-memory` **MCP server** lets a Conductor agent call `context_for(path)` **before editing**, so it follows the settled decisions instead of repeating mistakes. *Conductor executes, Skipper knows.*
- **Proactive** — `memory-guard` injects the governing ADRs the moment you edit a path; `memory-stop` blocks the turn (`exit 2`) if governed code changed without verifying compliance.
- **Drift-aware** — flags when a doc has gone stale vs the code (version + git-delta), surfaces *who decided* and *what touched* a subsystem, and catches count conflicts.
- **Honest** — every citation is self-verified against the source, and a 19-check gold gate runs in CI.

Opt-in OSS engine (Node + built-in `node:sqlite`, **zero deps**) under [`engine/`](./engine/) — a separate package, reached via MCP, so the plugin stays zero-install ([ADR-0017](./docs/decisions/0017-memory-engine-separate-opt-in-package.md)). See [`engine/README.md`](./engine/README.md).

---

## Why skipper

### The problem

When you start a new project in Claude Code:

- You paste the same Cursor/CLAUDE.md rules over and over.
- You fight with Claude because "it doesn't follow the architecture" — but you never told it which one.
- Technical decisions (why Supabase and not Firebase?) live in a Slack thread no one reads anymore.
- You end up installing 5 separate plugins: one for ADRs, one for boilerplate, one for review, one for rules, one for…

### The solution

**A single plugin** that knows 8 common stacks (React Vite, Next.js, Expo, Node API, Python FastAPI, all with/without Supabase) and:

1. **Detects** your stack with `/skipper:scan`.
2. **Applies** an opinionated CLAUDE.md (mandatory structure, naming, libs, anti-patterns).
3. **Keeps living docs** — ADRs/PRDs/plans with templates and automatic numbering.
4. **Ships specialists** — `/skipper:react-vite`, `/skipper:nextjs`, `/skipper:supabase`, etc. that refactor while respecting the project's laws.
5. **Acts proactively** — after initial setup you don't run commands. Hooks inject directives Claude follows: in **plan mode** it plans within your architecture (applies the laws, reuses existing code, references your docs), and as you code it keeps docs and the stack block in sync — syncing before it hands control back. All loop-safe, throttled, and opt-out (`SKIPPER_PROACTIVE=off`).

---

## 30-second demo

```bash
# Install
/plugin marketplace add c-donnachie/madagascar
/plugin install skipper@madagascar
/reload-plugins

# In your project:
/skipper:init-structure       # 🐧 detect stack + scaffold docs/
/skipper:scan                 # 🐧 what stack do I have?
/skipper:stack-apply expo-supabase   # 🐧 apply opinionated CLAUDE.md

# Working:
/skipper:ask "is this component well organized?"     # captain routes
/skipper:react-native "extract this hook to domain/"  # specialist refactors
/skipper:update                                       # kowalski updates docs

# Validate before PR:
/skipper:stack-doctor          # table of CLAUDE.md violations
/skipper:review                # specialist reviews the diff
```

<!-- TODO screenshot: SessionStart banner showing stack + layers + docs -->
<!-- TODO screenshot: /skipper:scan output with high confidence -->
<!-- TODO screenshot: stack-doctor table with violations by severity -->
<!-- TODO gif: a /skipper:ask session routing to the specialist -->

---

## Installation

### Option A: via madagascar marketplace (recommended)

```
/plugin marketplace add c-donnachie/madagascar
/plugin install skipper@madagascar
/reload-plugins
```

### Option B: load from local directory (dev/test)

```bash
cd /path/to/your/project
claude --plugin-dir /path/to/skipper
```

---

## Commands

### Bootstrap (skipper coordinates init)

| Command | What it does |
|---|---|
| `/skipper:scan` | Detects the project stack. Doesn't write. |
| `/skipper:stack-apply <id>` | Applies opinionated profile: CLAUDE.md + docs/architecture/stack.md. |
| `/skipper:stack-add <layer>` | Adds a layer (tailwind, shadcn-ui, tanstack-query, etc.). |
| `/skipper:init-structure [app\|service\|library]` | Creates `docs/` for the project type + invokes scan + suggests stack-apply. |

### Documentation (kowalski analyzes)

| Command | What it does |
|---|---|
| `/skipper:update` | Reads diff and proposes ADRs/PRDs/architecture/business docs. |
| `/skipper:new-adr "title"` | Creates numbered ADR (MADR-aligned template). |
| `/skipper:supersede-adr N "title"` | Supersedes ADR N with a new one — marks the old `Superseded by`, links both (ADRs are immutable). |
| `/skipper:new-prd "title"` | Creates numbered PRD. |
| `/skipper:new-plan "title"` | Creates implementation plan. |

### Specialists (technical experts)

| Command | Specialist |
|---|---|
| `/skipper:architect` | Structure, layers, dependencies |
| `/skipper:solid-coach` | Clean Code, SOLID |
| `/skipper:react-vite` | React + Vite (features-first, TanStack Query) |
| `/skipper:react-native` | RN + Expo (data/domain/presentation layers) |
| `/skipper:nextjs` | Next.js (RSC, Server Actions) |
| `/skipper:node-backend` | Node API (Fastify + Zod + Drizzle) |
| `/skipper:supabase` | RLS, auth, migrations, Realtime |

### Smart routers (skipper routes)

| Command | What it does |
|---|---|
| `/skipper:ask "free question"` | Skipper picks the right specialist for you. |
| `/skipper:refactor <file>` | SOLID refactor with solid-coach. |
| `/skipper:review` | Stack specialist reviews diff vs origin/main. |
| `/skipper:lib-lookup "query"` | WebSearch scoped to official docs of your stack. |

### Validation

| Command | What it does |
|---|---|
| `/skipper:stack-doctor` | Table of CLAUDE.md violations by severity. |
| `/skipper:stack-sync` | Diffs `package.json` vs the declared stack — flags undocumented and phantom (declared-but-uninstalled) libraries. |
| `/skipper:docs-doctor` | Health check of `docs/` — stale docs (code moved, doc didn't), stub ADRs/PRDs, broken links, empty folders. |

---

## Supported stacks

| ID | Frontend | Backend |
|---|---|---|
| `react-vite-supabase` | React + Vite | Supabase |
| `react-vite-node` | React + Vite | Node API |
| `nextjs-fullstack` | Next.js App Router | Server Actions + Drizzle |
| `nextjs-supabase` | Next.js | Supabase SSR |
| `expo-supabase` | RN + Expo | Supabase |
| `expo-node` | RN + Expo | Node API |
| `node-api` | (no frontend) | Fastify + Zod + Drizzle |
| `python-fastapi` | (no frontend) | FastAPI + Pydantic + SQLAlchemy |

Each stack ships an **opinionated CLAUDE.md**: mandatory folder structure, naming, recommended libs, validatable SOLID rules, and explicit anti-patterns.

---

## Composable layers

Add on top of any compatible stack with `/skipper:stack-add <layer>`:

- `tailwind` — Tailwind CSS (web)
- `shadcn-ui` — shadcn/ui (requires tailwind)
- `tanstack-query` — TanStack Query (web + mobile)
- `zustand` — Zustand stores
- `zod` — Boundary validation
- `nativewind` — Tailwind for RN (Expo only)

---

## The Madagascar universe

skipper lives in the [madagascar marketplace](https://github.com/c-donnachie/madagascar). Internally it coordinates several "penguins" as specialized subagents:

| Penguin | Role | Status |
|---|---|---|
| 🐧 **Skipper** | Captain/router. Reads context and routes. | v0.4+ |
| 🐧 **Kowalski** | Analyst. Reads diff and proposes documentation. | v0.4+ |
| 🐧 Rico | Demolition / aggressive refactor. | Reserved v1.x |
| 🐧 Private | Apprentice / tutorials / web lookups. | Reserved future |

Aside from penguins, there are **technical specialists** (not penguins, the contracted experts):

🛠 `architect`, `solid-coach`, `react-vite`, `react-native`, `nextjs`, `node-backend`, `supabase`.

---

## Components

- **23 skills** (bootstrap, docs, specialists, routers, validation, lib-lookup) — incl. `stack-sync` + `docs-doctor` health checks, `supersede-adr`
- **9 subagents** (skipper, kowalski + 7 technicals)
- **8 stack profiles** + **6 composable layers**
- **5 hook events / 9 scripts** (proactive by default — see below):
  - `SessionStart` → banner + injects the standing "keep docs in sync" directive into Claude's context
  - `UserPromptSubmit` → `plan-guard`: in **plan mode**, injects the architecture protocol so every plan applies CLAUDE.md laws, reuses existing code, and references existing docs/ADRs
  - `PreToolUse` (ExitPlanMode) → `plan-exit-guard`: best-effort checklist before a plan is presented (no-op if the matcher isn't supported)
  - `PostToolUse` (Edit/Write) → `docs-sync` points Claude at the **specific** `docs/architecture` doc for the subsystem you edited; `specialist-suggest` nudges you toward a specialist after ≥3 files of one domain; (Bash/Edit/Write) → `stack-watch` reminds to keep the `skipper:stack` block in sync when dependencies change
  - `Stop` → if the turn changed code in a documented area without touching `docs/`, instructs Claude to sync docs **before yielding** (loop-safe, 30-min throttle)
  - **Memory (v1.4, opt-in)** → `memory-guard` (PostToolUse) injects the ADRs governing the edited path; `memory-stop` (Stop) blocks (`exit 2`) if governed code changed without verifying compliance — both no-op without the engine
- **🧠 Skipper Memory engine** (`engine/`, opt-in) — a queryable, cited graph of your decisions + a `skipper-memory` MCP server + a 19-check gold gate (see the [Skipper Memory](#-skipper-memory--new-in-v14) section).

Token cost: ~355 tokens in descriptions (≈0.18% of your context window).

### Proactive mode

After initial setup you shouldn't have to run commands. skipper's hooks inject **directives Claude acts on** (via `additionalContext` and `Stop` continuation) — not just messages for you to read. So as you code, Claude keeps `docs/` and the stack block in sync on its own, and **when you enter plan mode it plans within your architecture** — applying the declared layers/laws, checking whether the feature already exists before building it, and referencing the relevant existing docs.

- **On by default.** Disable per project (or globally) by setting `SKIPPER_PROACTIVE=off` in your environment / `settings.json` `env`.
- **Loop-safe & quiet.** Edits to `docs/`/`*.md` never trigger it; the `Stop` enforcer fires at most once per 30 min and stays silent if you already touched `docs/`.
- **Conservative.** It never documents trivial changes, and the `Stop` directive lets Claude say "nothing to document" and finish.

---

## Built on Claude Code Plugins

For the technical reference of how plugins, hooks, skills, and subagents work in Claude Code, see the [official docs](https://code.claude.com/docs/en/plugins).

---

## Philosophy

- **skipper is the harness, not a template factory.** It generates the bare minimum needed for Claude to understand your stack — it doesn't flood the repo with boilerplate.
- **Conservatism.** Throttled hooks, subagents in `context: fork`, HTML markers for idempotency. When in doubt, don't write.
- **Conventions, not hard rules.** The generated CLAUDE.md guides Claude but doesn't block — for hard validation, use `/skipper:stack-doctor`.

---

## Roadmap

- ✅ **v1.4** — 🧠 **Skipper Memory**: queryable cited memory (`ask`/`context`/`relate`), proactive memory hooks, an MCP server for agents, and a gold regression gate.
- ✅ **v1.0** — Submission to Anthropic's official marketplace.
- 🔜 **v1.1+** — More stacks (Astro, SvelteKit, Tauri, Remix) based on real demand.
- 🔜 **optional add-ons** — `private` (onboarding tutorials), `rico` (automated aggressive refactor).

See [CHANGELOG.md](./CHANGELOG.md) for full history.

---

## Contributing

Bug reports and feedback: https://github.com/c-donnachie/skipper/issues

---

## License

MIT
