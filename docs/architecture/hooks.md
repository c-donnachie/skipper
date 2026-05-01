# Hooks lifecycle

> Last updated: 2026-04-30. Reflects v1.0.1.

## Three hooks, three jobs

| Event | Script | Job | Throttle |
|---|---|---|---|
| `SessionStart` | `session-start.sh` | Print banner with stack/layers/docs status | One per session (one banner per Claude Code launch) |
| `Stop` | `suggest.sh` | Suggest `/skipper:update` after code changes | 1×/24h per project |
| `PostToolUse` (Edit\|Write) | `specialist-suggest.sh` | Suggest specialist when ≥3 files of same domain edited | 1× per agent per session, 30min window |

## SessionStart (`session-start.sh`)

Fires when Claude Code opens. Silent unless the project has a CLAUDE.md with skipper:stack section applied.

Output:
```
╭─ 🐧 skipper ──────────────────────────────────────────╮
│ Stack:  React Native Expo + Supabase
│ Layers: tanstack-query zustand zod
│ Docs:   4 ADR · 1 PRD · 0 plan · update up to date
╰───────────────────────────────────────────────────────╯
```

Reads:
- `CLAUDE.md` (looks for `<!-- skipper:stack -->` to extract stack name)
- `<!-- skipper:layer:* -->` markers (lists active layers)
- `docs/decisions/*.md`, `docs/prds/*.md`, `docs/plans/*.md` (counts files matching `^[0-9]{4}-`)
- `.claude/.skipper-last` mtime (decides "up to date" or "N days ago")

## Stop (`suggest.sh`)

Fires at the end of every Claude Code turn. Suggests `/skipper:update` if:
- The repo has uncommitted/unpushed changes touching `src/`, `app/`, `lib/`, or `packages/.+/(src|lib)/`
- More than 24 hours have passed since the last suggestion (tracked via `.claude/.skipper-last` mtime)

Output:
```
🐧 skipper reportándose: detecté cambios en código fuente desde el último update.
   Capitán, considera correr /skipper:update para revisar si hay ADRs, PRDs o docs de business que actualizar.
```

(Note: this output is in Spanish because it predates the v1.0.1 i18n work. Consider translating in v1.1.)

## PostToolUse (`specialist-suggest.sh`)

Fires after every Edit or Write tool call. Accumulates state across the session:

```
.claude/.skipper-session     # timestamp|path entries (rolling 30min window)
.claude/.skipper-suggested   # one line per agent already suggested in this session
```

For each Edit/Write:
1. Append `<timestamp>|<file_path>` to `.skipper-session`
2. Drop entries older than 30 minutes
3. For each stack-agent (read frontmatter `paths:` from `agents/<name>.md`):
   - Match `.skipper-session` paths against each glob
   - Count matches
4. If any agent reaches ≥3 matches AND wasn't already suggested in this session:
   - Print suggestion
   - Append agent name to `.skipper-suggested`

Output:
```
🐧 Skipper detectó 3 archivos editados que tocan el dominio del especialista `react-vite`.
   Considera invocar:  /skipper:react-vite "<tu pregunta>"
   O usar el router:    /skipper:ask "<pregunta libre>"
```

## Why hooks can't invoke skills directly

Claude Code hooks are executed by the **harness** (the runtime), not by Claude. They can:
- Run shell commands and print to stderr/stdout
- Block actions (exit code 2)
- Inject context into the next turn

They **can't** programmatically invoke a slash command or a subagent. This is a deliberate Claude Code design — keeps the agent in charge of action selection.

That's why all skipper hooks **suggest**, never **execute**. The user (or Claude reading the suggestion) decides to run the recommended command.

## Why throttling matters

Without throttle:
- `Stop` would suggest `/skipper:update` after every turn — annoying
- `PostToolUse` would suggest the specialist after every single Edit — useless noise

The current throttles balance helpfulness vs noise:
- `Stop` 1×/24h = once per work session, max
- `PostToolUse` 1× per agent per session = won't repeat for the same domain
- Window of 30 min for accumulation = handles bursts of edits without forgetting context

## State files (cleanup notes)

`.claude/.skipper-*` files:
- Live in the project's `.claude/` directory (created if missing)
- Are session-scoped — safe to delete between sessions
- Should be gitignored (skipper doesn't add this to .gitignore automatically; the user is responsible)

Future v1.x: consider adding `.claude/.skipper-*` to a `.gitignore` template applied during `init-structure`.
