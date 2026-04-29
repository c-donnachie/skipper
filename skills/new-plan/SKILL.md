---
description: Creates a new numbered implementation plan in docs/plans/ with the standard format. Takes the title as argument.
argument-hint: [plan title]
allowed-tools: Read Write Edit Bash(ls *) Bash(mkdir *) Bash(date *) Bash(printf *)
---

# Nuevo plan

Crea un plan nuevo con título "$ARGUMENTS".

## Pasos

1. `mkdir -p docs/plans`
2. Siguiente número:
   ```bash
   printf "%04d" $(($(ls docs/plans/ 2>/dev/null | grep -cE '^[0-9]{4}-') + 1))
   ```
3. Slug del título.
4. Lee template: `${CLAUDE_SKILL_DIR}/../update/templates/plan.md`.
5. Sustituye `{{NUMBER}}`, `{{TITLE}}`, `{{DATE}}`.
6. Escribe `docs/plans/NNNN-slug.md`.
7. Actualiza/crea `docs/plans/README.md` con el índice (separa Active/Done/Abandoned).
8. Reporta el path.

## Reglas

- Status arranca como "Active".
- Si existe un PRD relacionado, sugiere al usuario que linkee desde el plan.
- Si "$ARGUMENTS" está vacío, pide el título primero.
