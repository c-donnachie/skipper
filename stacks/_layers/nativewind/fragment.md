### Layer: NativeWind

**Reglas que aplico**:

- Configuración en `tailwind.config.{ts,js}` y `metro.config.js` (con `withNativeWind`).
- Usar `className` en componentes RN igual que en web.
- Theme tokens compartidos en `tailwind.config.ts` — para light/dark mode usa `dark:` variant + `useColorScheme` hook.
- Para componentes complejos con variantes, `cva` (class-variance-authority) recomendado.
- iOS-specific: si la app usa fonts custom, registrarlas en `app.json` Y referenciar en theme.

**Anti-patterns**:

- ❌ Mezclar `StyleSheet.create()` con `className` en mismo componente.
- ❌ Colores hardcoded en `className` (usa tokens del theme).
- ❌ `Platform.OS === 'ios' ? ... : ...` en className — usa `ios:` y `android:` variants.
- ❌ `tailwind.config.js` desincronizado con `metro.config.js` (regenerar cuando cambies theme).
- ❌ Asumir que TODO el ecosistema RN lib soporta NativeWind (algunas libs requieren `style` prop).
