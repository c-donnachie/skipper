# 🐧 skipper

> *"Kowalski, status report."* — Skipper

Plugin para [Claude Code](https://code.claude.com) que toma el mando de tu documentación. Mantiene automáticamente la estructura de docs de un proyecto: **ADRs, PRDs, planes de implementación, docs de arquitectura y reglas de negocio**.

## Qué hace

Cuando trabajas en código, el plugin:

1. **Detecta cambios** vía un hook `Stop` que mira `git diff`.
2. **Sugiere documentar** cuando hay cambios en `src/`, `app/`, `lib/`, etc. (1× cada 24h).
3. **Te entrega comandos** para crear docs con formato estándar:
   - `/skipper:update` — revisa cambios y propone qué documentar
   - `/skipper:new-adr "título"` — crea un ADR numerado
   - `/skipper:new-prd "título"` — crea un PRD
   - `/skipper:new-plan "título"` — crea un plan de implementación
   - `/skipper:init-structure` — crea estructura `docs/` + detecta stack
   - `/skipper:scan` — detecta el stack del proyecto (no escribe)
   - `/skipper:stack-apply <stack-id>` — aplica perfil opinado (CLAUDE.md + docs/architecture/stack.md)

4. **Sub-agentes especialistas** (v0.3) — pueden escribir/refactorizar:
   - `/skipper:architect "..."` — estructura, capas, dependencias
   - `/skipper:solid-coach "archivo o pregunta"` — Clean Code, SOLID
   - `/skipper:react-vite "..."` — convenciones React + Vite
   - `/skipper:react-native "..."` — convenciones RN + Expo
   - `/skipper:nextjs "..."` — Next.js App Router, RSC, Server Actions
   - `/skipper:node-backend "..."` — Fastify + Zod + Drizzle
   - `/skipper:supabase "..."` — RLS, auth, migraciones, Realtime

5. **Atajos inteligentes**:
   - `/skipper:ask "pregunta libre"` — enruta al especialista correcto
   - `/skipper:refactor src/foo.ts` — refactor SOLID directo
   - `/skipper:review` — review del diff actual con el especialista del stack

## Stacks soportados (v0.2)

| ID | Stack |
|---|---|
| `react-vite-supabase` | React + Vite + Supabase |
| `react-vite-node` | React + Vite + Node API |
| `nextjs-fullstack` | Next.js (App Router + RSC + Server Actions) |
| `nextjs-supabase` | Next.js + Supabase |
| `expo-supabase` | React Native Expo + Supabase |
| `expo-node` | React Native Expo + Node API |
| `node-api` | Fastify + Zod + Drizzle |
| `python-fastapi` | FastAPI + Pydantic v2 + SQLAlchemy |

Cada stack viene con un CLAUDE.md opinado fuerte (estructura obligatoria, naming, libs recomendadas, reglas SOLID validables) y un `docs/architecture/stack.md` con detalle expandido.

## Estructura que mantiene

```
docs/
├── index.md            # TOC
├── README.md           # protocolo
├── architecture/       # cómo funciona cada subsistema
├── business/           # pricing, onboarding, defaults, security, brand
├── decisions/          # ADRs (NNNN-titulo.md)
├── prds/               # PRDs por feature
├── plans/              # planes activos
└── legal/              # términos y privacidad
```

## Instalación

### Opción A: vía marketplace (recomendado)

```
/plugin marketplace add cristiandonnachie/skipper-marketplace
/plugin install skipper@cristiandonnachie
```

### Opción B: cargar desde directorio local (dev/test)

```bash
cd /path/to/your/project
claude --plugin-dir /Users/donnachie/Developer/side_projects/skipper
```

## Primer uso

Dentro de Claude Code, en un proyecto sin estructura `docs/`:

```
/skipper:init
```

Luego, cuando hagas cambios significativos:

```
/skipper:update
```

## Filosofía

- **Semi-automático**: el hook detecta y sugiere, tú confirmas con un comando. Evita el spam de docs por cambios triviales.
- **Templates ligeros**: cada doc empieza con un esqueleto bajo 200 líneas.
- **Numeración secuencial**: ADR/PRD/plan llevan prefijo de 4 dígitos (`0001-`, `0002-`...).
- **Idioma del proyecto**: detecta español/inglés desde `CLAUDE.md` o docs existentes.

## Componentes

- **5 skills**: `update`, `new-adr`, `new-prd`, `new-plan`, `init`
- **1 subagent**: `skipper` (capitán que coordina razonamiento complejo)
- **1 hook**: `Stop` con script bash que sugiere acción

## Configuración

No requiere config. El hook se ejecuta automáticamente al final de cada turno mientras el plugin está habilitado.

Para desactivar el hook sin desinstalar el plugin: `/plugin disable skipper`.

## ¿Por qué "skipper"?

Skipper es el capitán de los Pingüinos de Madagascar — manda firme, mantiene el orden, no tolera papeleo innecesario. Igual que tu documentación debería ser.

## Licencia

MIT
