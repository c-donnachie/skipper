### Layer: Zustand

**Reglas que aplico**:

- Stores en archivos dedicados: `src/features/<dominio>/store.ts` (Vite) o `src/domain/store/<dominio>.ts` (Expo).
- Hook nombrado: `useUI<Dominio>Store` para client/UI state, `use<Dominio>Store` si es store de feature.
- Selectores granulares con `useStore(state => state.foo)` — evitar re-renders innecesarios.
- Persistencia con middleware `persist` cuando aplique (settings, drafts, etc.).
- Combinar con TanStack Query: server state → Query, UI state (modals, filters, drafts) → Zustand. **No mezcles**.

**Anti-patterns**:

- ❌ Store global gigante con todo — divídelo por dominio.
- ❌ Server state en Zustand (data del backend va en TanStack Query).
- ❌ Acceder a `store.getState()` desde componentes (usa el hook).
- ❌ Mutations directas sin actions tipadas — siempre métodos en el store.
- ❌ Persistir tokens sensibles (usa `expo-secure-store` o cookies httpOnly).
