### Layer: TanStack Query

**Reglas que aplico**:

- Query keys array `[<dominio>, ...filters]` — convención por feature.
- Hook `use<Dominio>()` para queries. Hook `useCreate<X>()` / `useUpdate<X>()` / `useDelete<X>()` para mutations.
- Mutations con `onSuccess: (data, vars) => qc.invalidateQueries({ queryKey: ['<dominio>'] })`.
- `staleTime` configurado por query según volatilidad de datos (5min default, 0 para realtime).
- Devtools habilitado en dev (`<ReactQueryDevtools />`).
- Optimistic updates con `onMutate` + `onError` rollback para mejor UX.

**Anti-patterns**:

- ❌ `useEffect` para fetching — siempre `useQuery`.
- ❌ Pasar `queryFn` inline en componente (define en `hooks.ts` del feature).
- ❌ Olvidar invalidar queries después de mutations.
- ❌ Query keys inconsistentes (`['budgets']` vs `['Budgets']` vs `['budget']`).
- ❌ No tipar `queryFn` return — usa Zod para validar API responses.
