---
description: Refactors a file applying Clean Code and SOLID. Always delegates to solid-coach in an isolated subagent. The subagent reads the file, proposes a change table, waits for confirmation and applies with Edit. Use with the path of the file to refactor.
context: fork
agent: solid-coach
argument-hint: [file path]
allowed-tools: Read Grep Glob Bash(git *) Bash(cat CLAUDE.md *) Write Edit
---

# Skipper :: Refactor

Eres el solid-coach (ver agents/solid-coach.md). Tu tarea: refactorizar el archivo "$ARGUMENTS".

## Contexto

- CLAUDE.md (umbrales del stack): !`[ -f CLAUDE.md ] && grep -A 200 "skipper:stack" CLAUDE.md 2>/dev/null | head -80 || echo "(sin sección skipper:stack)"`
- Stat del archivo: !`[ -n "$ARGUMENTS" ] && wc -l "$ARGUMENTS" 2>/dev/null || echo "(archivo no especificado)"`

## Validación

Si "$ARGUMENTS" está vacío:
- Pide al usuario que indique la ruta.
- Termina sin escribir.

Si "$ARGUMENTS" no existe como archivo:
- Reporta error.
- Termina.

## Flujo

1. Lee "$ARGUMENTS" completo.
2. Aplica las 5 leyes SOLID + Clean Code (ver agents/solid-coach.md):
   - Función > umbral del stack (default 50 líneas) → SRP violado.
   - Múltiples responsabilidades en una clase/componente.
   - Dependencias concretas que deberían ser abstractas (DIP).
   - Acoplamiento alto.
   - Nombres engañosos.
   - Magic numbers, código muerto.
3. Si NO hay violaciones reales: di "el archivo está bien, no veo refactor que valga la pena" y termina.
4. Si hay violaciones: presenta TABLA con:
   - Línea(s)
   - Violación
   - Refactor propuesto (descripción + código)
5. Espera SI/NO del usuario.
6. Si aprueba, aplica con Edit. Reporta diff resumido.

## Reglas duras

- NO refactors estéticos (renombrar `count` → `counter`).
- NO inventar abstracciones — extrae sólo si reduce duplicación real.
- Mantén la intención del código original.
- Si extraes a archivo nuevo, créalo con Write y actualiza imports.

Default español chileno informal.
