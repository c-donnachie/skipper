### Layer: Zod

**Reglas que aplico**:

- Schema = source of truth. Tipos derivados con `z.infer<typeof Schema>`.
- Validar en TODOS los boundaries:
  - Request inputs (forms, API payloads, search params, deep links).
  - API responses (cuando llamas a backends externos).
  - Env vars (`process.env` parseado en `lib/env.ts`).
- Schemas en archivos dedicados: `<feature>/types.ts` o `<feature>/schema.ts`.
- Errores de validación: usar `safeParse` cuando manejas errores user-facing; `parse` cuando es bug interno (throw).
- Para forms: integrar con `react-hook-form` vía `@hookform/resolvers/zod`.

**Anti-patterns**:

- ❌ Tipos TS sin schema Zod (cuando vienen de un boundary externo).
- ❌ `z.any()` o `z.unknown()` excepto en casos justificados.
- ❌ Duplicar schema y tipo manualmente — siempre `z.infer`.
- ❌ Validar dentro de componentes (el hook/action lo hace antes).
- ❌ Schemas redundantes (usar `.pick()`, `.omit()`, `.partial()` para variantes).
