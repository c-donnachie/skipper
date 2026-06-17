#!/usr/bin/env bash
# PostToolUse(Edit|Write): proactively inject the project decisions that GOVERN the edited
# path — so an agent sees them WITHOUT being asked. This is the push half of the memory
# (ADR-0009 ethos: inject directives Claude obeys), bridging the plugin hook to the
# skipper-memory engine CLI. No-op if the engine isn't installed, keeping the plugin
# zero-install and the memory opt-in (ADR-0017). Loop-safe + throttled + SKIPPER_PROACTIVE=off.

[ "${SKIPPER_PROACTIVE:-}" = "off" ] && exit 0

input="$(cat)"
root="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -z "$root" ] && exit 0

# the engine is a separate opt-in package — resolve a global `skipper`, else the local engine; no-op if neither
if command -v skipper >/dev/null 2>&1; then
  run() { NODE_NO_WARNINGS=1 skipper "$@"; }
elif [ -f "$root/engine/bin/skipper.mjs" ] && command -v node >/dev/null 2>&1; then
  run() { NODE_NO_WARNINGS=1 node "$root/engine/bin/skipper.mjs" "$@"; }
else
  exit 0
fi

# edited file path from the hook payload
fp="$(printf '%s' "$input" | python3 -c "import sys,json
try:
    d=json.load(sys.stdin)
    print((d.get('tool_input') or {}).get('file_path',''))
except Exception:
    print('')" 2>/dev/null)"
[ -z "$fp" ] && exit 0
rel="${fp#"$root"/}"

# loop-safe: never fire on docs / markdown / the engine itself / scratch
case "$rel" in
  docs/*|*.md|*.mdx|.skipper/*|engine/*|.claude/*) exit 0 ;;
esac

# throttle per top-level subsystem (10 min), like docs-sync
sub="${rel%%/*}"
mkdir -p "$root/.claude"
marker="$root/.claude/.skipper-memory-$sub"
now="$(date +%s)"
if [ -f "$marker" ]; then
  last="$(cat "$marker" 2>/dev/null)"; : "${last:=0}"
  if [ "$(( now - last ))" -lt 600 ]; then exit 0; fi
fi

# ask the engine for the governing decisions (compact, injectable). Empty => nothing to say.
brief="$(run context "$rel" --brief 2>/dev/null)"
[ -z "$brief" ] && exit 0

echo "$now" > "$marker"

# inject as additionalContext — a directive Claude reads in the same turn
printf '%s' "$brief" | python3 -c "import sys,json
print(json.dumps({'hookSpecificOutput':{'hookEventName':'PostToolUse','additionalContext':sys.stdin.read()}}))"
exit 0
