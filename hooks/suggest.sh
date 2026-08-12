#!/usr/bin/env bash
# skipper: hook Stop.
#
# Modo PROACTIVO (Tier 2, default): si en el turno cambió CÓDIGO de un área documentada
# y NO se tocó docs/, ordena a Claude sincronizar la documentación antes de devolver el
# control (exit 2 → stderr se le entrega a Claude como directiva). NO le pide permiso al
# usuario: Claude actúa. Loop-safe (1 bloqueo / 30 min, respeta stop_hook_active, y si ya
# se tocó docs/ no molesta).
#
# Modo NO-PROACTIVO (SKIPPER_PROACTIVE=off): comportamiento histórico — sugerencia al
# usuario 1×/24h para correr /skipper:update.

set -u

case "${SKIPPER_PROACTIVE:-on}" in
  off|0|false|no|OFF|FALSE|NO) PROACTIVE=0 ;;
  *) PROACTIVE=1 ;;
esac

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root" || exit 0

# Sólo proyectos skipper-aware
[[ -d docs ]] || exit 0

# Loop guard nativo: si Claude ya está continuando por un Stop hook, no re-bloquear
input=$(cat 2>/dev/null || echo "{}")
stop_active=$(echo "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('stop_hook_active', False))" 2>/dev/null || echo "False")
[[ "$stop_active" == "True" ]] && exit 0

changed=$(
  {
    # porcelain captura modified + staged + untracked (archivos nuevos creados con Write)
    git status --porcelain 2>/dev/null | sed -E 's/^.. //; s/^.* -> //'
    git log @{u}.. --name-only --pretty=format: 2>/dev/null
  } | sort -u
)

code_changed=$(echo "$changed" | grep -cE '^(src/|app/|lib/|packages/.+/(src|lib)/|api/)')
docs_changed=$(echo "$changed" | grep -cE '^docs/')

# Sin cambios de código → nada que hacer
[[ "$code_changed" -eq 0 ]] && exit 0

marker_dir=".claude"
mkdir -p "$marker_dir"

# ─────────────────────────── Modo proactivo (Tier 2) ───────────────────────────
if [[ "$PROACTIVE" -eq 1 ]]; then
  block_marker="$marker_dir/.skipper-stop-block"

  # Loop guard: máximo 1 bloqueo cada 30 min
  if [[ -f "$block_marker" ]]; then
    last=$(stat -f %m "$block_marker" 2>/dev/null || stat -c %Y "$block_marker" 2>/dev/null || echo 0)
    (( $(date +%s) - last < 1800 )) && exit 0
  fi

  # Si ya se tocó docs/ en este set de cambios, asumimos que se sincronizó → no molestar
  [[ "$docs_changed" -gt 0 ]] && exit 0

  touch "$block_marker"

  # exit 2 + stderr → Claude lo recibe como directiva y sigue trabajando
  cat >&2 <<'EOF'
━━━ 🐧 SKIPPER · docs ━━━
cambiaste código (src/app/lib/api) en este turno y no actualizaste docs/.
Antes de terminar, evalúa SIN pedir permiso al usuario (es el protocolo skipper Tier 2):
  1. ¿El cambio altera un subsistema documentado en docs/architecture/*.md? → actualiza ese doc ahora.
  2. ¿Tomaste una decisión con tradeoffs (lib, patrón, integración, deprecación)? → crea un ADR en docs/decisions/.
  3. ¿Nada documentable (typo, formato, refactor trivial)? → dilo en una línea y termina.
No reescribas docs por cambios triviales. Si actualizas algo, hazlo conciso (< 200 líneas/doc).
(Para apagar este comportamiento: SKIPPER_PROACTIVE=off.)
EOF
  exit 2
fi

# ────────────────────────── Modo no-proactivo (histórico) ──────────────────────────
marker="$marker_dir/.skipper-last"
if [[ -f "$marker" ]]; then
  last=$(stat -f %m "$marker" 2>/dev/null || stat -c %Y "$marker" 2>/dev/null || echo 0)
  (( $(date +%s) - last < 86400 )) && exit 0
fi
touch "$marker"

cat <<EOF
━━━ 🐧 SKIPPER · docs ━━━
detecté cambios en código fuente desde el último update.
   Capitán, considera correr /skipper:update para revisar si hay ADRs, PRDs o docs de business que actualizar.
   O /skipper:docs-doctor para ver qué docs quedaron atrás respecto al código.
EOF
exit 0
