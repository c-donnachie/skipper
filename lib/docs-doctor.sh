#!/usr/bin/env bash
# skipper docs-doctor.sh — diagnostica salud de docs/ (obsolescencia, stubs, links rotos, carpetas vacías).
# Uso: docs-doctor.sh [path] (default: cwd)
# Output: JSON { has_docs, stubs:[], stale:[], broken_links:[], empty_dirs:[], counts }
#
# Checks deterministas (el skill les pone juicio y severidad):
#  1. stubs        — ADR/PRD/plan que aún tiene placeholders del template o cuerpo casi vacío.
#  2. stale        — doc de architecture/business no tocado mientras el código siguió cambiando.
#  3. broken_links — links relativos entre docs que apuntan a archivos inexistentes.
#  4. empty_dirs   — subcarpetas de docs/ con sólo README.md (o vacías).
#
# Umbrales (el skill puede recalibrar, pero estos marcan el flag mecánico):
STALE_CODE_COMMITS=12   # ≥ este nº de commits de código desde el último toque del doc → stale
STUB_MIN_WORDS=60       # cuerpo (sin headers/frontmatter) por debajo → candidato a stub

set -u

target="${1:-$(pwd)}"
cd "$target" 2>/dev/null || { echo '{"error":"path not found"}'; exit 1; }

if [[ ! -d docs ]]; then
  echo '{"has_docs":false,"stubs":[],"stale":[],"broken_links":[],"empty_dirs":[],"counts":{"stubs":0,"stale":0,"broken_links":0,"empty_dirs":0}}'
  exit 0
fi

git rev-parse --is-inside-work-tree >/dev/null 2>&1 && is_git=1 || is_git=0
CODE_PATHS=(src app lib supabase packages api)

json_escape() { printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' 2>/dev/null || printf '"%s"' "$1"; }

# ============ 1. STUBS ============
# Placeholders literales que vienen de los templates de skipper.
PLACEHOLDERS=(
  "Qué se decidió, en imperativo"
  "por qué no se eligió"
  "Qué problema motivó esta decisión"
  "Qué duele hoy. A quién"
  "Por qué ahora. Qué problema/oportunidad lo gatilla"
  "Qué hace este subsistema en una frase"
)
stub_rows=()
for dir in decisions prds plans; do
  [[ -d "docs/$dir" ]] || continue
  for f in docs/$dir/*.md; do
    [[ -e "$f" ]] || continue
    base=$(basename "$f")
    [[ "$base" == "README.md" ]] && continue

    # cuerpo sin frontmatter, headers, ni líneas de metadata (- **Status** ...)
    words=$(grep -vE '^\s*(#|-|\||>|\*\*|---|`)' "$f" | tr -s ' \t' '\n' | grep -cE '\S' || echo 0)

    # kind: "placeholder" (alta confianza — texto del template sin rellenar)
    #       "thin"        (baja confianza — sólo es corto, podría estar completo y conciso)
    kind=""; reason=""
    for ph in "${PLACEHOLDERS[@]}"; do
      if grep -qF "$ph" "$f"; then kind="placeholder"; reason="placeholder del template sin rellenar"; break; fi
    done
    if [[ -z "$kind" && "$words" -lt "$STUB_MIN_WORDS" ]]; then
      kind="thin"; reason="cuerpo corto (${words} palabras) — verifica si está completo"
    fi

    if [[ -n "$kind" ]]; then
      stub_rows+=("{\"path\":\"$f\",\"words\":$words,\"kind\":\"$kind\",\"reason\":$(json_escape "$reason")}")
    fi
  done
done

# ============ 2. STALE ============
# Para architecture/ y business/: compara último commit del doc vs commits de código posteriores.
stale_rows=()
if [[ "$is_git" == "1" ]]; then
  for dir in architecture business; do
    [[ -d "docs/$dir" ]] || continue
    for f in docs/$dir/*.md; do
      [[ -e "$f" ]] || continue
      base=$(basename "$f")
      [[ "$base" == "README.md" ]] && continue

      hash=$(git log -1 --format=%H -- "$f" 2>/dev/null)
      [[ -z "$hash" ]] && continue   # untracked → ignorar

      ct=$(git log -1 --format=%ct -- "$f" 2>/dev/null)
      now=$(git log -1 --format=%ct HEAD 2>/dev/null || echo "$ct")
      days=$(( (now - ct) / 86400 ))

      code_commits=$(git rev-list --count "${hash}..HEAD" -- "${CODE_PATHS[@]}" 2>/dev/null || echo 0)

      if [[ "$code_commits" -ge "$STALE_CODE_COMMITS" ]]; then
        stale_rows+=("{\"path\":\"$f\",\"days_since_doc\":$days,\"code_commits_since\":$code_commits}")
      fi
    done
  done
fi

# ============ 3. BROKEN LINKS ============
broken_rows=()
while IFS= read -r f; do
  [[ -e "$f" ]] || continue
  dir=$(dirname "$f")
  # extrae targets de links markdown ](target)
  grep -oE '\]\([^)]+\)' "$f" 2>/dev/null | sed -E 's/^\]\(//; s/\)$//' | while IFS= read -r target; do
    # ignora URIs, anclas puras, rutas absolutas/home (no son links intra-docs portables)
    case "$target" in
      http://*|https://*|mailto:*|file:*|\#*|/*|~*|"") continue ;;
    esac
    # quita anchor y querystring
    clean="${target%%#*}"; clean="${clean%%\?*}"
    [[ -z "$clean" ]] && continue
    # resuelve relativo al dir del archivo
    resolved="$dir/$clean"
    if [[ ! -e "$resolved" ]]; then
      printf '%s\t%s\n' "$f" "$target"
    fi
  done
done < <(find docs -name '*.md' -type f 2>/dev/null) > /tmp/skipper_broken_$$ 2>/dev/null

if [[ -f /tmp/skipper_broken_$$ ]]; then
  while IFS=$'\t' read -r f target; do
    [[ -z "$f" ]] && continue
    broken_rows+=("{\"file\":\"$f\",\"target\":$(json_escape "$target")}")
  done < /tmp/skipper_broken_$$
  rm -f /tmp/skipper_broken_$$
fi

# ============ 4. EMPTY DIRS ============
empty_rows=()
for d in docs/*/; do
  [[ -d "$d" ]] || continue
  # cuenta .md que no sean README
  content=$(find "$d" -maxdepth 1 -name '*.md' ! -name 'README.md' 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$content" == "0" ]]; then
    empty_rows+=("\"${d%/}\"")
  fi
done

# ============ EMIT ============
join() { local IFS=,; echo "$*"; }
cat <<EOF
{
  "has_docs": true,
  "stubs": [$(join "${stub_rows[@]:-}")],
  "stale": [$(join "${stale_rows[@]:-}")],
  "broken_links": [$(join "${broken_rows[@]:-}")],
  "empty_dirs": [$(join "${empty_rows[@]:-}")],
  "counts": {
    "stubs": ${#stub_rows[@]},
    "stale": ${#stale_rows[@]},
    "broken_links": ${#broken_rows[@]},
    "empty_dirs": ${#empty_rows[@]}
  }
}
EOF
