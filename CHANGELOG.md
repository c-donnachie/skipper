# Changelog

Todos los cambios notables de skipper. Sigue [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-04-29

### Added
- **CHANGELOG.md** con histórico completo desde v0.1.
- **`examples/fixtures/`** con mini-proyectos por stack para validar detección.
- **`lib/test-detect.sh`** corre regresión del detector contra los fixtures.
- **`SUBMISSION.md`** con guía para submit al marketplace oficial de Anthropic.
- **README rediseñado** con sección "Why skipper" + demo de 30 segundos + screenshots.

### Notes
- Marca **1.0.0** indica feature set estable y listo para distribución pública.
- API/skills/agents son backwards compatible con v0.4–v0.6.
- Próximas iteraciones (v1.x) serán principalmente fixes y stacks adicionales según feedback real de uso.

---

## [0.6.0] — 2026-04-29

### Added
- **Layers componibles** en `stacks/_layers/`: `tailwind`, `shadcn-ui`, `tanstack-query`, `zustand`, `zod`, `nativewind`. Cada layer trae sus propias reglas y anti-patterns como fragmento que se inserta en CLAUDE.md.
- **`/skipper:stack-add <layer>`** agrega un layer al CLAUDE.md sin tocar el bloque del stack ni otros layers (idempotente con marcadores HTML).
- **`/skipper:stack-doctor`** valida que el código sigue las leyes del CLAUDE.md. Delega al subagent `architect` en context fork. Reporta tabla de violaciones con severidad (high/medium/low). Read-only.
- **Hook `SessionStart`** con banner que muestra stack activo, layers presentes, conteo de docs y antigüedad del último update.

### Changed
- README documenta los 3 hooks (`SessionStart`, `Stop`, `PostToolUse`).

---

## [0.5.0] — 2026-04-29

### Added
- **Hook `PostToolUse`** que acumula paths editados (Edit/Write) y sugiere especialista cuando ≥3 archivos del mismo dominio en una ventana de 30 min. Throttle: una sugerencia por agente por sesión.
- **`paths:` glob** en frontmatter de los stack-agents (`react-vite`, `react-native`, `nextjs`, `node-backend`, `supabase`) — declarativo, lo lee el hook PostToolUse para matching.
- **`/skipper:lib-lookup "query"`** — wrapper sobre WebSearch + WebFetch acotado a docs oficiales por stack (react.dev, nextjs.org, docs.expo.dev, fastify.dev, etc.). Resume con criterio del especialista del stack.

---

## [0.4.0] — 2026-04-29

### Added
- **Subagent `skipper`** (NUEVO rol): capitán/router. Lee contexto (CLAUDE.md, diff, intención del usuario) y decide qué especialista invocar. Sin acceso a Write — sólo lectura.
- **Universo Madagascar** documentado en README: skipper (capitán), kowalski (analista), rico/private (reservados futuro), técnicos especialistas separados de la metáfora.

### Changed
- **Subagent docs `skipper` → `kowalski`**: el subagent que analiza diff y propone docs ahora se llama Kowalski. Frase culturalmente icónica "Kowalski, análisis" calza con su rol.
- **Skills routers ahora delegan al subagent skipper**: `/skipper:ask` y `/skipper:review` corren en `context: fork` con `agent: skipper`. Antes routeaban en chat principal.
- **Skill `/skipper:update`** delega ahora a `kowalski` (antes a `skipper`).
- **Marketplace**: repo renombrado de `c-donnachie/skipper-marketplace` → `c-donnachie/madagascar`. GitHub mantiene redirect del nombre viejo. `marketplace.json` ahora usa `name: "madagascar"` (era `name: "c-donnachie"`).

### Notes
- Slash commands del usuario quedan **idénticos** (`/skipper:xxx`) — cero ruptura.
- Usuarios actuales: `/plugin update skipper` jala v0.4 sin reinstalar.

---

## [0.3.0] — 2026-04-28

### Added
- **7 sub-agentes especialistas** que pueden refactorizar/escribir código en `context: fork`:
  - `architect` — estructura, capas, dependencias, boundaries (transversal).
  - `solid-coach` — Clean Code, SOLID, refactor de funciones/clases (transversal).
  - `react-vite` — React + Vite, features-first, TanStack Query, Zustand.
  - `react-native` — RN + Expo, capas data/domain/presentation, NativeWind.
  - `nextjs` — App Router, RSC, Server Actions, revalidateTag.
  - `node-backend` — Fastify + Zod + Drizzle, capas estrictas.
  - `supabase` — RLS, auth flow, migraciones, Realtime.
- **7 skills wrappers** uno por agente: `/skipper:{architect, solid-coach, react-vite, react-native, nextjs, node-backend, supabase}`.
- **3 skills routers inteligentes**:
  - `/skipper:ask "..."` — enruta al especialista correcto por paths + intención + stack.
  - `/skipper:refactor <archivo>` — siempre delega a solid-coach con context fork.
  - `/skipper:review` — el especialista del stack revisa el diff actual.

---

## [0.2.0] — 2026-04-28

### Added
- **`lib/detect.sh`** — detector de stack en 3 capas (archivos marcador, deps, estructura). Soporta 8 stacks.
- **`/skipper:scan`** — corre el detector y reporta candidato + confianza, sin escribir.
- **`/skipper:stack-apply <id>`** — aplica el perfil opinado del stack. Genera/actualiza sección `<!-- skipper:stack -->` en CLAUDE.md (idempotente con marcadores HTML) y crea `docs/architecture/stack.md`.
- **8 stack profiles** en `stacks/<id>/`:
  - `react-vite-supabase`, `react-vite-node`
  - `nextjs-fullstack`, `nextjs-supabase`
  - `expo-supabase`, `expo-node`
  - `node-api` (Fastify + Zod)
  - `python-fastapi` (Pydantic + SQLAlchemy)
- Cada perfil incluye `profile.json` (metadata + detección) + `claude.md.tmpl` (CLAUDE.md opinado fuerte) + `architecture.md.tmpl` (doc detallado).
- **`/skipper:init-structure`** ahora invoca al detector y propone `stack-apply` después de crear la estructura `docs/`.

### Notes
- Decisión: stacks como **perfiles monolíticos** en v0.2. Los layers componibles llegan en v0.6.

---

## [0.1.1] — 2026-04-28

### Changed
- Skill `/skipper:update` ahora corre en subagent aislado (`context: fork`, `agent: skipper`). El análisis no contamina la conversación principal — sólo regresa el reporte final. El subagent es conservador: si duda, no escribe.

---

## [0.1.0] — 2026-04-28

### Added
- Lanzamiento inicial. Plugin "doc-keeper" para Claude Code.
- **5 skills**:
  - `/skipper:init-structure` — crea árbol `docs/{architecture, business, decisions, prds, plans, legal}` con READMEs de protocolo.
  - `/skipper:update` — analiza git diff y propone docs (ADR/PRD/plan/architecture/business). Delegado a subagent skipper.
  - `/skipper:new-adr "título"` — crea ADR numerado con template estándar.
  - `/skipper:new-prd "título"` — crea PRD numerado.
  - `/skipper:new-plan "título"` — crea plan de implementación numerado.
- **1 subagent**: `skipper` (analista de docs, conservador).
- **1 hook `Stop`** con `suggest.sh` que sugiere `/skipper:update` 1×/24h tras cambios en código (`src/`, `app/`, `lib/`, `packages/`).
- **5 templates** de docs en `skills/update/templates/`: `adr.md`, `prd.md`, `plan.md`, `architecture.md`, `business.md`. Sustituyen `{{NUMBER}}`, `{{TITLE}}`, `{{DATE}}`, `{{AUTHOR}}`.
- Numeración 4 dígitos secuencial para ADR/PRD/plan.

[1.0.0]: https://github.com/c-donnachie/skipper/releases/tag/v1.0.0
[0.6.0]: https://github.com/c-donnachie/skipper/releases/tag/v0.6.0
[0.5.0]: https://github.com/c-donnachie/skipper/releases/tag/v0.5.0
[0.4.0]: https://github.com/c-donnachie/skipper/releases/tag/v0.4.0
[0.3.0]: https://github.com/c-donnachie/skipper/releases/tag/v0.3.0
[0.2.0]: https://github.com/c-donnachie/skipper/releases/tag/v0.2.0
[0.1.1]: https://github.com/c-donnachie/skipper/releases/tag/v0.1.1
[0.1.0]: https://github.com/c-donnachie/skipper/releases/tag/v0.1.0
