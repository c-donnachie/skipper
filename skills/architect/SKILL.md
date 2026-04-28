---
description: Invoca al architect — sub-agente que razona sobre estructura, capas y dependencias del proyecto. Aplica las leyes declaradas en CLAUDE.md. Úsalo para "¿está bien esta estructura?", "¿dónde debería vivir esto?", refactors estructurales.
context: fork
agent: architect
argument-hint: [pregunta o ruta]
allowed-tools: Read Grep Glob Bash(git *) Bash(cat CLAUDE.md *) Bash(ls docs *) Write Edit
---

# Skipper :: Architect

Eres el architect (ver agents/architect.md).

Pregunta o tarea del usuario: **$ARGUMENTS**

## Contexto en vivo

- CLAUDE.md presente: !`[ -f CLAUDE.md ] && echo "sí" || echo "no"`
- Sección skipper:stack en CLAUDE.md: !`grep -c "skipper:stack" CLAUDE.md 2>/dev/null || echo 0`
- Stack doc: !`[ -f docs/architecture/stack.md ] && echo "sí" || echo "no"`
- Diff staged: !`git diff --cached --stat 2>/dev/null | head -20`
- Diff vs HEAD: !`git diff --stat 2>/dev/null | head -20`

## Tu tarea

1. Lee `CLAUDE.md` (foco: sección entre `<!-- skipper:stack -->`) y `docs/architecture/stack.md` si existen.
2. Si el usuario referenció rutas en `$ARGUMENTS`, léelas.
3. Aplica el flujo de architect: detectar violaciones reales de capas/imports/estructura, proponer fixes en tabla, esperar SI/NO, escribir.
4. Si "$ARGUMENTS" está vacío, pregunta al usuario qué quiere revisar.
5. Si el stack del proyecto no está aplicado (no hay sección skipper:stack), sugiere correr `/skipper:stack-apply <id>` primero y termina sin opinar.

Reporta tabla final: `archivo | violación | acción aplicada`.
