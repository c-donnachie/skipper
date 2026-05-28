#!/usr/bin/env bash
# skipper stack-sync.sh — detecta desfase entre package.json y el bloque skipper:stack.
# Uso: stack-sync.sh [path] (default: cwd)
# Output: JSON { stack, has_block, libs: [{package, category, installed, mentioned, status}], counts }
#
# Cruza dos fuentes de verdad:
#  1. package.json (deps + devDeps) → qué está REALMENTE instalado.
#  2. Bloque <!-- skipper:stack --> de CLAUDE.md → qué está DECLARADO.
#
# Para cada librería "opinable" (diccionario abajo) reporta status:
#   ok           → instalada y mencionada en el bloque
#   undocumented → instalada pero NO mencionada (📦 falta documentar)
#   phantom      → mencionada pero NO instalada (👻 declarada y removida/nunca instalada)
#
# Sólo emite libs que estén instaladas O mencionadas — ignora las irrelevantes.

set -u

target="${1:-$(pwd)}"
cd "$target" 2>/dev/null || { echo '{"error":"path not found"}'; exit 1; }

# === Diccionario de librerías opinables ===
# Formato: "paquete|regex-de-mención|categoría"
# El regex de mención se busca (case-insensitive) en el bloque skipper:stack.
LIBS=(
  # state
  "zustand|zustand|state"
  "@reduxjs/toolkit|redux|state"
  "jotai|jotai|state"
  "mobx|mobx|state"
  # data fetching
  "@tanstack/react-query|tanstack|react.?query|data-fetching"
  "swr|\\bswr\\b|data-fetching"
  # validation
  "zod|\\bzod\\b|validation"
  "yup|\\byup\\b|validation"
  "valibot|valibot|validation"
  # forms
  "react-hook-form|react.?hook.?form|forms"
  "formik|formik|forms"
  # styling
  "tailwindcss|tailwind|styling"
  "nativewind|nativewind|styling"
  "uniwind|uniwind|styling"
  "styled-components|styled.?components|styling"
  "@emotion/react|emotion|styling"
  # ui kit
  "heroui-native|heroui|ui-kit"
  "@heroui/react|heroui|ui-kit"
  "@radix-ui/react-dialog|radix|ui-kit"
  "@mui/material|\\bmui\\b|material.?ui|ui-kit"
  "@chakra-ui/react|chakra|ui-kit"
  "@gorhom/bottom-sheet|bottom.?sheet|ui-kit"
  "@shopify/flash-list|flash.?list|ui-kit"
  # animation
  "react-native-reanimated|reanimated|animation"
  "framer-motion|framer.?motion|\\bmotion\\b|animation"
  "react-native-gesture-handler|gesture.?handler|animation"
  # routing
  "react-router-dom|react.?router|routing"
  "expo-router|expo.?router|routing"
  "@react-navigation/native|react.?navigation|routing"
  # orm / db
  "drizzle-orm|drizzle|orm"
  "@prisma/client|prisma|orm"
  "typeorm|typeorm|orm"
  "kysely|kysely|orm"
  # backend frameworks
  "fastify|fastify|backend"
  "express|express|backend"
  "hono|\\bhono\\b|backend"
  # supabase
  "@supabase/supabase-js|supabase|backend"
  # auth
  "next-auth|next.?auth|auth.?js|auth"
  "@clerk/nextjs|clerk|auth"
  "@fastify/jwt|jwt|auth"
  # http client
  "axios|axios|http"
  "ky|\\bky\\b|http"
  # queue / jobs
  "pg-boss|pg.?boss|queue"
  "bullmq|bullmq|queue"
  # logging
  "pino|\\bpino\\b|logging"
  "winston|winston|logging"
  # payments
  "react-native-purchases|revenuecat|purchases|payments"
  "stripe|stripe|payments"
  # testing
  "vitest|vitest|testing"
  "jest|\\bjest\\b|testing"
)

# === Lee paquetes instalados desde package.json (deps + devDeps) ===
installed_list=""
if [[ -f package.json ]]; then
  installed_list=$(python3 - <<'PY' 2>/dev/null
import json, sys
try:
    d = json.load(open("package.json"))
except Exception:
    sys.exit(0)
pkgs = set()
for k in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
    pkgs.update((d.get(k) or {}).keys())
print("\n".join(sorted(pkgs)))
PY
)
fi

is_installed() {
  local pkg="$1"
  printf '%s\n' "$installed_list" | grep -qxF "$pkg"
}

# === Extrae el bloque skipper:stack de CLAUDE.md ===
has_block="false"
block=""
if [[ -f CLAUDE.md ]] && grep -q "<!-- skipper:stack -->" CLAUDE.md; then
  has_block="true"
  block=$(sed -n '/<!-- skipper:stack -->/,/<!-- \/skipper:stack -->/p' CLAUDE.md)
fi

is_mentioned() {
  local regex="$1"
  [[ -z "$block" ]] && return 1
  printf '%s\n' "$block" | grep -qiE "$regex"
}

# === Detecta el stack id del comentario generated-by ===
stack=$(printf '%s\n' "$block" | grep -oE 'stack: [a-z0-9-]+' | head -1 | sed 's/stack: //')
[[ -z "$stack" ]] && stack="unknown"

# === Construye filas ===
rows=()
c_ok=0; c_undoc=0; c_phantom=0
for entry in "${LIBS[@]}"; do
  pkg="${entry%%|*}"
  rest="${entry#*|}"
  regex="${rest%|*}"
  cat="${rest##*|}"

  inst="false"; ment="false"
  is_installed "$pkg" && inst="true"
  is_mentioned "$regex" && ment="true"

  # Ignora libs que ni están instaladas ni mencionadas
  [[ "$inst" == "false" && "$ment" == "false" ]] && continue

  status="ok"
  if [[ "$inst" == "true" && "$ment" == "false" ]]; then
    status="undocumented"; c_undoc=$((c_undoc + 1))
  elif [[ "$inst" == "false" && "$ment" == "true" ]]; then
    status="phantom"; c_phantom=$((c_phantom + 1))
  else
    c_ok=$((c_ok + 1))
  fi

  rows+=("{\"package\":\"$pkg\",\"category\":\"$cat\",\"installed\":$inst,\"mentioned\":$ment,\"status\":\"$status\"}")
done

libs_json=$(IFS=,; echo "${rows[*]:-}")

cat <<EOF
{
  "stack": "${stack}",
  "has_block": ${has_block},
  "package_json": $([[ -f package.json ]] && echo true || echo false),
  "libs": [${libs_json}],
  "counts": { "ok": ${c_ok}, "undocumented": ${c_undoc}, "phantom": ${c_phantom} }
}
EOF
