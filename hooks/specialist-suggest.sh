#!/usr/bin/env bash
# skipper specialist-suggest.sh — hook PostToolUse que sugiere invocar al
# especialista correcto cuando detectas patrones de edición sostenidos.
#
# Cómo funciona:
#  1. Lee el path del Edit/Write actual desde stdin (JSON del hook).
#  2. Lo agrega a .claude/.skipper-session (acumulador con timestamp).
#  3. Si en los últimos N minutos hay ≥3 archivos que matchean el
#     mismo agente (por glob de paths), imprime sugerencia.
#  4. Throttle: una sugerencia por agente por sesión (no spammea).
#
# Lee glob patterns de cada agente desde frontmatter paths: en agents/<name>.md.

set -u

THRESHOLD=3
WINDOW_MINUTES=30
SESSION_DIR=".claude"
SESSION_FILE="${SESSION_DIR}/.skipper-session"
SUGGESTED_FILE="${SESSION_DIR}/.skipper-suggested"

# Repo root
repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root" || exit 0

# Lee el path editado del JSON del hook (stdin)
input=$(cat 2>/dev/null || echo "{}")
file_path=$(echo "$input" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)

# Si no hay path, salir
[[ -z "$file_path" ]] && exit 0

# Convertir a relativo si es absoluto bajo repo
case "$file_path" in
  "$repo_root"/*) file_path="${file_path#$repo_root/}" ;;
esac

mkdir -p "$SESSION_DIR"

# Acumula: timestamp|path
echo "$(date +%s)|$file_path" >> "$SESSION_FILE"

# Limpia entradas viejas (> WINDOW_MINUTES)
cutoff=$(($(date +%s) - WINDOW_MINUTES * 60))
if [[ -f "$SESSION_FILE" ]]; then
  awk -F'|' -v c="$cutoff" '$1 >= c' "$SESSION_FILE" > "${SESSION_FILE}.tmp" && mv "${SESSION_FILE}.tmp" "$SESSION_FILE"
fi

# Para cada stack-agent, lee paths: del frontmatter y cuenta matches
plugin_dir="${CLAUDE_PLUGIN_ROOT:-$(dirname "$0")/..}"
agents_dir="$plugin_dir/agents"

[[ -d "$agents_dir" ]] || exit 0

declare -A counts

# Lista de agents con paths: glob
for agent_file in "$agents_dir"/*.md; do
  agent_name=$(basename "$agent_file" .md)

  # Skip skipper, kowalski (no son stack-agents)
  case "$agent_name" in
    skipper|kowalski|architect|solid-coach) continue ;;
  esac

  # Extrae line "paths: [...]" del frontmatter
  paths_line=$(awk '/^---$/{f++} f==1 && /^paths:/{print; exit}' "$agent_file")
  [[ -z "$paths_line" ]] && continue

  # Parsea globs (formato: paths: ["src/**/*.tsx", "src/**/*.ts"])
  globs=$(echo "$paths_line" | sed -E 's/paths:\s*\[//; s/\]//; s/"//g; s/,/ /g')
  [[ -z "$globs" ]] && continue

  # Cuenta archivos en session_file que matchean cualquier glob
  count=0
  while IFS='|' read -r ts path; do
    [[ -z "$path" ]] && continue
    for glob in $globs; do
      # Bash glob match (case esac con extglob)
      shopt -s extglob globstar nullglob 2>/dev/null
      if [[ "$path" == $glob ]]; then
        count=$((count + 1))
        break
      fi
    done
  done < "$SESSION_FILE"

  counts["$agent_name"]=$count
done

# Encuentra el agent con más matches
top_agent=""
top_count=0
for agent in "${!counts[@]}"; do
  if [[ ${counts[$agent]} -gt $top_count ]]; then
    top_count=${counts[$agent]}
    top_agent=$agent
  fi
done

# Si supera threshold y no se sugirió antes en esta sesión
if [[ $top_count -ge $THRESHOLD && -n "$top_agent" ]]; then
  if [[ ! -f "$SUGGESTED_FILE" ]] || ! grep -q "^$top_agent$" "$SUGGESTED_FILE" 2>/dev/null; then
    echo "$top_agent" >> "$SUGGESTED_FILE"

    cat <<EOF
🐧 Skipper detectó $top_count archivos editados que tocan el dominio del especialista \`$top_agent\`.
   Considera invocar:  /skipper:$top_agent "<tu pregunta>"
   O usar el router:    /skipper:ask "<pregunta libre>"
EOF
  fi
fi

exit 0
