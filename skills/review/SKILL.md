---
description: Reviews the current diff (vs origin/main) using the project's stack specialist. Captain Skipper analyzes the diff and routes to the right specialist. Detects CLAUDE.md violations and stack-specific anti-patterns. Use before commit/PR.
context: fork
agent: skipper
argument-hint: [optional: base branch, default origin/main]
allowed-tools: Read Grep Glob Bash(git *) Bash(cat CLAUDE.md *) Bash(skipper *) Bash(ls docs/specs/*)
---

# Skipper :: Review

Tu tarea: identificar el especialista correcto del stack y delegar la revisión del diff.

## Contexto a evaluar

- Base branch: `${ARGUMENTS:-origin/main}`
- Stack en CLAUDE.md: !`grep -A 2 "skipper:stack" CLAUDE.md 2>/dev/null | grep -iE "(react-vite|nextjs|expo|node-api|python-fastapi)" | head -1`
- Files cambiados: !`git diff --name-only ${ARGUMENTS:-origin/main}..HEAD 2>/dev/null | head -20 || git diff --name-only HEAD 2>/dev/null | head -20`
- Stats: !`git diff --stat ${ARGUMENTS:-origin/main}..HEAD 2>/dev/null | tail -5 || git diff --stat HEAD 2>/dev/null | tail -5`
- SPECs del proyecto: !`ls docs/specs/*.md 2>/dev/null | grep -vE 'README' | sed 's#docs/specs/##' || echo "(sin SPECs — /skipper:new-spec)"`

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

## Review anclado a SPEC (ADR-0024 / PRD-0006 M2)

Si el proyecto tiene SPECs (`docs/specs/*.md`), el review NO es genérico — se **ancla a los criterios de aceptación**:

1. Para cada SPEC cuyos archivos/`Touched code` se solapan con el diff, leé su tabla de **Acceptance criteria**.
2. Contrastá el diff contra **cada criterio** y reportá por ID: `ok` o **`divergence: SPEC-NNNN#AC-k`** con la razón concreta.
3. **Severidad** (patrón agent-harness): una divergence *major* **bloquea** (gate duro, ADR-0024); *minor* vuelve como recomendación.

   **Profundidad del review por riesgo** (S2, determinista — corré `skipper gate risk`):
   | Tier | Ceremonia |
   |---|---|
   | `low` (poco cambio, docs/tests/estilos) | readback estructural, **silencioso**, 0 lentes |
   | `standard` | **1 lente de foco** + consentimiento |
   | `high` (path sensible: auth/pagos/migraciones, o churn grande) | **4R — Risk · Readability · Reliability · Resilience** + consentimiento + forecast |

   No sobre-ceremonies un cambio `low`; no dejes pasar un `high` con una sola mirada.
4. Los criterios con método `test|type|static` se **verifican corriendo** — no los evalúes de memoria; disparalos con el gate:

   ```bash
   skipper gate freeze     # corre la evidencia del DoD + emite el receipt content-bound (ADR-0025)
   ```

   El gate reporta `pass|warn|blocked`. Si `blocked`, NO se emite receipt → no hay entrega. `unverified` se reporta con honestidad (nunca verde).
   Para criterios `manual`/`human`, adjuntá el artefacto (correr la app y observar — usá `/verify`): `skipper gate freeze --artifact=<AC-id>=<ruta>`.
5. Si no hay engine/`skipper` disponible (opt-in, ADR-0017), hacé el review anclado igual (a mano) y avisá que el receipt no se pudo emitir → el delivery gate reportará `unmanaged`.

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
