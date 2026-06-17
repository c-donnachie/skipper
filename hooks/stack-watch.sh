#!/usr/bin/env bash
# skipper stack-watch.sh — hook PostToolUse(Bash|Edit|Write).
# Cuando cambian dependencias (npm/pnpm/yarn/bun add|install|remove <pkg>, o edición de
# package.json), recuerda a Claude mantener el bloque skipper:stack de CLAUDE.md alineado
# con package.json — el desfase del stack era una de las fallas medidas.
#
# PostToolUse (no Pre): el additionalContext llega junto al resultado, justo cuando la
# instalación/edición ya ocurrió. Opt-out: SKIPPER_PROACTIVE=off. Throttle 10 min/sesión.

set -u

case "${SKIPPER_PROACTIVE:-on}" in
  off|0|false|no|OFF|FALSE|NO) exit 0 ;;
esac

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root" || exit 0

# Sólo si hay un bloque skipper:stack que mantener
[[ -f CLAUDE.md ]] && grep -q "skipper:stack" CLAUDE.md 2>/dev/null || exit 0

input=$(cat 2>/dev/null || echo "{}")
tool=$(echo "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null)

relevant=0
case "$tool" in
  Bash)
    cmd=$(echo "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)
    echo "$cmd" | grep -qiE '\b(npm|pnpm|yarn|bun)\b.*\b(add|install|i|remove|uninstall|rm)\b' && relevant=1
    ;;
  Edit|Write|MultiEdit)
    fp=$(echo "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)
    case "$fp" in */package.json|package.json) relevant=1 ;; esac
    ;;
esac
[[ "$relevant" -eq 1 ]] || exit 0

mkdir -p .claude
marker=".claude/.skipper-stackwatch"
if [[ -f "$marker" ]]; then
  last=$(stat -f %m "$marker" 2>/dev/null || stat -c %Y "$marker" 2>/dev/null || echo 0)
  (( $(date +%s) - last < 600 )) && exit 0
fi
touch "$marker"

python3 - <<'PY'
import json
msg = (
    "skipper: cambiaron las dependencias del proyecto. Si agregaste/quitaste una "
    "librería que skipper opina (estado, validación, data-fetching, styling, ORM, "
    "auth, http, queue, logging, etc.), actualiza el bloque skipper:stack de CLAUDE.md "
    "para que no quede desfasado — o corre /skipper:stack-sync para ver el drift. "
    "No hace falta para deps triviales. (SKIPPER_PROACTIVE=off para desactivar.)"
)
print(json.dumps({
    "hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": msg}
}))
PY
exit 0
