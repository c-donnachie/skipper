---
description: Creates a new numbered ADR in docs/decisions/ with the standard format. Takes the title as argument.
argument-hint: [ADR title]
allowed-tools: Read Write Edit Bash(ls *) Bash(mkdir *) Bash(date *) Bash(printf *) Bash(git config *)
---

# Nuevo ADR

Crea un ADR nuevo con título "$ARGUMENTS".

## Pasos

1. `mkdir -p docs/decisions`
2. Calcula el siguiente número:
   ```bash
   printf "%04d" $(($(ls docs/decisions/ 2>/dev/null | grep -cE '^[0-9]{4}-') + 1))
   ```
3. Genera slug del título: minúsculas, guiones en vez de espacios, sin acentos (ñ→n, á→a, etc).
4. Lee el template: `${CLAUDE_SKILL_DIR}/../update/templates/adr.md`.
5. Sustituye:
   - `{{NUMBER}}` → número de 4 dígitos
   - `{{TITLE}}` → "$ARGUMENTS"
   - `{{DATE}}` → `date +%Y-%m-%d`
   - `{{AUTHOR}}` → `git config user.name 2>/dev/null || echo "TODO"`
6. Escribe `docs/decisions/NNNN-slug.md` con el contenido sustituido.
7. Si existe `docs/decisions/README.md`, agrega entrada al índice. Si no, créalo con cabecera + el primer item.
8. Reporta el path del archivo creado.

## Reglas

- Status siempre arranca como **Proposed**. Ciclo de vida: `Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN`.
- Deja Decision/Consequences/Confirmation vacíos para que el usuario los complete; sí intenta poblar "Context and problem statement" y "Decision drivers" con lo que sepas.
- **Inmutabilidad**: un ADR Accepted no se reescribe. Si esto reemplaza una decisión previa, NO crees un ADR suelto — usa `/skipper:supersede-adr <número-viejo> "título"` para enlazar ambos.
- Si "$ARGUMENTS" está vacío, pregunta al usuario por el título antes de crear nada.
