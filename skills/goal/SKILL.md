---
description: "Memory-aware grilling to lock the objective before building. Consults the project's existing decisions (ADRs/PRDs) FIRST, then asks only the genuinely-open clarifying questions, and states an explicit goal + acceptance criteria grounded in those decisions. Use before implementing anything non-trivial, or whenever the request is fuzzy."
argument-hint: "[what you want to build]"
allowed-tools: Read Grep Glob Bash
---

# Objetivo claro antes de construir (grilling con memoria)

Antes de implementar "$ARGUMENTS", clavá el **objetivo**. Tu ventaja sobre un grilling genérico: skipper ya indexa las decisiones del proyecto, así que **consultá la memoria primero y preguntá sólo lo que falta**. Un objetivo nítido > más código.

## Pasos

1. **La memoria primero.** Para "$ARGUMENTS", recuperá lo que el proyecto YA decidió: corré `skipper ask "<tema>"` y `skipper context <path relevante>` (o las tools `mcp__skipper-memory__ask` / `context_for` si están disponibles). Anotá las ADRs, constraints y decisiones que aplican. **No le preguntes al usuario nada que la memoria ya respondió** — eso es lo que te diferencia.

2. **Grillá los huecos (no lo decidido).** Preguntas afiladas SÓLO sobre lo que la memoria no cubre:
   - **Alcance** — qué entra y, sobre todo, qué NO (no-goals).
   - **Éxito** — ¿cómo sabemos que quedó bien? criterios de aceptación concretos y verificables.
   - **Restricciones** — límites técnicos / de negocio / de tiempo; qué NO se puede romper.
   - **Casos borde y riesgos** — qué puede salir mal.
   Seguí preguntando hasta que no quede ambigüedad que cambie la implementación. Una pregunta a la vez si es complejo; en bloque si son simples.

3. **Enunciá el OBJETIVO explícito** y confirmá con el usuario antes de codear:
   - **Objetivo** (1-2 frases): qué se logra y por qué.
   - **Criterios de aceptación** (bullets verificables).
   - **Restricciones / decisiones que aplican** (citá las ADRs que trajo la memoria).
   - **Fuera de alcance** (no-goals).

4. **Opcional** — si la decisión tiene tradeoffs reales, registrala con `/skipper:decide`. Si es trabajo multi-sesión, dejá un plan con `/skipper:new-plan`.

## Reglas

- **Memoria primero, preguntas después.** Repreguntar lo ya decidido es exactamente lo que NO hacemos.
- No empieces a codear con un objetivo difuso.
- Si "$ARGUMENTS" está vacío, preguntá qué se quiere construir antes de seguir.
