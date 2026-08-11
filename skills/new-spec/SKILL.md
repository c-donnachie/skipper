---
description: Creates a new numbered SPEC in docs/specs/ — the living, verifiable anchor for spec-anchored SDD (ADR-0024). Takes the title as argument.
argument-hint: [SPEC title]
allowed-tools: Read Write Edit Bash(ls *) Bash(mkdir *) Bash(date *) Bash(printf *) Bash(git config *)
---

# Nuevo SPEC

Crea un SPEC nuevo con título "$ARGUMENTS". Un SPEC es el **ancla vivo** contra el que
se verifica el trabajo del agente (ADR-0024): mutable, con criterios de aceptación
verificables e ID estable.

## Pasos

1. `mkdir -p docs/specs`
2. Calcula el siguiente número:
   ```bash
   printf "%04d" $(($(ls docs/specs/ 2>/dev/null | grep -cE '^[0-9]{4}-') + 1))
   ```
3. Genera slug del título: minúsculas, guiones en vez de espacios, sin acentos (ñ→n, á→a, etc).
4. Lee el template: `${CLAUDE_SKILL_DIR}/../update/templates/spec.md`.
5. Sustituye:
   - `{{NUMBER}}` → número de 4 dígitos
   - `{{TITLE}}` → "$ARGUMENTS"
   - `{{DATE}}` → `date +%Y-%m-%d`
6. **Pobla lo que sepas**: Intent, y al menos 1-2 Acceptance criteria concretos con su
   método (`test|type|static|manual|memory|human`). Si conocés el PRD/ADR que lo motiva,
   completá `Implements`. Deja criterios adicionales como plantilla para que el usuario los complete.
7. Escribe `docs/specs/NNNN-slug.md`.
8. Si existe `docs/specs/README.md`, agrega entrada al índice. Si no, créalo con cabecera + el primer item.
9. Reporta el path y recordá que el gate (`/skipper:review`) contrastará el diff contra estos criterios.

## Reglas

- **Vivo, no inmutable** (a diferencia del ADR): Status arranca **Draft** → `Active` cuando el
  usuario lo ratifica. El contenido evoluciona; el **ID (`SPEC-NNNN#AC-k`) es el ancla** y persiste.
- **Cada Acceptance criterion debe ser verificable** y declarar método. Un criterio vago no sirve
  al gate — si no sabés cómo verificarlo, es `manual` con artefacto (PRD-0006 Q2), no "queda lindo".
- **No dupliques el DoD de proyecto**: los ítems globales viven en `skipper.config.json` (M8);
  el SPEC agrega/pisa criterios *específicos* de este requisito.
- Si esto **reemplaza** un SPEC previo, marcá el viejo `Superseded by SPEC-NNNN` y enlazá ambos.
- Si "$ARGUMENTS" está vacío, pregunta al usuario por el título antes de crear nada.
