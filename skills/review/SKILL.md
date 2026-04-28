---
description: Revisa el diff actual (vs origin/main) usando el especialista del stack del proyecto. El capitán Skipper analiza el diff y enruta al especialista correcto. Detecta violaciones de las leyes del CLAUDE.md y anti-patterns específicos del stack. Úsalo antes de commit/PR.
context: fork
agent: skipper
argument-hint: [opcional: rama base, default origin/main]
allowed-tools: Read Grep Glob Bash(git *) Bash(cat CLAUDE.md *)
---

# Skipper :: Review

Tu tarea: identificar el especialista correcto del stack y delegar la revisión del diff.

## Contexto a evaluar

- Base branch: `${ARGUMENTS:-origin/main}`
- Stack en CLAUDE.md: !`grep -A 2 "skipper:stack" CLAUDE.md 2>/dev/null | grep -iE "(react-vite|nextjs|expo|node-api|python-fastapi)" | head -1`
- Files cambiados: !`git diff --name-only ${ARGUMENTS:-origin/main}..HEAD 2>/dev/null | head -20 || git diff --name-only HEAD 2>/dev/null | head -20`
- Stats: !`git diff --stat ${ARGUMENTS:-origin/main}..HEAD 2>/dev/null | tail -5 || git diff --stat HEAD 2>/dev/null | tail -5`

## Tu tarea: enrutar review al especialista del stack

Detecta el stack del proyecto leyendo CLAUDE.md (sección skipper:stack):

| Stack detectado | Skill a invocar |
|---|---|
| `react-vite-*` | `/skipper:react-vite "review del diff actual vs ${ARGUMENTS:-origin/main}"` |
| `expo-*` | `/skipper:react-native "review del diff actual vs ${ARGUMENTS:-origin/main}"` |
| `nextjs-*` | `/skipper:nextjs "review del diff actual vs ${ARGUMENTS:-origin/main}"` |
| `node-api` | `/skipper:node-backend "review del diff actual vs ${ARGUMENTS:-origin/main}"` |
| `python-fastapi` | (sin especialista aún) → usar `/skipper:architect` |

Si hay archivos `.sql` o `supabase/migrations/**` en el diff, sugiere TAMBIÉN `/skipper:supabase` para revisar policies/migraciones.

## Output

NO hagas el review tú mismo — sólo enruta. Dile al usuario:

```
🐧 Stack detectado: <stack>
Para revisar este diff, te recomiendo:

/skipper:<especialista> "review del diff actual"

Razón: archivos cambiados son del dominio <X>.
```

Si hay múltiples dominios (ej. cambios en frontend + backend + migraciones), lista los 2-3 reviews recomendados separados.

NO escribas código. Sólo enrutamiento.
