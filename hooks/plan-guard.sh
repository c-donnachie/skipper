#!/usr/bin/env bash
# skipper plan-guard.sh — hook UserPromptSubmit.
# Cuando el usuario está en PLAN MODE (permission_mode == "plan"), inyecta el protocolo
# de arquitectura de skipper como additionalContext, ANTES de que Claude investigue y
# arme el plan. Así cada plan nace aplicando las leyes del proyecto, reusando lo que ya
# existe y referenciando la documentación — sin que el usuario lo pida.
#
# Opt-out global: SKIPPER_PROACTIVE=off
# Throttle: 1 inyección / 5 min por sesión (no repetir en cada mensaje del plan).

set -u

# Opt-out
case "${SKIPPER_PROACTIVE:-on}" in
  off|0|false|no|OFF|FALSE|NO) exit 0 ;;
esac

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root" || exit 0

# Sólo proyectos skipper-aware
[[ -f CLAUDE.md || -d docs ]] || exit 0

# Detecta plan mode desde el stdin del hook
input=$(cat 2>/dev/null || echo "{}")
mode=$(echo "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('permission_mode',''))" 2>/dev/null)
[[ "$mode" == "plan" ]] || exit 0

# Throttle: 1 inyección cada 5 min por sesión
mkdir -p .claude
marker=".claude/.skipper-planguard"
if [[ -f "$marker" ]]; then
  last=$(stat -f %m "$marker" 2>/dev/null || stat -c %Y "$marker" 2>/dev/null || echo 0)
  (( $(date +%s) - last < 300 )) && exit 0
fi
touch "$marker"

# Inventario de docs disponibles para que Claude sepa qué leer/referenciar
arch_list=$(ls docs/architecture/*.md 2>/dev/null | grep -viE 'readme' | xargs -n1 basename 2>/dev/null | paste -sd , - 2>/dev/null | sed 's/,/, /g')
adr_list=$(ls docs/decisions/*.md 2>/dev/null | grep -E '[0-9]{4}-' | xargs -n1 basename 2>/dev/null | paste -sd , - 2>/dev/null | sed 's/,/, /g')
has_claude=$([[ -f CLAUDE.md ]] && echo 1 || echo 0)

python3 - "$arch_list" "$adr_list" "$has_claude" <<'PY'
import json, sys
arch, adrs, has_claude = sys.argv[1], sys.argv[2], sys.argv[3] == "1"

lines = [
    "skipper — protocolo de plan mode. Antes de finalizar este plan, aplícalo implícitamente "
    "(no le des cátedra al usuario; entrega un plan que ya lo refleje):",
    "  1. APLICA LAS LEYES: "
    + ("lee el bloque skipper:stack de CLAUDE.md y " if has_claude else "")
    + "los docs/architecture relevantes; el plan debe respetar las capas, estructura y "
      "anti-patrones declarados. Si vas a crear/editar funcionalidad, ubícala en la capa correcta.",
    "  2. REUSA ANTES DE CONSTRUIR: busca en el código si la funcionalidad ya existe "
    "(servicios, hooks, componentes, endpoints, utils) antes de proponer crear algo nuevo. "
    "Si existe, el plan la extiende/reusa en vez de duplicarla; di explícitamente qué encontraste.",
    "  3. REFERENCIA DOCS: enlaza en el plan los docs/ADRs existentes que apliquen.",
    "  4. MARCA DECISIONES: si el plan implica una decisión con tradeoffs (lib, patrón, "
    "integración, deprecación), anótalo para crear un ADR al implementar.",
]
if arch:
    lines.append(f"  Docs de arquitectura disponibles: {arch}.")
if adrs:
    lines.append(f"  ADRs existentes: {adrs}.")
lines.append("  (Desactivable con SKIPPER_PROACTIVE=off.)")

msg = "\n".join(lines)
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "UserPromptSubmit",
        "additionalContext": msg
    }
}))
PY
exit 0
