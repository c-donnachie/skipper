---
description: Crea un nuevo PRD numerado en docs/prds/ con formato estándar. Recibe el título como argumento.
argument-hint: [título del PRD]
allowed-tools: Read Write Edit Bash(ls *) Bash(mkdir *) Bash(date *) Bash(printf *) Bash(git config *)
---

# Nuevo PRD

Crea un PRD nuevo con título "$ARGUMENTS".

## Pasos

1. `mkdir -p docs/prds`
2. Siguiente número:
   ```bash
   printf "%04d" $(($(ls docs/prds/ 2>/dev/null | grep -cE '^[0-9]{4}-') + 1))
   ```
3. Slug del título.
4. Lee template: `${CLAUDE_SKILL_DIR}/../update/templates/prd.md`.
5. Sustituye `{{NUMBER}}`, `{{TITLE}}`, `{{DATE}}`, `{{AUTHOR}}`.
6. Escribe `docs/prds/NNNN-slug.md`.
7. Actualiza/crea `docs/prds/README.md` con el índice.
8. Reporta el path.

## Reglas

- Status arranca como "Draft".
- Si "$ARGUMENTS" está vacío, pide el título primero.
- Después de crearlo, sugiere al usuario llenar Problem, Users, Goals.
