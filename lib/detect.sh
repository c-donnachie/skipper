#!/usr/bin/env bash
# skipper detect.sh — detecta el stack de un proyecto y emite JSON.
# Uso: detect.sh [path] (default: cwd)
# Output: JSON { detected: [...], confidence: high|medium|low|none, ambiguous: bool, signals: {...} }
#
# 3 capas de detección:
#  1. Archivos marcador (next.config, vite.config, app.json con expo, etc.)
#  2. Dependencias (package.json deps/devDeps, pyproject.toml)
#  3. Estructura (app/ con route groups, src/features/, etc.)
#
# Coincidencia ≥2 capas → high confidence
#  1 capa → medium o ambiguous
#  0 capas → none

set -u

target="${1:-$(pwd)}"
cd "$target" 2>/dev/null || { echo '{"error":"path not found"}'; exit 1; }

# Detectores individuales — cada uno emite "1" si match, "0" si no.
has_file() { [[ -f "$1" || -f "$1.ts" || -f "$1.js" || -f "$1.mjs" ]] && echo 1 || echo 0; }
has_dir()  { [[ -d "$1" ]] && echo 1 || echo 0; }
has_dep()  {
  local dep="$1"
  [[ -f package.json ]] || return 1
  grep -qE "\"$dep\"\\s*:" package.json && echo 1 || echo 0
}
has_py_dep() {
  local dep="$1"
  [[ -f pyproject.toml ]] || return 1
  grep -qiE "(^|[^a-z-])$dep([^a-z-]|$)" pyproject.toml && echo 1 || echo 0
}

# === Layer 1: archivos marcador ===
file_vite=$(has_file "vite.config")
file_next=$(has_file "next.config")
file_expo=0
[[ -f app.json ]] && grep -q '"expo"' app.json 2>/dev/null && file_expo=1
file_supabase=$(has_file "supabase/config.toml")
file_pyproject=$([[ -f pyproject.toml ]] && echo 1 || echo 0)
file_fastify=0
[[ -f package.json ]] && grep -q '"fastify"' package.json 2>/dev/null && file_fastify=1

# === Layer 2: dependencias ===
dep_react=$(has_dep "react" 2>/dev/null || echo 0)
dep_vite=$(has_dep "vite" 2>/dev/null || echo 0)
dep_next=$(has_dep "next" 2>/dev/null || echo 0)
dep_expo=$(has_dep "expo" 2>/dev/null || echo 0)
dep_rn=$(has_dep "react-native" 2>/dev/null || echo 0)
dep_supabase=$(has_dep "@supabase/supabase-js" 2>/dev/null || echo 0)
dep_fastify=$(has_dep "fastify" 2>/dev/null || echo 0)
dep_express=$(has_dep "express" 2>/dev/null || echo 0)
dep_hono=$(has_dep "hono" 2>/dev/null || echo 0)
dep_fastapi=$(has_py_dep "fastapi" 2>/dev/null || echo 0)
dep_django=$(has_py_dep "django" 2>/dev/null || echo 0)

# === Layer 3: estructura ===
struct_app_router=0
[[ -d app ]] && find app -maxdepth 2 -name "page.tsx" -o -name "page.ts" 2>/dev/null | grep -q . && struct_app_router=1
struct_features=$(has_dir "src/features")
struct_supabase_dir=$(has_dir "supabase")

# === Decisión por stack ===
# Cada stack acumula puntos (3 layers max). 2+ → high, 1 → medium, 0 → none.
score_react_vite=0
[[ $file_vite -eq 1 ]] && score_react_vite=$((score_react_vite + 1))
[[ $dep_vite -eq 1 && $dep_react -eq 1 ]] && score_react_vite=$((score_react_vite + 1))

score_nextjs=0
[[ $file_next -eq 1 ]] && score_nextjs=$((score_nextjs + 1))
[[ $dep_next -eq 1 ]] && score_nextjs=$((score_nextjs + 1))
[[ $struct_app_router -eq 1 ]] && score_nextjs=$((score_nextjs + 1))

score_expo=0
[[ $file_expo -eq 1 ]] && score_expo=$((score_expo + 1))
[[ $dep_expo -eq 1 ]] && score_expo=$((score_expo + 1))
[[ $dep_rn -eq 1 ]] && score_expo=$((score_expo + 1))

score_supabase=0
[[ $file_supabase -eq 1 ]] && score_supabase=$((score_supabase + 1))
[[ $dep_supabase -eq 1 ]] && score_supabase=$((score_supabase + 1))
[[ $struct_supabase_dir -eq 1 ]] && score_supabase=$((score_supabase + 1))

score_node_api=0
[[ $dep_fastify -eq 1 || $dep_express -eq 1 || $dep_hono -eq 1 ]] && score_node_api=$((score_node_api + 1))

score_python=0
[[ $file_pyproject -eq 1 ]] && score_python=$((score_python + 1))
[[ $dep_fastapi -eq 1 || $dep_django -eq 1 ]] && score_python=$((score_python + 1))

# === Construye lista de candidatos ===
# Combinaciones soportadas (perfiles monolíticos v0.2):
#   react-vite-supabase, react-vite-node
#   nextjs-fullstack (sólo Next), nextjs-supabase
#   expo-supabase, expo-node
#   node-api, python-fastapi

detected=()
confidence="none"

# Frontends
fe=""
[[ $score_nextjs -ge 2 ]] && fe="nextjs"
[[ $score_react_vite -ge 2 && -z "$fe" ]] && fe="react-vite"
[[ $score_expo -ge 2 ]] && fe="expo"

# Backends adjuntos
be=""
[[ $score_supabase -ge 1 ]] && be="supabase"
[[ -z "$be" && $score_node_api -ge 1 ]] && be="node"

# Construye stack id
stack=""
case "$fe" in
  nextjs)
    [[ "$be" == "supabase" ]] && stack="nextjs-supabase" || stack="nextjs-fullstack"
    ;;
  react-vite)
    [[ "$be" == "supabase" ]] && stack="react-vite-supabase"
    [[ "$be" == "node" ]] && stack="react-vite-node"
    [[ -z "$be" ]] && stack="react-vite-supabase"  # default si solo es react-vite
    ;;
  expo)
    [[ "$be" == "supabase" ]] && stack="expo-supabase"
    [[ "$be" == "node" ]] && stack="expo-node"
    [[ -z "$be" ]] && stack="expo-supabase"  # default
    ;;
esac

# Si no hay frontend pero sí backend solo
[[ -z "$stack" && $score_node_api -ge 1 ]] && stack="node-api"
[[ -z "$stack" && $score_python -ge 2 ]] && stack="python-fastapi"

# Confianza
if [[ -n "$stack" ]]; then
  total_score=$((score_nextjs + score_react_vite + score_expo + score_supabase + score_node_api + score_python))
  if [[ $total_score -ge 4 ]]; then
    confidence="high"
  elif [[ $total_score -ge 2 ]]; then
    confidence="medium"
  else
    confidence="low"
  fi
  detected+=("$stack")
fi

# Ambigüedad: si hay 2+ frontends competing
ambiguous="false"
fes_present=0
[[ $score_nextjs -ge 2 ]] && fes_present=$((fes_present + 1))
[[ $score_react_vite -ge 2 ]] && fes_present=$((fes_present + 1))
[[ $score_expo -ge 2 ]] && fes_present=$((fes_present + 1))
[[ $fes_present -gt 1 ]] && ambiguous="true"

# === Emite JSON ===
detected_json=$(printf '"%s",' "${detected[@]}" | sed 's/,$//')
[[ -z "$detected_json" ]] && detected_json=""

cat <<EOF
{
  "detected": [${detected_json}],
  "confidence": "${confidence}",
  "ambiguous": ${ambiguous},
  "signals": {
    "files": {
      "vite_config": ${file_vite},
      "next_config": ${file_next},
      "app_json_expo": ${file_expo},
      "supabase_config": ${file_supabase},
      "pyproject": ${file_pyproject}
    },
    "deps": {
      "react": ${dep_react},
      "vite": ${dep_vite},
      "next": ${dep_next},
      "expo": ${dep_expo},
      "react-native": ${dep_rn},
      "supabase-js": ${dep_supabase},
      "fastify": ${dep_fastify},
      "express": ${dep_express},
      "hono": ${dep_hono},
      "fastapi": ${dep_fastapi},
      "django": ${dep_django}
    },
    "scores": {
      "react_vite": ${score_react_vite},
      "nextjs": ${score_nextjs},
      "expo": ${score_expo},
      "supabase": ${score_supabase},
      "node_api": ${score_node_api},
      "python": ${score_python}
    }
  }
}
EOF
