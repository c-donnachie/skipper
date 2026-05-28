#!/usr/bin/env bash
# skipper plan-exit-guard.sh — hook PreToolUse(ExitPlanMode). Backstop best-effort.
# Inyecta un checklist de arquitectura cuando Claude va a cerrar el plan. Complementa a
# plan-guard.sh (que inyecta al INICIO del planning vía UserPromptSubmit/permission_mode).
#
# NOTA: si la versión de Claude Code no expone ExitPlanMode al matcher de PreToolUse,
# este hook simplemente no se dispara (no-op silencioso). No bloquea — sólo recuerda.
# Opt-out: SKIPPER_PROACTIVE=off.

set -u

case "${SKIPPER_PROACTIVE:-on}" in
  off|0|false|no|OFF|FALSE|NO) exit 0 ;;
esac

# Consume stdin (el hook recibe JSON) aunque no lo necesitemos
cat >/dev/null 2>&1 || true

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root" || exit 0
[[ -f CLAUDE.md || -d docs ]] || exit 0

python3 - <<'PY'
import json
msg = (
    "skipper — checklist antes de cerrar el plan: (1) el código nuevo va en la capa "
    "correcta según CLAUDE.md y docs/architecture; (2) el plan dice explícitamente si la "
    "funcionalidad ya existe y la reusa en vez de duplicarla; (3) referencia los docs/ADRs "
    "relevantes; (4) marca las decisiones con tradeoffs para un ADR. Si falta alguno, "
    "revísalo antes de presentar el plan. (SKIPPER_PROACTIVE=off para desactivar.)"
)
print(json.dumps({
    "hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": msg}
}))
PY
exit 0
