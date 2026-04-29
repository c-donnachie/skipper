---
description: Detects the current project stack (React Vite, Next.js, Expo, Supabase, Node API, Python FastAPI). Reports candidate, confidence and signals. Does NOT write — analysis only. Use when the user asks "what stack do I have?", "detect my stack", or before applying a profile.
allowed-tools: Bash(${CLAUDE_PLUGIN_ROOT}/lib/detect.sh *) Read
---

# Detectar stack del proyecto

## Reporte automático
!`bash "${CLAUDE_PLUGIN_ROOT}/lib/detect.sh" "$(pwd)"`

## Tu tarea

Acabas de recibir el output JSON del detector. Tu trabajo:

1. **Parsea el JSON** (mentalmente — el output ya está arriba).
2. **Reporta al usuario** en formato amigable:
   - Stack detectado (si hay)
   - Nivel de confianza (high / medium / low / none)
   - Si es ambiguo, lista los frontends competidores

3. **Recomienda siguiente paso**:
   - Si `confidence: high` y NO ambiguo → "Listo para aplicar con `/skipper:stack:apply <stack>`"
   - Si `confidence: medium|low` → "Detección poco clara. Confirma con el usuario antes de aplicar."
   - Si `confidence: none` → "No detecté stack soportado. Stacks v0.2: react-vite-supabase, react-vite-node, nextjs-fullstack, nextjs-supabase, expo-supabase, expo-node, node-api, python-fastapi."
   - Si `ambiguous: true` → "Hay múltiples frontends. Pregúntale al usuario cuál es el principal antes de aplicar."

4. **NO escribas archivos** — eres sólo análisis.

## Stacks soportados v0.2

| ID | Stack | Detección |
|---|---|---|
| `react-vite-supabase` | React + Vite + Supabase | vite.config + react + @supabase/supabase-js |
| `react-vite-node` | React + Vite + Node API | vite.config + react + (no supabase) |
| `nextjs-fullstack` | Next.js full-stack | next.config + next + app router |
| `nextjs-supabase` | Next.js + Supabase | next + @supabase/supabase-js |
| `expo-supabase` | RN Expo + Supabase | app.json+expo + @supabase/supabase-js |
| `expo-node` | RN Expo + Node API | app.json+expo + (no supabase) |
| `node-api` | Node API standalone | fastify/express/hono (sin frontend) |
| `python-fastapi` | Python FastAPI | pyproject + fastapi |

## Output esperado (ejemplo)

```
🐧 Stack detectado: expo-supabase (confianza: high)

Señales:
- ✅ app.json con expo
- ✅ react-native dep
- ✅ @supabase/supabase-js
- ✅ supabase/ folder

Siguiente paso: /skipper:stack:apply expo-supabase
```
