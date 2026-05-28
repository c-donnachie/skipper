#!/usr/bin/env bash
# skipper docs-sync.sh — hook PostToolUse(Edit|Write).
# Proactivo (Tier 2): cuando editas CÓDIGO de un subsistema potencialmente documentado,
# inyecta additionalContext para que CLAUDE mantenga docs/ en sync en el mismo turno.
# A diferencia de specialist-suggest.sh (que sugiere al usuario), esto le habla a Claude.
#
# Opt-out global: SKIPPER_PROACTIVE=off
# Loop-safe: ignora edits a docs/ y *.md; throttle 1 inyección / 10 min por sesión.

set -u

# Opt-out
case "${SKIPPER_PROACTIVE:-on}" in
  off|0|false|no|OFF|FALSE|NO) exit 0 ;;
esac

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root" || exit 0

# Sólo proyectos skipper-aware
[[ -d docs ]] || exit 0

# Lee el path editado del JSON del hook
input=$(cat 2>/dev/null || echo "{}")
file_path=$(echo "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)
[[ -z "$file_path" ]] && exit 0
case "$file_path" in "$repo_root"/*) file_path="${file_path#$repo_root/}" ;; esac

# Ignora edits a docs/, CLAUDE.md y markdown (evita loop: Claude edita doc → no re-disparar)
case "$file_path" in
  docs/*|CLAUDE.md|*.md|*.mdx) exit 0 ;;
esac

# Sólo dispara para código de aplicación
echo "$file_path" | grep -qE '^(src/|app/|lib/|packages/|api/)' || exit 0

# ── Mapea el archivo a un subsistema documentado (docs/architecture/<dominio>.md) ──
# Heurística: cada doc aporta keywords (segmentos del nombre ≥4 chars). Si una keyword
# aparece en el path, ese doc es el subsistema del archivo. Primer match gana.
subsystem_doc=""
fp_lc=$(echo "$file_path" | tr '[:upper:]' '[:lower:]')
for d in docs/architecture/*.md; do
  [[ -e "$d" ]] || continue
  base=$(basename "$d" .md)
  [[ "$base" =~ ^[Rr][Ee][Aa][Dd][Mm][Ee]$ ]] && continue
  IFS='-' read -ra kws <<< "$base"
  for kw in "${kws[@]}"; do
    [[ ${#kw} -ge 4 ]] || continue
    if echo "$fp_lc" | grep -q "$kw"; then subsystem_doc="$d"; break 2; fi
  done
done

# Throttle por subsistema (o genérico): 1 inyección / 10 min. Así editar auth y luego
# notifications da el nudge específico de cada uno, sin spamear edit por edit.
mkdir -p .claude
slug=$([[ -n "$subsystem_doc" ]] && basename "$subsystem_doc" .md || echo "generic")
marker=".claude/.skipper-docsync-$slug"
if [[ -f "$marker" ]]; then
  last=$(stat -f %m "$marker" 2>/dev/null || stat -c %Y "$marker" 2>/dev/null || echo 0)
  (( $(date +%s) - last < 600 )) && exit 0
fi
touch "$marker"

# additionalContext → Claude lo recibe junto al resultado de la tool
python3 - "$file_path" "$subsystem_doc" <<'PY'
import json, sys
fp = sys.argv[1]
doc = sys.argv[2] if len(sys.argv) > 2 else ""
if doc:
    msg = (
        f"skipper (protocolo de docs activo): editaste `{fp}`, parte del subsistema "
        f"documentado en `{doc}`. Sin pedir permiso: verifica que tu cambio respeta el "
        f"diseño/contratos/gotchas de ese doc, y si lo altera, actualízalo en este mismo "
        f"turno. Si introduce una decisión con tradeoffs (lib, patrón, integración), "
        f"registra un ADR en docs/decisions/. No documentes cambios triviales. "
        f"(SKIPPER_PROACTIVE=off para desactivar.)"
    )
else:
    msg = (
        f"skipper (protocolo de docs activo): editaste `{fp}`. Sin pedir permiso, "
        f"si este cambio altera comportamiento documentado en docs/architecture/, "
        f"actualiza ese doc en este mismo turno; si introduce una decisión con tradeoffs "
        f"(lib, patrón, integración), registra un ADR en docs/decisions/. "
        f"No documentes cambios triviales (typos, formato, renombres locales). "
        f"(SKIPPER_PROACTIVE=off para desactivar.)"
    )
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PostToolUse",
        "additionalContext": msg
    }
}))
PY
exit 0
