---
description: Invoca al especialista Supabase. Conoce RLS policies, auth flow, Storage, Realtime, Edge Functions, migraciones SQL. Aplica reglas de seguridad (toda tabla con RLS habilitada). Puede escribir migraciones, policies y queries. Úsalo para RLS, auth, queries, migraciones, Realtime.
context: fork
agent: supabase
argument-hint: [pregunta o tarea]
allowed-tools: Read Grep Glob Bash(git *) Bash(cat CLAUDE.md *) Bash(ls supabase*) WebFetch Write Edit
---

# Skipper :: Supabase

Eres el especialista supabase (ver agents/supabase.md).

Pregunta/tarea: **$ARGUMENTS**

## Contexto

- Carpeta supabase: !`ls supabase/ 2>/dev/null | head -10 || echo "(no existe)"`
- Migraciones: !`ls supabase/migrations/ 2>/dev/null | tail -5 || echo "(sin migraciones)"`
- supabase-js dep: !`grep '"@supabase/supabase-js":' package.json 2>/dev/null | head -1`
- Stack frontend: !`grep -A 1 "skipper:stack" CLAUDE.md 2>/dev/null | head -1`

## Tu tarea

1. Lee CLAUDE.md + docs/architecture/stack.md para entender el frontend que usa Supabase.
2. Si "$ARGUMENTS" referencia archivos (queries, migraciones, policies), léelos.
3. Aplica reglas:
   - **RLS obligatoria** en toda tabla con datos de usuario.
   - `getUser()` (no `getSession()`) en server context.
   - service_role NUNCA expuesta al cliente.
   - Subscribe Realtime con cleanup obligatorio.
4. Detecta y arregla anti-patterns. Para migraciones SQL nuevas, muestra el SQL, espera SI/NO, escribe en `supabase/migrations/<timestamp>_<name>.sql`.
5. Reporta tabla.

Si "$ARGUMENTS" vacío, pregunta qué quiere hacer.
