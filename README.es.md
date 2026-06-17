# 🐧 skipper

> *"Kowalski, informe de situación."* — Skipper

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Marketplace: madagascar](https://img.shields.io/badge/marketplace-madagascar-blue)](https://github.com/c-donnachie/madagascar)
[![Version](https://img.shields.io/badge/version-1.4.0-green)](./CHANGELOG.md)

[English](./README.md) · **Español**

**Un framework para Claude Code que estructura, documenta, mantiene — y ahora *recuerda* — tu proyecto, siguiendo Clean Code y SOLID.**

skipper hace que Claude entienda *tu* proyecto — su stack, sus capas, sus decisiones — y mantiene la documentación viva sincronizada **por su cuenta** mientras codeás. Detecta tu stack, genera un CLAUDE.md opinado, trae subagentes especialistas que refactorizan con criterio según el stack, y evita proactivamente que ADRs/PRDs/arquitectura se pudran.

> Otros plugins te dan plantillas. skipper te da un tripulante que conoce el barco, hace cumplir las reglas y mantiene la bitácora al día — así vos solo navegás.

## 🧠 Skipper Memory — *nuevo en v1.4*

Skipper ahora **recuerda**. Los ADRs/PRDs/decisiones que mantiene dejan de ser una pila de markdown y se vuelven una **memoria consultable, citada y consciente del drift** — para vos *y* para tus agentes.

```bash
skipper ask "¿por qué los hooks son proactivos?"   # respuesta citada, sintetizada por LLM, sobre tus decisiones
skipper context hooks/                              # los ADRs que gobiernan un path + invariantes + frescura
skipper relate ADR-0001 ADR-0014                    # cómo se conectan dos decisiones (directo / vía hub)
```

- **Para agentes** — un **MCP server** `skipper-memory` deja que un agente de Conductor llame `context_for(path)` **antes de editar**, así sigue las decisiones ya tomadas en vez de repetir errores. *Conductor ejecuta, Skipper sabe.*
- **Proactivo** — `memory-guard` inyecta los ADRs que gobiernan el path en el momento en que editás; `memory-stop` bloquea el turno (`exit 2`) si cambió código gobernado sin verificar el cumplimiento.
- **Consciente del drift** — marca cuándo un doc quedó desactualizado vs el código (versión + git-delta), revela *quién decidió* y *qué tocó* un subsistema, y caza conflictos de conteo.
- **Honesto** — cada cita se autoverifica contra la fuente, y un gold gate de 19 checks corre en CI.

Motor OSS opt-in (Node + `node:sqlite` incorporado, **cero dependencias**) bajo [`engine/`](./engine/) — un paquete separado, accedido vía MCP, así el plugin sigue siendo zero-install ([ADR-0017](./docs/decisions/0017-memory-engine-separate-opt-in-package.md)). Ver [`engine/README.md`](./engine/README.md).

---

## Por qué skipper

### El problema

Cuando arrancás un proyecto nuevo en Claude Code:

- Pegás las mismas reglas de Cursor/CLAUDE.md una y otra vez.
- Peleás con Claude porque "no sigue la arquitectura" — pero nunca le dijiste cuál es.
- Las decisiones técnicas (¿por qué Supabase y no Firebase?) viven en un hilo de Slack que ya nadie lee.
- Terminás instalando 5 plugins separados: uno para ADRs, uno para boilerplate, uno para review, uno para reglas, uno para…

### La solución

**Un solo plugin** que conoce 8 stacks comunes (React Vite, Next.js, Expo, Node API, Python FastAPI, todos con/sin Supabase) y:

1. **Detecta** tu stack con `/skipper:scan`.
2. **Aplica** un CLAUDE.md opinado (estructura obligatoria, naming, libs, anti-patrones).
3. **Mantiene docs vivos** — ADRs/PRDs/plans con plantillas y numeración automática.
4. **Trae especialistas** — `/skipper:react-vite`, `/skipper:nextjs`, `/skipper:supabase`, etc. que refactorizan respetando las leyes del proyecto.
5. **Actúa proactivamente** — tras el setup inicial no corrés comandos. Los hooks inyectan directivas que Claude sigue: en **plan mode** planifica dentro de tu arquitectura (aplica las leyes, reutiliza código existente, referencia tus docs), y mientras codeás mantiene docs y el bloque de stack sincronizados — sincronizando antes de devolver el control. Todo loop-safe, con throttle, y opt-out (`SKIPPER_PROACTIVE=off`).

---

## Demo de 30 segundos

```bash
# Instalar
/plugin marketplace add c-donnachie/madagascar
/plugin install skipper@madagascar
/reload-plugins

# En tu proyecto:
/skipper:init-structure       # 🐧 detecta stack + scaffold de docs/
/skipper:scan                 # 🐧 ¿qué stack tengo?
/skipper:stack-apply expo-supabase   # 🐧 aplica el CLAUDE.md opinado

# Trabajando:
/skipper:ask "¿este componente está bien organizado?"   # el capitán rutea
/skipper:react-native "extraé este hook a domain/"        # el especialista refactoriza
/skipper:update                                           # kowalski actualiza docs

# Validar antes del PR:
/skipper:stack-doctor          # tabla de violaciones a CLAUDE.md
/skipper:review                # el especialista revisa el diff
```

---

## Instalación

### Opción A: vía el marketplace madagascar (recomendado)

```
/plugin marketplace add c-donnachie/madagascar
/plugin install skipper@madagascar
/reload-plugins
```

### Opción B: cargar desde un directorio local (dev/test)

```bash
cd /ruta/a/tu/proyecto
claude --plugin-dir /ruta/a/skipper
```

---

## Comandos

### Bootstrap (skipper coordina el init)

| Comando | Qué hace |
|---|---|
| `/skipper:scan` | Detecta el stack del proyecto. No escribe. |
| `/skipper:stack-apply <id>` | Aplica el perfil opinado: CLAUDE.md + docs/architecture/stack.md. |
| `/skipper:stack-add <layer>` | Agrega una capa (tailwind, shadcn-ui, tanstack-query, etc.). |
| `/skipper:init-structure [app\|service\|library]` | Crea `docs/` para el tipo de proyecto + invoca scan + sugiere stack-apply. |

### Documentación (kowalski analiza)

| Comando | Qué hace |
|---|---|
| `/skipper:update` | Lee el diff y propone docs de ADRs/PRDs/arquitectura/negocio. |
| `/skipper:new-adr "título"` | Crea un ADR numerado (plantilla alineada a MADR). |
| `/skipper:decide "tema"` | Facilita una decisión (opciones + tradeoffs + recomendación) y la captura como un ADR completo — brainstorm → decisión. |
| `/skipper:supersede-adr N "título"` | Supera el ADR N con uno nuevo — marca el viejo como `Superseded by`, enlaza ambos (los ADRs son inmutables). |
| `/skipper:new-prd "título"` | Crea un PRD numerado. |
| `/skipper:new-plan "título"` | Crea un plan de implementación. |

### Especialistas (expertos técnicos)

| Comando | Especialista |
|---|---|
| `/skipper:architect` | Estructura, capas, dependencias |
| `/skipper:solid-coach` | Clean Code, SOLID |
| `/skipper:react-vite` | React + Vite (features-first, TanStack Query) |
| `/skipper:react-native` | RN + Expo (capas data/domain/presentation) |
| `/skipper:nextjs` | Next.js (RSC, Server Actions) |
| `/skipper:node-backend` | Node API (Fastify + Zod + Drizzle) |
| `/skipper:supabase` | RLS, auth, migraciones, Realtime |

### Routers inteligentes (skipper rutea)

| Comando | Qué hace |
|---|---|
| `/skipper:ask "pregunta libre"` | Skipper elige el especialista correcto por vos. |
| `/skipper:goal "qué construir"` | Grilling con memoria: consulta tus decisiones, pregunta sólo los huecos abiertos, y enuncia objetivo + criterios de aceptación antes de construir. |
| `/skipper:refactor <archivo>` | Refactor SOLID con solid-coach. |
| `/skipper:review` | El especialista del stack revisa el diff vs origin/main. |
| `/skipper:lib-lookup "consulta"` | WebSearch acotado a los docs oficiales de tu stack. |

### Validación

| Comando | Qué hace |
|---|---|
| `/skipper:stack-doctor` | Tabla de violaciones a CLAUDE.md por severidad. |
| `/skipper:stack-sync` | Compara `package.json` vs el stack declarado — marca librerías undocumented y phantom (declaradas pero no instaladas). |
| `/skipper:docs-doctor` | Chequeo de salud de `docs/` — docs stale (el código se movió, el doc no), ADRs/PRDs stub, links rotos, carpetas vacías. |

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

Cada stack trae un **CLAUDE.md opinado**: estructura de carpetas obligatoria, naming, libs recomendadas, reglas SOLID validables, y anti-patrones explícitos.

---

## Capas componibles

Agregalas sobre cualquier stack compatible con `/skipper:stack-add <layer>`:

- `tailwind` — Tailwind CSS (web)
- `shadcn-ui` — shadcn/ui (requiere tailwind)
- `tanstack-query` — TanStack Query (web + mobile)
- `zustand` — stores de Zustand
- `zod` — validación en los bordes
- `nativewind` — Tailwind para RN (solo Expo)

---

## El universo Madagascar

skipper vive en el [marketplace madagascar](https://github.com/c-donnachie/madagascar). Internamente coordina varios "pingüinos" como subagentes especializados:

| Pingüino | Rol | Estado |
|---|---|---|
| 🐧 **Skipper** | Capitán/router. Lee el contexto y rutea. | v0.4+ |
| 🐧 **Kowalski** | Analista. Lee el diff y propone documentación. | v0.4+ |
| 🐧 Rico | Demolición / refactor agresivo. | Reservado v1.x |
| 🐧 Private | Aprendiz / tutoriales / búsquedas web. | Reservado a futuro |

Además de los pingüinos, están los **especialistas técnicos** (no pingüinos, los expertos contratados):

🛠 `architect`, `solid-coach`, `react-vite`, `react-native`, `nextjs`, `node-backend`, `supabase`.

---

## Componentes

- **23 skills** (bootstrap, docs, especialistas, routers, validación, lib-lookup) — incl. health checks `stack-sync` + `docs-doctor`, `supersede-adr`
- **9 subagentes** (skipper, kowalski + 7 técnicos)
- **8 perfiles de stack** + **6 capas componibles**
- **5 eventos de hook / 9 scripts** (proactivos por defecto — ver abajo):
  - `SessionStart` → banner + inyecta la directiva permanente "mantené los docs en sync" al contexto de Claude
  - `UserPromptSubmit` → `plan-guard`: en **plan mode**, inyecta el protocolo de arquitectura para que cada plan aplique las leyes de CLAUDE.md, reutilice código existente y referencie docs/ADRs existentes
  - `PreToolUse` (ExitPlanMode) → `plan-exit-guard`: checklist best-effort antes de presentar un plan (no-op si el matcher no está soportado)
  - `PostToolUse` (Edit/Write) → `docs-sync` apunta a Claude al doc **específico** de `docs/architecture` del subsistema que editaste; `specialist-suggest` te sugiere un especialista tras ≥3 archivos de un dominio; (Bash/Edit/Write) → `stack-watch` recuerda mantener el bloque `skipper:stack` en sync cuando cambian dependencias
  - `Stop` → si el turno cambió código en un área documentada sin tocar `docs/`, instruye a Claude a sincronizar docs **antes de ceder** (loop-safe, throttle de 30 min)
  - **Memory (v1.4, opt-in)** → `memory-guard` (PostToolUse) inyecta los ADRs que gobiernan el path editado; `memory-stop` (Stop) bloquea (`exit 2`) si cambió código gobernado sin verificar el cumplimiento — ambos no-op si el motor no está instalado
- **🧠 Motor Skipper Memory** (`engine/`, opt-in) — un grafo consultable y citado de tus decisiones + un MCP server `skipper-memory` + un gold gate de 19 checks (ver la sección [Skipper Memory](#-skipper-memory--nuevo-en-v14)).

Costo de tokens: ~355 tokens en descripciones (≈0.18% de tu ventana de contexto).

### Modo proactivo

Tras el setup inicial no deberías tener que correr comandos. Los hooks de skipper inyectan **directivas sobre las que Claude actúa** (vía `additionalContext` y la continuación de `Stop`) — no solo mensajes para que leas. Así, mientras codeás, Claude mantiene `docs/` y el bloque de stack en sync por su cuenta, y **cuando entrás a plan mode planifica dentro de tu arquitectura** — aplicando las capas/leyes declaradas, chequeando si la funcionalidad ya existe antes de construirla, y referenciando los docs existentes relevantes.

- **Encendido por defecto.** Desactivalo por proyecto (o global) seteando `SKIPPER_PROACTIVE=off` en tu entorno / `env` de `settings.json`.
- **Loop-safe y silencioso.** Editar `docs/`/`*.md` nunca lo dispara; el enforcer de `Stop` corre como mucho una vez cada 30 min y se calla si ya tocaste `docs/`.
- **Conservador.** Nunca documenta cambios triviales, y la directiva de `Stop` deja que Claude diga "nada que documentar" y termine.

---

## Construido sobre Claude Code Plugins

Para la referencia técnica de cómo funcionan plugins, hooks, skills y subagentes en Claude Code, ver los [docs oficiales](https://code.claude.com/docs/en/plugins).

---

## Filosofía

- **skipper es el harness, no una fábrica de plantillas.** Genera lo mínimo necesario para que Claude entienda tu stack — no inunda el repo de boilerplate.
- **Conservadurismo.** Hooks con throttle, subagentes en `context: fork`, marcadores HTML para idempotencia. Ante la duda, no escribir.
- **Convenciones, no reglas duras.** El CLAUDE.md generado guía a Claude pero no bloquea — para validación dura, usá `/skipper:stack-doctor`.

---

## Roadmap

- ✅ **v1.4** — 🧠 **Skipper Memory**: memoria consultable y citada (`ask`/`context`/`relate`), hooks de memoria proactivos, un MCP server para agentes, y un gold gate de regresión.
- ✅ **v1.0** — Envío al marketplace oficial de Anthropic.
- 🔜 **v1.1+** — Más stacks (Astro, SvelteKit, Tauri, Remix) según demanda real.
- 🔜 **add-ons opcionales** — `private` (tutoriales de onboarding), `rico` (refactor agresivo automatizado).

Ver [CHANGELOG.md](./CHANGELOG.md) para el historial completo.

---

## Contribuir

Reportes de bugs y feedback: https://github.com/c-donnachie/skipper/issues

---

## Licencia

MIT
