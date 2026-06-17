# Hooks lifecycle

> Last updated: 2026-06-17. Reflects v1.4.0.

Since v1.1 skipper's hooks are **proactive**: they don't just message the user, they **inject directives Claude acts on** (`hookSpecificOutput.additionalContext`) and, at `Stop`, **enforce** with `exit 2`. Rationale and design in **ADR-0009** (proactive model), **ADR-0010** (plan-mode guard), **ADR-0011** (dependency + subsystem-aware hooks). All proactive hooks are opt-out via `SKIPPER_PROACTIVE=off`. Two hooks marked **⊕** are *engine-dependent*: they bridge to the separately-installed skipper-memory engine (**ADR-0017/0018**) and no-op without it.

## Five events, nine scripts

| Event | Script | Job | Throttle |
|---|---|---|---|
| `SessionStart` | `session-start.sh` | Banner (stack/layers/docs) **+ inject the standing "keep docs in sync" directive** | 1× per session |
| `UserPromptSubmit` | `plan-guard.sh` | In **plan mode** (`permission_mode == plan`), inject the architecture protocol so plans apply CLAUDE.md laws, reuse code, reference docs | 5 min (`.skipper-planguard`) |
| `PreToolUse` (ExitPlanMode) | `plan-exit-guard.sh` | Best-effort checklist before a plan is presented (no-op if the matcher isn't supported) | per event |
| `PostToolUse` (Edit\|Write) | `docs-sync.sh` | **Subsystem-aware**: point Claude at the *specific* `docs/architecture` doc for the edited subsystem and tell it to update it **this turn** | 10 min per subsystem (`.skipper-docsync-<slug>`) |
| `PostToolUse` (Edit\|Write) | `specialist-suggest.sh` | Suggest a specialist after ≥3 files of one domain (this one **suggests the user** — the exception) | 1× per agent per session, 30-min window |
| `PostToolUse` (Edit\|Write) | `memory-guard.sh` **⊕** | Inject the ADRs **governing** the edited path (+ drift) via the memory engine — proactive *push* of project memory | 10 min per subsystem (`.skipper-memory-<sub>`) |
| `PostToolUse` (Bash\|Edit\|Write\|MultiEdit) | `stack-watch.sh` | On dependency changes, remind to keep the `skipper:stack` block in sync | 10 min (`.skipper-stackwatch`) |
| `Stop` | `suggest.sh` | **Enforcer**: if code changed in a documented area without touching `docs/`, `exit 2` with a directive so Claude syncs **before yielding** | 30-min block (`.skipper-stop-block`) + 24h marker (`.skipper-last`) |
| `Stop` | `memory-stop.sh` **⊕** | **Enforcer**: if **governed** code changed, `exit 2` with the governing ADRs so Claude self-verifies compliance (fix, or supersede) before yielding | 30-min block (`.skipper-memory-stop`) |

## SessionStart (`session-start.sh`)

Fires when Claude Code opens; silent unless the project has a CLAUDE.md with the `skipper:stack` section. Prints the banner **and** injects the standing directive that Claude keeps `docs/` and the stack block in sync as it works.

Reads: `CLAUDE.md` (`<!-- skipper:stack -->`, `<!-- skipper:layer:* -->`), `docs/{decisions,prds,plans}/*.md` (counts `^[0-9]{4}-`), and `.claude/.skipper-last` mtime (for "up to date" / "N days ago").

```
╭─ 🐧 skipper ──────────────────────────────────────────╮
│ Stack:  React Native Expo + Supabase
│ Layers: tanstack-query zustand zod
│ Docs:   4 ADR · 1 PRD · 0 plan · update up to date
╰───────────────────────────────────────────────────────╯
```

## UserPromptSubmit (`plan-guard.sh`) — ADR-0010

When `permission_mode == "plan"`, injects the architecture protocol as `additionalContext` **before** Claude investigates, so every plan applies the declared layers/laws, checks whether the feature already exists, and references the relevant existing docs/ADRs. Throttled 5 min. No-op outside plan mode.

## PreToolUse / ExitPlanMode (`plan-exit-guard.sh`)

Best-effort checklist injected just before a plan is presented. If the `ExitPlanMode` matcher isn't supported by the runtime, it's a silent no-op (the primary plan-mode behavior lives in `plan-guard.sh`).

## PostToolUse — Edit|Write

- **`docs-sync.sh`** (ADR-0011): maps the edited path to its subsystem doc under `docs/architecture/` (≥4-char keyword match) and injects `additionalContext` telling Claude — *without asking the user* — to update that specific doc in the same turn. Throttled 10 min per subsystem so a burst of edits doesn't re-fire. Ignores edits to `docs/`/`*.md` to stay loop-safe.
- **`specialist-suggest.sh`**: the one hook that still **suggests the user** (it nudges, doesn't enforce). Accumulates `<timestamp>|<path>` in `.claude/.skipper-session` (rolling 30-min window); when any stack-agent's `paths:` globs match ≥3 files and it wasn't already suggested this session, prints the specialist suggestion and records it in `.skipper-suggested`.

## PostToolUse — Bash|Edit|Write|MultiEdit (`stack-watch.sh`) — ADR-0011

Catches stack drift at its source: when a dependency change is detected, injects `additionalContext` reminding Claude to keep the `skipper:stack` block in CLAUDE.md in sync. Throttled 10 min. The wider matcher (incl. `Bash`/`MultiEdit`) is so it also fires on `npm install`-style commands.

## Stop (`suggest.sh`) — the enforcer, ADR-0009

Fires at the end of a turn. If the turn changed code in a documented area without touching `docs/`, it does **`exit 2`** — whose stderr is fed back to Claude as a directive — so Claude syncs docs **before yielding control**. It does **not** ask the user; Claude acts.

Loop-safe (mandatory, ADR-0009): honors `stop_hook_active`, ignores edits to `docs/`/`*.md`, blocks at most once per **30 min** (`.skipper-stop-block`), and stays silent if `docs/` was already touched this turn. A separate 24h marker (`.skipper-last`) backs the lighter historical "consider `/skipper:update`" path.

## Why hooks can't invoke skills directly

Claude Code hooks are executed by the **harness** (the runtime), not by Claude. They can run shell, block actions (`exit 2`), and inject context — but they **can't** programmatically invoke a slash command or subagent. That's a deliberate design: the agent stays in charge of action selection.

So the v1.1 lever for proactivity was **not** "make hooks run skills" (impossible) but: *stop only messaging the user, start injecting directives Claude obeys.* Hooks inject `additionalContext` (SessionStart / UserPromptSubmit / PostToolUse) or use the `Stop` `exit 2` enforcer — Claude reads these and acts. (`specialist-suggest.sh` is the deliberate exception: a soft user-facing suggestion, since picking a specialist is the user's call.)

## Why throttling matters

Without throttles the `Stop` enforcer would fire every turn and `PostToolUse` after every edit — noise. The markers under `.claude/.skipper-*` balance helpfulness vs noise: Stop 30 min, docs-sync 10 min/subsystem, stack-watch 10 min, plan-guard 5 min, specialist-suggest 1×/agent/session (30-min accumulation window).

## Opt-out

Set `SKIPPER_PROACTIVE=off` (environment or `settings.json` `env`) to disable the proactive hooks (`session-start`, `plan-guard`, `plan-exit-guard`, `docs-sync`, `stack-watch`, `suggest`). `specialist-suggest` is a soft nudge and unaffected.

## State files

`.claude/.skipper-*` markers (`-last`, `-stop-block`, `-docsync-<slug>`, `-stackwatch`, `-planguard`, `-session`, `-suggested`):
- Live in the project's `.claude/` directory (created if missing); session-scoped, safe to delete between sessions; each hook anchors to `git rev-parse --show-toplevel`, not cwd.
- **Gitignored** — the repo ignores `.claude/.skipper-*` (no longer "the user is responsible"; this landed in v1.x).
