---
description: Valida que el código del proyecto sigue las leyes declaradas en CLAUDE.md (estructura, naming, anti-patterns). Reporta tabla de violaciones por severidad. Delega al agent architect en context fork. Úsalo periódicamente o antes de PRs grandes.
context: fork
agent: architect
allowed-tools: Read Grep Glob Bash(git *) Bash(cat CLAUDE.md *) Bash(find *)
---

# Skipper :: stack-doctor

Validar que el código sigue las leyes declaradas en CLAUDE.md.

## Contexto

- CLAUDE.md presente: !`[ -f CLAUDE.md ] && echo "sí" || echo "no"`
- Stack section: !`grep -A 200 "<!-- skipper:stack -->" CLAUDE.md 2>/dev/null | sed -n '/<!-- skipper:stack -->/,/<!-- \/skipper:stack -->/p' | head -100`
- Layers presentes: !`grep -oE "<!-- skipper:layer:[a-z-]+" CLAUDE.md 2>/dev/null | sed 's/<!-- skipper:layer://' | sort -u`
- Estructura del proyecto: !`find src -maxdepth 3 -type d 2>/dev/null | head -20`

## Tu tarea (eres architect en context fork)

1. Lee `CLAUDE.md` completo (todas las secciones skipper:*).
2. Extrae las **leyes declaradas** del bloque skipper:stack:
   - Estructura obligatoria (carpetas, paths).
   - Reglas de imports / direccionalidad.
   - Anti-patterns explícitos.
   - Umbrales (componente < N líneas, hook custom > N usos, etc.).
3. Recorre el código del proyecto (`src/`, `app/`, `lib/`, etc.) buscando violaciones de esas leyes.
4. Reporta tabla con TODAS las violaciones encontradas:

| Severidad | Path | Regla violada | Descripción |
|---|---|---|---|
| 🔴 high | src/components/Foo.tsx:120 | "componente < 200 líneas" | 280 líneas, hay 3 responsabilidades mezcladas |
| 🟡 medium | src/features/auth/Login.tsx:45 | "no fetch en useEffect" | useEffect con axios call |
| 🟢 low | src/utils/format.ts:12 | "named exports siempre" | export default detected |

Severidades:
- **high**: viola estructura/capas o seguridad (ej. tabla sin RLS).
- **medium**: viola convención técnica importante (anti-patterns).
- **low**: estilo/legibilidad (naming, longitud).

5. Si no hay violaciones: reporta "✅ Código alineado con CLAUDE.md. Cero violaciones detectadas." y termina.

6. **NO escribas ni refactorices** — sólo reporta. El usuario decide qué arreglar y con qué especialista (`/skipper:refactor`, `/skipper:react-vite`, etc.).

## Reglas duras

- Si no hay sección skipper:stack en CLAUDE.md, reporta "Stack no aplicado, corre `/skipper:stack-apply` primero" y termina.
- NO toques archivos. Sólo lectura.
- Sé honesto con severidades — no infles violaciones triviales.
- Para cada violación, cita línea exacta.

## Output final

Después de la tabla, agrega resumen:

```
🐧 stack-doctor reporte:
  🔴 high: N
  🟡 medium: N
  🟢 low: N

Sugerencias:
  /skipper:refactor <archivo>          → arregla violación específica
  /skipper:<stack-agent> "..."         → consulta al especialista del stack
```
