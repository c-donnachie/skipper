#!/usr/bin/env bash
# skipper session-start.sh — banner al iniciar sesión Claude Code en un proyecto.
# Muestra: stack activo, layers, estado de docs.
# Silencioso si no es repo skipper-aware.

set -u

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root" || exit 0

# Self-heal .gitignore: skipper's hooks write machine-local scratch (.claude/.skipper-*:
# throttle timestamps, session state, run locks) and the engine writes a derived index
# (.skipper/). Both are rewritten on every run — if tracked they produce perpetual diff
# noise. Ensure they're ignored before any scratch is written this session. Idempotent;
# mirrors the engine's ensureGitignore(). Runs for any git repo where this hook fires.
gi_missing=()
for e in '.claude/.skipper-*' '.skipper/'; do
  { [[ -f .gitignore ]] && grep -qxF "$e" .gitignore; } || gi_missing+=("$e")
done
if (( ${#gi_missing[@]} )); then
  {
    [[ -f .gitignore && -s .gitignore && -n "$(tail -c1 .gitignore)" ]] && printf '\n'
    printf '# Skipper — machine-local artifacts (hook scratch + derived index), never commit\n'
    printf '%s\n' "${gi_missing[@]}"
  } >> .gitignore
fi

# Sin CLAUDE.md → silencioso
[[ -f CLAUDE.md ]] || exit 0

# Sin sección skipper:stack → silencioso
grep -q "skipper:stack" CLAUDE.md || exit 0

# Detecta stack
stack=$(awk '/<!-- skipper:stack -->/{f=1} f && /^## Stack:/{print; exit}' CLAUDE.md | sed 's/^## Stack: *//')
[[ -z "$stack" ]] && stack="(stack desconocido)"

# Especialistas relevantes según el stack (para auto-routing proactivo, estilo "skills se activan solas")
sl=$(printf '%s' "$stack" | tr '[:upper:]' '[:lower:]')
specs=""
case "$sl" in *expo*|*"react native"*|*"react-native"*) specs="$specs react-native" ;; esac
case "$sl" in *next*) specs="$specs nextjs" ;; esac
case "$sl" in *vite*) specs="$specs react-vite" ;; esac
case "$sl" in *node*|*fastify*) specs="$specs node-backend" ;; esac
case "$sl" in *supabase*) specs="$specs supabase" ;; esac
specs=$(printf '%s' "$specs" | xargs 2>/dev/null)

# Detecta layers
layers=$(grep -oE "<!-- skipper:layer:[a-z-]+" CLAUDE.md 2>/dev/null | sed 's/<!-- skipper:layer://' | sort -u | tr '\n' ' ')
[[ -z "$layers" ]] && layers="(sin layers)"

# Cuenta docs
adr_count=$(ls docs/decisions/*.md 2>/dev/null | grep -cE '^.*[0-9]{4}-' || echo 0)
prd_count=$(ls docs/prds/*.md 2>/dev/null | grep -cE '^.*[0-9]{4}-' || echo 0)
plan_count=$(ls docs/plans/*.md 2>/dev/null | grep -cE '^.*[0-9]{4}-' || echo 0)

# Última docs:update (mtime de .claude/.skipper-last si existe)
docs_status="al día"
marker=".claude/.skipper-last"
if [[ -f "$marker" ]]; then
  last=$(stat -f %m "$marker" 2>/dev/null || stat -c %Y "$marker" 2>/dev/null)
  age_days=$(( ( $(date +%s) - last ) / 86400 ))
  if (( age_days >= 7 )); then
    docs_status="hace $age_days días — considera /skipper:update"
  fi
fi

# Banner
cat <<EOF
╭─ 🐧 skipper ──────────────────────────────────────────╮
│ Stack:  $stack
│ Layers: $layers
│ Docs:   $adr_count ADR · $prd_count PRD · $plan_count plan · update $docs_status
╰───────────────────────────────────────────────────────╯
EOF

# Directiva proactiva (Tier 2). stdout en SessionStart llega a Claude como contexto de
# sesión: establece el comportamiento estándar sin que el usuario tipee comandos.
case "${SKIPPER_PROACTIVE:-on}" in
  off|0|false|no|OFF|FALSE|NO) : ;;
  *)
    cat <<'EOF'

🐧 skipper — modo proactivo ON. Durante esta sesión, sin que el usuario lo pida:
  • Si editas código de un subsistema documentado en docs/architecture/, mantén ese doc en sync en el mismo turno.
  • Si tomas una decisión con tradeoffs (lib, patrón, integración, deprecación), registra un ADR en docs/decisions/.
  • Mantén el bloque skipper:stack de CLAUDE.md alineado con package.json cuando agregues/quites dependencias relevantes.
  • No documentes cambios triviales. Sé conciso (< 200 líneas por doc).
EOF
    # Auto-routing de especialistas (sin comando): aplicá el experto por contexto.
    [[ -n "$specs" ]] && echo "  • Especialista del stack: al tocar/revisar código o responder preguntas de \"$stack\", aplicá proactivamente el criterio y las leyes del/los especialista(s) ($specs) — sus reglas están en CLAUDE.md (skipper:stack) y su dominio. NO esperes que el usuario tipee /skipper:<especialista>."
    echo "  • Estructura/capas/dependencias → razoná como 'architect'. Code smells/SOLID/refactor → como 'solid-coach'. Reservá /skipper:<especialista> sólo para un refactor dedicado y profundo."
    echo "  • Antes de implementar algo no-trivial (o ante un pedido difuso): fijá el OBJETIVO. Consultá la memoria por decisiones/constraints que apliquen, preguntá SÓLO los huecos abiertos (no lo ya decidido), y enunciá objetivo + criterios de aceptación antes de codear. (atajo: /skipper:goal)"
    echo "  (Para apagarlo: exportá SKIPPER_PROACTIVE=off.)"
    ;;
esac
