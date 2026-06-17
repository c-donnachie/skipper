#!/usr/bin/env bash
# Stop: hard-ish enforcement of project memory (the follow-on of ADR-0018). If this turn
# changed code GOVERNED by an ADR, block (exit 2) with the governing decisions so Claude
# self-verifies compliance — fix the change, or supersede the ADR if the decision itself
# changed — BEFORE yielding control. Detecting actual violation is Claude's judgment;
# this forces the confrontation. No-op if the engine isn't installed; loop-safe, throttled
# (30 min), SKIPPER_PROACTIVE=off.

[ "${SKIPPER_PROACTIVE:-}" = "off" ] && exit 0

input="$(cat)"
root="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -z "$root" ] && exit 0

# resolve a global `skipper`, else the local engine; no-op if neither
if command -v skipper >/dev/null 2>&1; then
  run() { NODE_NO_WARNINGS=1 skipper "$@"; }
elif [ -f "$root/engine/bin/skipper.mjs" ] && command -v node >/dev/null 2>&1; then
  run() { NODE_NO_WARNINGS=1 node "$root/engine/bin/skipper.mjs" "$@"; }
else
  exit 0
fi

# loop-safe: never re-fire inside a stop-hook continuation
stop_active="$(printf '%s' "$input" | python3 -c "import sys,json
try:
    print(json.load(sys.stdin).get('stop_hook_active', False))
except Exception:
    print(False)" 2>/dev/null)"
[ "$stop_active" = "True" ] && exit 0

# throttle: at most one block per 30 min
mkdir -p "$root/.claude"
marker="$root/.claude/.skipper-memory-stop"
now="$(date +%s)"
if [ -f "$marker" ]; then
  last="$(cat "$marker" 2>/dev/null)"; : "${last:=0}"
  if [ "$(( now - last ))" -lt 1800 ]; then exit 0; fi
fi

block="$(run guard 2>/dev/null)"
[ -z "$block" ] && exit 0   # nothing governed changed → let the turn end

echo "$now" > "$marker"
printf '%s\n' "$block" >&2   # stderr on exit 2 is delivered to Claude as a directive
exit 2
