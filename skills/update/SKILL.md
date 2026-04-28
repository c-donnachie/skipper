---
description: Revisa cambios recientes (git diff/log) y propone updates a docs/ — ADRs, PRDs, planes, architecture, business. Úsalo cuando el usuario diga "actualiza docs", "documenta esto", o después de un feature grande.
allowed-tools: Read Grep Glob Bash(git *) Bash(ls *) Bash(find docs *) Bash(printf *) Write Edit
---

# Update docs

## Contexto en vivo (preprocesado antes de tu turno)

- Branch: !`git branch --show-current 2>/dev/null || echo "(no git repo)"`
- Estado: !`git status --short 2>/dev/null | head -30`
- Commits recientes: !`git log -10 --oneline 2>/dev/null`
- Diff de código vs origin/main: !`git diff origin/main..HEAD -- src/ app/ lib/ packages/ 2>/dev/null | head -300 || echo "(no hay diff)"`
- ADRs existentes: !`ls docs/decisions/ 2>/dev/null || echo "(no existe carpeta)"`
- PRDs existentes: !`ls docs/prds/ 2>/dev/null || echo "(no existe carpeta)"`
- Planes existentes: !`ls docs/plans/ 2>/dev/null || echo "(no existe carpeta)"`

## Tu tarea

Identifica qué tipo de doc corresponde a cada cambio reciente:

| Tipo de cambio | Doc resultante |
|---|---|
| Decisión arquitectónica con tradeoffs (lib, patrón, integración, deprecación) | `docs/decisions/NNNN-titulo.md` (ADR) |
| Feature nuevo de scope > 1 día | `docs/prds/NNNN-titulo.md` (PRD) |
| Trabajo de varias sesiones que necesita persistir | `docs/plans/NNNN-titulo.md` |
| Subsistema técnico nuevo o refactor grande | `docs/architecture/dominio.md` |
| Regla de negocio (precio, onboarding, defaults, security, brand) | `docs/business/tema.md` |

## Flujo

1. Lee el contexto en vivo (arriba) y los archivos relevantes.
2. Para cada cambio significativo, clasifica el tipo y propón doc.
3. Si la carpeta no existe: créala (`mkdir -p docs/<dir>`).
4. Si el doc no existe: usa el template en `${CLAUDE_SKILL_DIR}/templates/<tipo>.md`.
5. Numeración 4 dígitos secuencial: `printf "%04d" $(($(ls docs/<dir> 2>/dev/null | grep -cE '^[0-9]{4}-') + 1))`.
6. Slug del título: minúsculas, guiones, sin acentos.
7. Actualiza `docs/index.md` (TOC global) y `docs/<dir>/README.md` (índice por tipo) con los nuevos enlaces.

## Reglas duras

- **NUNCA** documentes typos, fixes triviales, cambios de estilo, refactors menores.
- ADR sólo para decisiones con tradeoffs reales que apliquen >1 vez en el proyecto.
- PRD antes de implementar, no después (si ya está hecho, mejor architecture doc).
- Mantén cada doc bajo 200 líneas. Material denso → archivos auxiliares al lado.
- Idioma: detéctalo de `CLAUDE.md` o docs existentes. Default español si el repo es ES.

## Reporte

Antes de escribir, muestra una tabla:

| Tipo | Path | Acción | Razón |
|---|---|---|---|
| ADR | docs/decisions/0003-fintoc-aggregation.md | crear | Integración con tradeoffs (10 UF/mes vs scraping) |
| business | docs/business/pricing.md | actualizar | Precio cambió de 10 UF a $2.990 |

Espera confirmación del usuario antes de escribir. Si confirma, escribe los archivos y reporta lo que hiciste.
