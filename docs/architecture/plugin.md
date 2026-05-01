# Plugin architecture

> Last updated: 2026-04-30. Reflects v1.0.1.

## Summary

skipper is a Claude Code plugin packaged as a single repo (`c-donnachie/skipper`) and distributed via the `c-donnachie/madagascar` marketplace. It bundles **skills, subagents, hooks, stack profiles, composable layers and library scripts** into one installable unit.

## Top-level layout

```
skipper/
├── .claude-plugin/
│   └── plugin.json              # manifest (name, version, description, keywords)
├── README.md                    # public docs (Why, demo, commands)
├── CHANGELOG.md                 # release history (Keep a Changelog)
├── PRIVACY.md                   # privacy policy (no data collection)
├── SUBMISSION.md                # marketplace submission guide
├── LICENSE                      # MIT
├── skills/<name>/SKILL.md       # 17 skills, namespaced as /skipper:<name>
├── agents/<name>.md             # 9 subagents (skipper, kowalski, 7 technicals)
├── hooks/
│   ├── hooks.json               # event registry (SessionStart, Stop, PostToolUse)
│   ├── suggest.sh               # Stop hook — suggests /skipper:update
│   ├── specialist-suggest.sh    # PostToolUse hook — suggests specialist
│   └── session-start.sh         # SessionStart hook — banner
├── lib/
│   ├── detect.sh                # 3-layer stack detector
│   └── test-detect.sh           # regression tests
├── stacks/<id>/                 # 8 monolithic stack profiles
│   ├── profile.json
│   ├── claude.md.tmpl
│   └── architecture.md.tmpl
├── stacks/_layers/<id>/         # 6 composable layers
│   ├── layer.json
│   └── fragment.md
├── examples/
│   ├── README.md
│   └── fixtures/<stack-id>/     # 8 mini-projects per stack (for tests)
└── docs/                        # this folder — internal docs (eating our own dog food)
```

## Conceptual layers (top-down)

```
┌───────────────────────────────────────────────────────────────┐
│  USER FACING                                                   │
│  Slash commands (/skipper:scan, /skipper:react-vite, etc.)     │
├───────────────────────────────────────────────────────────────┤
│  SKILLS  (17 .md files)                                        │
│  - Bootstrap: scan, stack-apply, stack-add, init-structure     │
│  - Docs:      update, new-adr/prd/plan                         │
│  - Specialists wrappers: architect, solid-coach, react-vite,   │
│                          react-native, nextjs, node-backend,  │
│                          supabase                              │
│  - Routers:   ask, refactor, review, lib-lookup                │
│  - Validation: stack-doctor                                    │
├───────────────────────────────────────────────────────────────┤
│  SUBAGENTS  (9 .md files, run in context: fork)                │
│  - Penguins:  skipper (router), kowalski (docs analyst)        │
│  - Cross:     architect, solid-coach                           │
│  - Stack:     react-vite, react-native, nextjs, node-backend,  │
│               supabase                                         │
├───────────────────────────────────────────────────────────────┤
│  DATA  (filesystem-backed)                                     │
│  - stacks/<id>/        — monolithic profiles per stack         │
│  - stacks/_layers/<id>/ — composable layers                    │
│  - skills/update/templates/ — doc templates (ADR, PRD, etc.)   │
├───────────────────────────────────────────────────────────────┤
│  AUTOMATION  (hooks)                                           │
│  - SessionStart  → banner with stack/layers/docs status        │
│  - Stop          → suggests /skipper:update (1×/24h)           │
│  - PostToolUse   → suggests specialist (≥3 files, 30min)       │
├───────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE                                                │
│  - lib/detect.sh — pure bash, no deps, returns JSON            │
│  - lib/test-detect.sh — regression suite (8/8 fixtures)        │
└───────────────────────────────────────────────────────────────┘
```

## Data flow examples

### A) `/skipper:init-structure` (bootstrap)

```
user → slash command
  → skill init-structure (main chat)
  → bash mkdir -p docs/{architecture,business,decisions,prds,plans,legal}
  → write README.md per folder
  → invoke lib/detect.sh
  → if high confidence + not ambiguous: suggest /skipper:stack-apply <id>
```

### B) `/skipper:update` (docs sync)

```
user → slash command
  → skill update (delegates via context: fork to agent kowalski)
  → kowalski reads git diff, CLAUDE.md, docs/ structure
  → kowalski classifies changes (ADR / PRD / plan / architecture / business / skip)
  → kowalski writes new docs from templates (skills/update/templates/)
  → kowalski returns summary table to main chat
```

### C) `/skipper:ask "is this structure ok?"` (routing)

```
user → slash command with question
  → skill ask (delegates via context: fork to agent skipper)
  → skipper reads CLAUDE.md, git diff, paths, intent keywords
  → skipper applies routing priority: intent > paths > stack
  → skipper returns recommendation: "run /skipper:architect ..."
  → user runs the suggested command (which delegates to that specialist)
```

### D) PostToolUse hook (proactive suggestion)

```
Claude edits src/features/auth/login.tsx
  → harness fires PostToolUse hook
  → specialist-suggest.sh accumulates path in .claude/.skipper-session
  → after ≥3 files matching agent paths: glob within 30 min:
     → prints "consider /skipper:react-vite ..."
  → throttle: marks agent in .claude/.skipper-suggested (1×/session)
```

## Communication boundaries

- **Skills ↔ subagents**: through `context: fork` + `agent: <name>` in skill frontmatter. Skill body becomes the subagent's task.
- **Subagents ↔ filesystem**: via Read/Write/Edit tools (each agent declares allowed tools).
- **Hooks ↔ skills**: hooks NEVER invoke skills directly (Claude Code limitation). Hooks print suggestions; user runs the slash command.
- **Stacks ↔ CLAUDE.md**: idempotent via HTML markers (`<!-- skipper:stack -->`, `<!-- skipper:layer:<id> -->`). Multiple `apply` calls don't duplicate.

## Distribution

```
GitHub
├── c-donnachie/skipper           (the plugin, public, MIT, semver)
└── c-donnachie/madagascar        (the marketplace, public, lists skipper)

Anthropic official marketplace
└── (pending submission, see docs/plans/0002-anthropic-submission.md)
```

## Token budget

- Skills descriptions: ~28-73 tokens each, 17 skills → **~600 tokens** in context
- Agents descriptions: ~30-60 tokens each, 9 agents → **~400 tokens** in context (only for Skill tool listing)
- Total in-context cost when plugin is enabled: **~0.18% of a 200k window**
