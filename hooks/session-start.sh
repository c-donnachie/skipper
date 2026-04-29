#!/usr/bin/env bash
# skipper session-start.sh — banner al iniciar sesión Claude Code en un proyecto.
# Muestra: stack activo, layers, estado de docs.
# Silencioso si no es repo skipper-aware.

set -u

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root" || exit 0

# Sin CLAUDE.md → silencioso
[[ -f CLAUDE.md ]] || exit 0

# Sin sección skipper:stack → silencioso
grep -q "skipper:stack" CLAUDE.md || exit 0

# Detecta stack
stack=$(awk '/<!-- skipper:stack -->/{f=1} f && /^## Stack:/{print; exit}' CLAUDE.md | sed 's/^## Stack: *//')
[[ -z "$stack" ]] && stack="(stack desconocido)"

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
