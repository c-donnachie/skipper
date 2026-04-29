#!/usr/bin/env bash
# skipper test-detect.sh — corre detect.sh contra cada fixture y verifica
# que detecta el stack correcto. Devuelve exit 0 si todos pasan, 1 si alguno falla.
# Compatible con bash 3.2+ (macOS default).

set -u

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
plugin_root="$(dirname "$script_dir")"
detect="$script_dir/detect.sh"
fixtures="$plugin_root/examples/fixtures"

# Casos esperados: "fixture|expected_stack"
cases=(
  "react-vite-supabase|react-vite-supabase"
  "react-vite-node|react-vite-node"
  "nextjs-fullstack|nextjs-fullstack"
  "nextjs-supabase|nextjs-supabase"
  "expo-supabase|expo-supabase"
  "expo-node|expo-node"
  "node-api|node-api"
  "python-fastapi|python-fastapi"
)

passed=0
failed=0
total=0

for case_line in "${cases[@]}"; do
  total=$((total + 1))
  fixture="${case_line%%|*}"
  expected_stack="${case_line##*|}"
  fixture_path="$fixtures/$fixture"

  if [[ ! -d "$fixture_path" ]]; then
    echo "✗ $fixture (fixture dir missing: $fixture_path)"
    failed=$((failed + 1))
    continue
  fi

  output=$("$detect" "$fixture_path" 2>/dev/null)

  detected=$(echo "$output" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    detected = d.get('detected', [])
    print(detected[0] if detected else '(none)')
except Exception as e:
    print(f'(error: {e})')
")

  if [[ "$detected" == "$expected_stack" ]]; then
    echo "✓ $fixture → $detected"
    passed=$((passed + 1))
  else
    echo "✗ $fixture → expected '$expected_stack', got '$detected'"
    failed=$((failed + 1))
  fi
done

echo ""
echo "$total fixtures, $passed passed, $failed failed."

if [[ $failed -gt 0 ]]; then
  exit 1
fi
exit 0
