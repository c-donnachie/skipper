#!/usr/bin/env bash
# skipper: hook Stop que sugiere correr /skipper:update tras cambios en código.
# Sólo dispara 1× cada 24h por proyecto, y sólo si hay cambios en src/, app/, lib/, packages/.

set -u

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root" || exit 0

changed=$(
  {
    git diff --name-only HEAD 2>/dev/null
    git diff --cached --name-only 2>/dev/null
    git log @{u}.. --name-only --pretty=format: 2>/dev/null
  } | sort -u
)

echo "$changed" | grep -qE '^(src/|app/|lib/|packages/.+/(src|lib))/' || exit 0

marker_dir=".claude"
marker="$marker_dir/.skipper-last"

mkdir -p "$marker_dir"

if [[ -f "$marker" ]]; then
  last=$(stat -f %m "$marker" 2>/dev/null || stat -c %Y "$marker" 2>/dev/null || echo 0)
  now=$(date +%s)
  if (( now - last < 86400 )); then
    exit 0
  fi
fi

touch "$marker"

cat <<EOF
🐧 skipper reportándose: detecté cambios en código fuente desde el último update.
   Capitán, considera correr /skipper:update para revisar si hay ADRs, PRDs o docs de business que actualizar.
EOF
