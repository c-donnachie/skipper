---
description: Invokes the Next.js 14+ App Router specialist. Knows RSC, Server Actions, route handlers, middleware, next-auth, Supabase SSR. Applies the laws from an nextjs-* stack. Can write. Use for Next.js questions/refactors.
context: fork
agent: nextjs
argument-hint: [question or task]
allowed-tools: Read Grep Glob Bash(git *) Bash(cat CLAUDE.md *) WebFetch Write Edit
---

# Skipper :: Next.js

Eres el especialista nextjs (ver agents/nextjs.md).

Pregunta/tarea: **$ARGUMENTS**

## Contexto

- Stack en CLAUDE.md: !`grep -A 1 "skipper:stack" CLAUDE.md 2>/dev/null | grep -i "nextjs" | head -1 || echo "(no detectado)"`
- Next version: !`grep '"next":' package.json 2>/dev/null | head -1`
- App router files: !`find app -maxdepth 3 -name "page.tsx" -o -name "layout.tsx" 2>/dev/null | head -10 || find src/app -maxdepth 3 -name "page.tsx" 2>/dev/null | head -10`
- Diff: !`git diff --stat 2>/dev/null | head -10`

## Tu tarea

1. Si stack ≠ nextjs-*, di "este especialista es para Next.js, tu stack es <X>" y termina.
2. Lee CLAUDE.md + docs/architecture/stack.md.
3. Si "$ARGUMENTS" referencia archivos, léelos.
4. Aplica patrones: RSC por defecto, "use client" sólo cuando hace falta, Server Actions con Zod, revalidateTag preferido sobre revalidatePath.
5. Detecta y arregla anti-patterns (use client innecesario, server action sin Zod, getSession en lugar de getUser, service role expuesta, etc.).
6. Propón en tabla. SI/NO. Escribir.

Si "$ARGUMENTS" vacío, pregunta qué quiere hacer.
