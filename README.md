# 🐧 skipper

> *"Kowalski, status report."* — Skipper

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Marketplace: madagascar](https://img.shields.io/badge/marketplace-madagascar-blue)](https://github.com/c-donnachie/madagascar)
[![Version](https://img.shields.io/badge/version-1.0.0-green)](./CHANGELOG.md)

**Framework de Claude Code que arma, documenta y mantiene tu proyecto siguiendo Clean Code y SOLID.**

Detecta tu stack, genera un CLAUDE.md opinado fuerte, mantiene docs vivos (ADRs, PRDs, planes), y trae sub-agentes especialistas que pueden refactorizar con criterio del stack.

---

## Why skipper

### El problema

Cuando empiezas un proyecto nuevo en Claude Code:

- Pegas las mismas reglas de Cursor/CLAUDE.md proyecto tras proyecto.
- Te peleas con Claude porque "no sigue la arquitectura" — pero nunca le explicaste cuál es.
- Las decisiones técnicas (¿por qué Supabase y no Firebase?) viven en un Slack que ya nadie lee.
- Sumas 5 plugins separados: uno para ADRs, uno para boilerplate, uno para review, uno para reglas, uno para…

### La solución

**Un solo plugin** que conoce 8 stacks comunes (React Vite, Next.js, Expo, Node API, Python FastAPI, todos con/sin Supabase) y:

1. **Detecta** tu stack con `/skipper:scan`.
2. **Aplica** un CLAUDE.md opinado (estructura obligatoria, naming, libs, anti-patterns).
3. **Mantiene docs vivos** — ADRs/PRDs/planes con templates y numeración automática.
4. **Trae especialistas** — `/skipper:react-vite`, `/skipper:nextjs`, `/skipper:supabase`, etc. que refactorizan respetando las leyes del proyecto.
5. **Sugiere proactivamente** — hooks que detectan cuándo deberías documentar o invocar al especialista correcto.

---

## Demo en 30 segundos

```bash
# Instalar
/plugin marketplace add c-donnachie/madagascar
/plugin install skipper@madagascar
/reload-plugins

# En tu proyecto:
/skipper:init-structure       # 🐧 detecta stack + arma docs/
/skipper:scan                 # 🐧 ¿qué stack tengo?
/skipper:stack-apply expo-supabase   # 🐧 aplica CLAUDE.md opinado

# Trabajar:
/skipper:ask "¿este componente está bien organizado?"     # capitán enruta
/skipper:react-native "extrae este hook a domain/"         # especialista refactoriza
/skipper:update                                            # kowalski actualiza docs

# Validar antes de PR:
/skipper:stack-doctor          # tabla de violaciones de las leyes del CLAUDE.md
/skipper:review                # especialista revisa el diff
```

<!-- TODO screenshot: SessionStart banner mostrando stack + layers + docs -->
<!-- TODO screenshot: output de /skipper:scan con confidence high -->
<!-- TODO screenshot: tabla de stack-doctor con violaciones por severidad -->
<!-- TODO gif: una sesión de /skipper:ask enrutando al especialista -->

---

## Instalación

### Opción A: vía marketplace madagascar (recomendado)

```
/plugin marketplace add c-donnachie/madagascar
/plugin install skipper@madagascar
/reload-plugins
```

### Opción B: cargar desde directorio local (dev/test)

```bash
cd /path/to/your/project
claude --plugin-dir /path/to/skipper
```

---

## Comandos

### Bootstrap (skipper coordina init)

| Comando | Qué hace |
|---|---|
| `/skipper:scan` | Detecta el stack del proyecto. No escribe. |
| `/skipper:stack-apply <id>` | Aplica perfil opinado: CLAUDE.md + docs/architecture/stack.md. |
| `/skipper:stack-add <layer>` | Agrega un layer (tailwind, shadcn-ui, tanstack-query, etc.). |
| `/skipper:init-structure` | Crea `docs/` + invoca scan + sugiere stack-apply. |

### Documentación (kowalski analiza)

| Comando | Qué hace |
|---|---|
| `/skipper:update` | Lee diff y propone ADRs/PRDs/architecture/business. |
| `/skipper:new-adr "título"` | Crea ADR numerado con template. |
| `/skipper:new-prd "título"` | Crea PRD numerado. |
| `/skipper:new-plan "título"` | Crea plan de implementación. |

### Especialistas (técnicos contratados)

| Comando | Especialista |
|---|---|
| `/skipper:architect` | Estructura, capas, dependencias |
| `/skipper:solid-coach` | Clean Code, SOLID |
| `/skipper:react-vite` | React + Vite (features-first, TanStack Query) |
| `/skipper:react-native` | RN + Expo (capas data/domain/presentation) |
| `/skipper:nextjs` | Next.js (RSC, Server Actions) |
| `/skipper:node-backend` | Node API (Fastify + Zod + Drizzle) |
| `/skipper:supabase` | RLS, auth, migraciones, Realtime |

### Routers inteligentes (skipper enruta)

| Comando | Qué hace |
|---|---|
| `/skipper:ask "pregunta libre"` | Skipper decide qué especialista invocar. |
| `/skipper:refactor <archivo>` | Refactor SOLID con solid-coach. |
| `/skipper:review` | Especialista del stack revisa diff vs origin/main. |
| `/skipper:lib-lookup "query"` | WebSearch acotado a docs oficiales del stack. |

### Validación

| Comando | Qué hace |
|---|---|
| `/skipper:stack-doctor` | Tabla de violaciones del CLAUDE.md por severidad. |

---

## Stacks soportados

| ID | Frontend | Backend |
|---|---|---|
| `react-vite-supabase` | React + Vite | Supabase |
| `react-vite-node` | React + Vite | Node API |
| `nextjs-fullstack` | Next.js App Router | Server Actions + Drizzle |
| `nextjs-supabase` | Next.js | Supabase SSR |
| `expo-supabase` | RN + Expo | Supabase |
| `expo-node` | RN + Expo | Node API |
| `node-api` | (sin frontend) | Fastify + Zod + Drizzle |
| `python-fastapi` | (sin frontend) | FastAPI + Pydantic + SQLAlchemy |

Cada stack incluye **CLAUDE.md opinado fuerte**: estructura obligatoria de carpetas, naming, libs recomendadas, reglas SOLID validables y anti-patterns explícitos.

---

## Layers componibles

Agregables a cualquier stack compatible con `/skipper:stack-add <layer>`:

- `tailwind` — Tailwind CSS (web)
- `shadcn-ui` — shadcn/ui (requiere tailwind)
- `tanstack-query` — TanStack Query (web + mobile)
- `zustand` — Zustand stores
- `zod` — Validación de boundaries
- `nativewind` — Tailwind para RN (Expo only)

---

## El universo Madagascar

Skipper vive en el [marketplace madagascar](https://github.com/c-donnachie/madagascar). Internamente coordina varios "pingüinos" como subagents especializados:

| Pingüino | Rol | Estado |
|---|---|---|
| 🐧 **Skipper** | Capitán/router. Lee contexto y enruta. | v0.4+ |
| 🐧 **Kowalski** | Analista. Lee diff y propone documentación. | v0.4+ |
| 🐧 Rico | Demoliciones / refactor agresivo. | Reservado v1.x |
| 🐧 Private | Aprendiz / tutoriales / lookups web. | Reservado futuro |

Aparte de los pingüinos, hay **especialistas técnicos** (no son pingüinos, son los expertos contratados):

🛠 `architect`, `solid-coach`, `react-vite`, `react-native`, `nextjs`, `node-backend`, `supabase`.

---

## Componentes

- **20 skills** (bootstrap, docs, especialistas, routers, validación, lib-lookup)
- **9 subagents** (skipper, kowalski + 7 técnicos)
- **8 stack profiles** + **6 layers componibles**
- **3 hooks**:
  - `SessionStart` → banner con stack/layers/docs al abrir el proyecto
  - `Stop` → sugiere `/skipper:update` 1×/24h tras cambios en código
  - `PostToolUse` (Edit/Write) → sugiere especialista cuando edita ≥3 archivos del mismo dominio

Token cost: ~355 tokens en descripciones (≈0.18% de tu ventana de contexto).

---

## Filosofía

- **Skipper es el arnés, no la fábrica de plantillas.** Genera lo mínimo necesario para que Claude entienda tu stack — no inunda el repo con boilerplate.
- **Conservadurismo.** Hooks throttled, sub-agentes en `context: fork`, marcadores HTML para idempotencia. Si dudas, no escribas.
- **Convenciones, no reglas duras.** El CLAUDE.md generado guía a Claude pero no bloquea — para validación dura, usa `/skipper:stack-doctor`.

---

## Roadmap

- ✅ **v1.0** — Submit al marketplace oficial de Anthropic.
- 🔜 **v1.1+** — Más stacks (Astro, SvelteKit, Tauri, Remix) según demanda real.
- 🔜 **add-ons opcionales** — `private` (tutoriales onboarding), `rico` (refactor agresivo automatizado).

Ver [CHANGELOG.md](./CHANGELOG.md) para histórico completo.

---

## Contribuir

Bug reports y feedback: https://github.com/c-donnachie/skipper/issues

---

## Licencia

MIT
