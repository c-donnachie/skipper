---
description: Looks up libraries/patterns in official docs (WebSearch + WebFetch) scoped to the current stack. Useful for "what lib should I use for X?", "shadcn or radix?", "latest TanStack Query API". The stack specialist performs the search and summarizes with judgment.
argument-hint: [question about libs]
allowed-tools: Read Grep Bash(cat CLAUDE.md *) WebSearch WebFetch
---

# Lib lookup

Pregunta del usuario: **$ARGUMENTS**

## Contexto

- Stack del proyecto: !`grep -A 2 "skipper:stack" CLAUDE.md 2>/dev/null | grep -iE "(react-vite|nextjs|expo|node-api|python-fastapi)" | head -1 || echo "(stack no aplicado)"`
- package.json deps: !`grep -E '"(react|vite|next|expo|@supabase|fastify|drizzle|@tanstack)"' package.json 2>/dev/null | head -10`

## Tu tarea

Hacer lookup de libs para resolver "$ARGUMENTS" y resumir con criterio basado en el stack actual.

### Pasos

1. **Detecta el stack** del CLAUDE.md. Si no hay stack aplicado, sugiere correr `/skipper:stack-apply` primero y termina.

2. **Consulta WebSearch acotado** a docs oficiales según el stack:

| Stack | Dominios prioritarios |
|---|---|
| react-vite-* | `react.dev`, `vitejs.dev`, `tanstack.com`, `ui.shadcn.com`, `tailwindcss.com` |
| nextjs-* | `nextjs.org/docs`, `authjs.dev`, `orm.drizzle.team`, `ui.shadcn.com` |
| expo-* | `docs.expo.dev`, `reactnative.dev`, `nativewind.dev` |
| *-supabase | `supabase.com/docs` (extra a las anteriores) |
| node-api | `fastify.dev`, `orm.drizzle.team`, `zod.dev`, `pino.io` |
| python-fastapi | `fastapi.tiangolo.com`, `docs.pydantic.dev`, `docs.sqlalchemy.org` |

3. **Filtra resultados**: prioriza:
   - Documentación oficial sobre tutoriales third-party
   - Resultados recientes (último año, Next.js/Expo cambian rápido)
   - Repos populares (GitHub stars > 1k)

4. **Si necesitas más detalle**, usa WebFetch sobre la URL más relevante.

5. **Resume con criterio** del especialista del stack:
   - Recomienda 1-2 opciones concretas (no más).
   - Justifica con tradeoffs específicos del stack del usuario (no genéricos).
   - Si la pregunta es "X o Y", elige una y di por qué.
   - Cita URLs de las fuentes consultadas.

## Formato de respuesta

```
🐧 Lib lookup: "$ARGUMENTS"
Stack: <detectado>

## Recomendación: <lib elegida>

<justificación 2-3 líneas con tradeoffs concretos>

### Cómo se ve usándola en tu stack

<snippet de código mínimo + comando de install>

### Alternativa considerada: <lib2>
<por qué no la elegí>

### Fuentes
- <url 1>
- <url 2>
```

## Reglas duras

- NO inventes APIs — verifica con WebFetch si dudas.
- NO recomiendes libs deprecadas (verifica fecha de último release).
- Si el stack es ambiguo, prioriza la lib que mejor encaje con el frontend declarado.
- Mantén el resumen bajo 200 palabras.

Default español chileno informal.
