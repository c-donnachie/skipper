### Layer: Tailwind CSS

**Reglas que aplico**:

- Configuración en `tailwind.config.{ts,js}`. Theme tokens en `theme.extend` (no inline).
- Colores: paleta semántica (`primary`, `secondary`, `muted`, `destructive`, `accent`) — no usar colores hardcoded en componentes.
- Variantes con `clsx` o `tailwind-merge` para componentes con múltiples estados.
- Orden de classes: layout → spacing → sizing → typography → colors → effects (sigue el orden de Prettier plugin recomendado).

**Anti-patterns**:

- ❌ `style={{ ... }}` inline en componentes (excepto valores dinámicos calculados).
- ❌ CSS files custom para componentes (usar `@apply` mínimo, sólo en `globals.css`).
- ❌ Colores hardcoded (`text-[#FF0000]`) — usar tokens del theme.
- ❌ Importar Tailwind por componente — el plugin escanea tu source globalmente.
