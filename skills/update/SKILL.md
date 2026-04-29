---
description: Reviews recent changes (git diff/log) and proposes updates to docs/ — ADRs, PRDs, plans, architecture, business. Use when the user says "update docs", "document this", or after a large feature.
context: fork
agent: kowalski
allowed-tools: Read Grep Glob Bash(git *) Bash(ls *) Bash(find docs *) Bash(printf *) Bash(mkdir *) Write Edit
---

# Update docs (corre en subagent kowalski aislado)

Este skill se ejecuta en un subagent aislado (`context: fork` + `agent: kowalski`). El análisis no contamina la conversación principal — sólo regresa el reporte final.

## Contexto en vivo (preprocesado antes del subagent)

- Branch: !`git branch --show-current 2>/dev/null || echo "(no git repo)"`
- Estado: !`git status --short 2>/dev/null | head -30`
- Commits recientes: !`git log -10 --oneline 2>/dev/null`
- Diff de código vs origin/main: !`git diff origin/main..HEAD -- src/ app/ lib/ packages/ 2>/dev/null | head -300 || echo "(no hay diff)"`
- ADRs existentes: !`ls docs/decisions/ 2>/dev/null || echo "(no existe carpeta)"`
- PRDs existentes: !`ls docs/prds/ 2>/dev/null || echo "(no existe carpeta)"`
- Planes existentes: !`ls docs/plans/ 2>/dev/null || echo "(no existe carpeta)"`

## Tu tarea

Eres Kowalski, el analista. Analiza los cambios y mantén `docs/` actualizado.

Identifica qué tipo de doc corresponde a cada cambio reciente:

| Tipo de cambio | Doc resultante |
|---|---|
| Decisión arquitectónica con tradeoffs (lib, patrón, integración, deprecación) | `docs/decisions/NNNN-titulo.md` (ADR) |
| Feature nuevo de scope > 1 día | `docs/prds/NNNN-titulo.md` (PRD) |
| Trabajo de varias sesiones que necesita persistir | `docs/plans/NNNN-titulo.md` |
| Subsistema técnico nuevo o refactor grande | `docs/architecture/dominio.md` |
| Regla de negocio (precio, onboarding, defaults, security, brand) | `docs/business/tema.md` |

## Flujo (en este subagent)

1. Lee el contexto en vivo (arriba) y los archivos `docs/` relevantes para entender la estructura actual.
2. Para cada cambio significativo, clasifica el tipo de doc.
3. Si la carpeta no existe: créala (`mkdir -p docs/<dir>`).
4. Si el doc no existe: léelo del template en `${CLAUDE_SKILL_DIR}/templates/<tipo>.md` y rellena `{{NUMBER}}`, `{{TITLE}}`, `{{DATE}}`, `{{AUTHOR}}`.
5. Numeración 4 dígitos secuencial: `printf "%04d" $(($(ls docs/<dir> 2>/dev/null | grep -cE '^[0-9]{4}-') + 1))`.
6. Slug del título: minúsculas, guiones, sin acentos.
7. **Escribe los docs directamente** (no pidas confirmación — estás en subagent aislado, sin acceso al usuario).
8. Actualiza índices: `docs/index.md` (TOC global) y `docs/<dir>/README.md` (por tipo).

## Reglas duras (sé conservador)

- **NUNCA** documentes typos, fixes triviales, cambios de estilo, refactors menores.
- ADR sólo para decisiones con tradeoffs reales que apliquen >1 vez en el proyecto.
- PRD antes de implementar, no después (si ya está hecho, mejor architecture doc).
- Mantén cada doc bajo 200 líneas. Material denso → archivos auxiliares al lado.
- Idioma: detéctalo de `CLAUDE.md` o docs existentes. Default español si el repo es ES.
- **Si dudas, NO escribas.** Es preferible reportar "sin cambios documentables" a generar spam.
- Para docs nuevos: deja secciones de contenido vacías o con placeholders — el usuario los rellena después. Tu trabajo es crear el esqueleto correcto.

## Reporte final (lo único que regresa al chat principal)

Tabla de lo que hiciste:

| Tipo | Path | Acción | Razón |
|---|---|---|---|
| ADR | docs/decisions/0005-libreria-X.md | creado | Decisión con tradeoffs (X vs Y) |
| business | docs/business/pricing.md | actualizado | Precio cambió de A a B |

Si no hubo nada documentable: reporta "sin cambios significativos detectados" y termina.
