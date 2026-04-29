### Layer: shadcn/ui

**Reglas que aplico**:

- Componentes copiables vía `npx shadcn@latest add <componente>`. Quedan en `src/shared/ui/` (Vite) o `components/ui/` (Next.js).
- Los componentes son **tuyos**: puedes editarlos. No son una dependencia npm.
- Todos los componentes usan Tailwind tokens del theme — para tematizar, edita `tailwind.config.ts` y `globals.css`.
- Patrón `cn()` helper en `lib/utils.ts` (combina `clsx` + `tailwind-merge`).
- Compose con `asChild` (slot pattern) para evitar wrappers innecesarios.

**Anti-patterns**:

- ❌ Sobrescribir estilos con `!important` o CSS custom — editar el componente o usar variantes.
- ❌ Modificar el componente en cada feature — si necesitas variante, agregarla al componente base.
- ❌ Re-instalar componentes ya presentes (sobreescribe edits).
- ❌ Importar desde `@radix-ui/*` directo — usa el wrapper de shadcn.
