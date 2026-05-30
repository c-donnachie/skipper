---
description: Diagnoses the health of docs/ — stale docs (code moved while the doc didn't), stub ADRs/PRDs/plans with unfilled template placeholders, broken intra-doc links, and empty folders. Read-only, reports a severity table. Use periodically or before a release.
allowed-tools: Bash(${CLAUDE_PLUGIN_ROOT}/lib/docs-doctor.sh *) Read
---

# Skipper :: docs-doctor

Diagnosticar la salud de la documentación: ¿sigue el ritmo del código, o quedó atrás?

## Reporte automático
!`bash "${CLAUDE_PLUGIN_ROOT}/lib/docs-doctor.sh" "$(pwd)"`

## Tu tarea

Acabas de recibir el JSON del diagnóstico. Interprétalo con juicio y arma una tabla por severidad.

### 1. Validación previa

- Si `has_docs: false` → "No hay carpeta `docs/`. Corre `/skipper:init-structure` primero." y termina.
- Si los 5 contadores (`stubs`, `stale`, `broken_links`, `empty_dirs`, `adr_issues`) son 0 → "✅ docs/ saludable. Cero hallazgos." y termina.

### 2. Tabla de hallazgos

Mapea cada hallazgo a una severidad y arma UNA tabla ordenada por severidad:

| Severidad | Tipo | Doc | Detalle | Acción sugerida |
|---|---|---|---|---|
| 🔴 high | stale | docs/architecture/auth-session.md | 892 commits de código desde el último toque (39d) | `/skipper:update` o revisar a mano |
| 🔴 high | stub | docs/prds/0001-*.md | placeholder del template sin rellenar | rellenar o borrar |
| 🟡 medium | broken-link | docs/decisions/0007-*.md | link a `../../.claude/...` no resuelve | corregir o quitar el link |
| 🟢 low | thin | docs/decisions/0004-*.md | 55 palabras — verifica si está completo | confirmar que no es un stub |
| 🟢 low | empty-dir | docs/legal | sólo README, sin contenido | poblar o quitar la carpeta |
| 🔴 high | adr: broken-supersede | docs/decisions/0007-*.md | referencia ADR-0099 que no existe | corregir el link de supersede |
| 🟡 medium | adr: stuck-proposed | docs/decisions/0003-*.md | Proposed hace 40d — ratificar o rechazar | mover a Accepted/Rejected |
| 🟡 medium | adr: missing-status | docs/decisions/0009-*.md | el ADR no declara Status | agregar línea Status |

Reglas de severidad (calíbralas con criterio, no son rígidas):

- **stale** → `code_commits_since` define la urgencia:
  - ≥ 300 commits → 🔴 high (el doc describe algo que ya cambió mucho)
  - 100–299 → 🟡 medium
  - 12–99 → 🟢 low
  No asumas que stale = incorrecto; es "candidato a revisión". Dilo así.
- **stub** con `kind: placeholder` → 🔴 high (template sin rellenar, es ruido que aparenta señal).
- **stub** con `kind: thin` → 🟢 low (puede ser un ADR legítimamente conciso — pídele al usuario que confirme, no afirmes que está incompleto).
- **broken_links** → 🟡 medium (links relativos que no resuelven; los externos/URIs ya se filtraron).
- **empty_dirs** → 🟢 low.
- **adr_issues** (`issue`):
  - `broken-supersede` → 🔴 high (la cadena de decisiones está rota; un Supersedes/Superseded-by apunta a la nada).
  - `missing-status` → 🟡 medium (todo ADR debe declarar Status del ciclo de vida).
  - `stuck-proposed` → 🟡 medium (decisión nunca ratificada; sugiere mover a Accepted/Rejected, o `/skipper:supersede-adr` si fue reemplazada).

### 3. Resumen y siguiente paso

```
🐧 docs-doctor:
  🔴 high: N   🟡 medium: N   🟢 low: N

Lo más urgente:
  - <el peor stale> → corre /skipper:update para sincronizar
  - <stubs placeholder> → rellenar o borrar

Siguiente paso:
  /skipper:update            → sincroniza docs con los cambios de código recientes
  /skipper:new-adr "..."     → si un stale revela una decisión no documentada
```

## Reglas duras

- **Read-only.** docs-doctor sólo diagnostica. Para arreglar staleness deriva a `/skipper:update`; para stubs, el usuario decide rellenar o borrar.
- Sé honesto con la incertidumbre: staleness es una *señal* (código se movió), no una prueba de que el doc esté mal. Un doc de un subsistema estable puede tener muchos commits "cerca" sin estar desactualizado.
- No infles severidades. Si todo es 🟢, dilo y no dramatices.
- Para `thin`, nunca afirmes "está incompleto" — di "verifica si está completo".
