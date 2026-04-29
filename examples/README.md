# Examples

Mini-proyectos en `fixtures/` que representan cada stack soportado por skipper. Sirven dos propósitos:

1. **Tests del detector**: `lib/test-detect.sh` corre `lib/detect.sh` contra cada fixture y verifica que detecte el stack correcto con confianza alta.
2. **Referencia visual**: muestran qué archivos típicos lleva cada stack (package.json, app.json, vite.config, etc.).

## Estructura

```
examples/fixtures/
├── react-vite-supabase/
├── react-vite-node/
├── nextjs-fullstack/
├── nextjs-supabase/
├── expo-supabase/
├── expo-node/
├── node-api/
└── python-fastapi/
```

Cada fixture contiene los archivos marcador mínimos para que el detector lo reconozca. NO son proyectos funcionales — son señuelos para validar la detección.

## Correr tests

```bash
bash lib/test-detect.sh
```

Output esperado:

```
✓ react-vite-supabase
✓ react-vite-node
✓ nextjs-fullstack
...
8 fixtures, 8 passed.
```

## Agregar un fixture nuevo

1. Crear `examples/fixtures/<stack-id>/`.
2. Agregar archivos marcador mínimos (package.json, app.json, etc.).
3. Editar `lib/test-detect.sh` y agregar el caso esperado.
