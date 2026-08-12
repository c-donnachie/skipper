---
description: Creates the initial docs/ structure for the project type (app, service or library), with a protocol README.md in each folder, then detects the stack and offers to apply an opinionated profile. Use once when adopting the plugin in a project.
argument-hint: [app|service|library]
allowed-tools: Read Write Edit Bash(mkdir *) Bash(ls *) Bash(basename *) Bash(${CLAUDE_PLUGIN_ROOT}/lib/detect.sh *)
---

# Init estructura de docs

Crea la estructura para empezar a usar `skipper` en un proyecto, adaptada al **tipo de proyecto**.

## Paso 0 — Detecta stack y decide el tipo de proyecto

Primero corre el detector (te informa el tipo):

```bash
bash "${CLAUDE_PLUGIN_ROOT}/lib/detect.sh" "$(pwd)"
```

Determina el **tipo de proyecto**. Si el usuario pasó "$ARGUMENTS" (`app`, `service` o `library`), úsalo. Si no, infiérelo del JSON del detector y **confírmalo con el usuario en una sola pregunta**:

| Señal | Tipo sugerido |
|---|---|
| Stack `node-api` o `python-fastapi` (backend sin frontend) | **service** |
| Hay frontend (expo, react-vite, nextjs) | **app** |
| `package.json` con `"main"`/`"exports"` y sin app/servidor (paquete publicable) | **library** |
| No está claro | pregunta: ¿`app`, `service` o `library`? |

Cada tipo crea un set de carpetas distinto:

| Tipo | Carpetas |
|---|---|
| **app** | architecture · business · decisions · prds · plans · legal |
| **service** | architecture · decisions · prds · plans · **api · integrations · runbooks** |
| **library** | architecture · decisions · prds · plans · **api · references** |

> Por qué: una **app** tiene reglas de negocio y temas legales; un **service**/API es consumido por otros (necesita contrato `api/`, guías de `integrations/` y `runbooks/` operacionales); una **library** expone una API pública y suele apoyarse en `references/`.

## Paso 1 — Crea las carpetas del tipo elegido

```bash
# app
mkdir -p docs/{architecture,business,decisions,prds,plans,legal}
# service
mkdir -p docs/{architecture,decisions,prds,plans,api,integrations,runbooks}
# library
mkdir -p docs/{architecture,decisions,prds,plans,api,references}
```

> Si el usuario quiere carpetas extra de otro tipo (ej. una app que también expone API → agrega `api/`), créalas. La tabla es un default, no una cárcel.

## Paso 1.5 — Asegura el `.gitignore`

skipper escribe estado local de máquina que **nunca** debe commitearse: scratch de hooks (`.claude/.skipper-*`: timestamps de throttle, estado de sesión, locks) y el índice derivado (`.skipper/`). Si quedan trackeados, ensucian el diff en cada run. Asegúralo (idempotente — no dupliques líneas ya presentes):

```bash
gi=.gitignore
for e in '.claude/.skipper-*' '.skipper/'; do
  { [ -f "$gi" ] && grep -qxF "$e" "$gi"; } || printf '%s\n' "$e" >> "$gi"
done
```

> El hook `session-start.sh` ya hace esto automáticamente en cada sesión; aquí solo se garantiza durante el init. Si estos archivos ya estaban **trackeados** en el repo, además corre `git rm -r --cached .claude/.skipper-* .skipper/ 2>/dev/null` una vez (el `.gitignore` no destrackea lo ya commiteado).

## Paso 2 — README de cada carpeta

Escribe un `README.md` por carpeta. **Carpetas base (todos los tipos):**

**`docs/decisions/README.md`**:
```markdown
# Architecture Decision Records (ADRs)

Decisiones técnicas con tradeoffs reales que aplican >1 vez en el proyecto.

## Cuándo crear un ADR

- Elección de librería/framework con alternativas válidas
- Cambio de patrón arquitectónico
- Integración con servicio externo
- Deprecación de algo en uso

## Cuándo NO

- Refactors menores
- Decisiones triviales
- Algo que ya está documentado en architecture/

## Formato

Numeración 4 dígitos secuencial: `0001-titulo-en-kebab.md` (convención MADR). Campos: Status · Date · Deciders · Context and problem statement · Decision drivers · Decision · Alternatives considered · Consequences · Confirmation.

## Ciclo de vida (Status)

`Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN`

## Inmutabilidad

Un ADR **Accepted no se reescribe** — es historia. Si la decisión cambia, **supersédelo**: `/skipper:supersede-adr <número-viejo> "título nuevo"` marca el viejo como `Superseded by`, crea el reemplazo con `Supersedes`, y enlaza ambos. Para retirar sin reemplazo, cambia su Status a `Deprecated`.

## Índice

(Se completa automáticamente con `/skipper:new-adr` y `/skipper:supersede-adr`)
```

**`docs/prds/README.md`**:
```markdown
# Product Requirement Documents (PRDs)

Un PRD por feature de scope > 1 día, escrito ANTES de implementar.

## Estructura

Problem → Users → Goals → Non-goals → Requirements (Must/Should/Won't) → Open questions.

## Índice

(Se completa con `/skipper:new-prd`)
```

**`docs/plans/README.md`**:
```markdown
# Planes de implementación

Trabajo de varias sesiones que necesita persistir entre conversaciones.

## Status

- **Active**: en curso
- **Done**: completado (mover a archivo separado o borrar)
- **Abandoned**: descartado

## Índice

(Se completa con `/skipper:new-plan`)
```

**`docs/architecture/README.md`**:
```markdown
# Documentación técnica

Cómo funciona cada subsistema. Un archivo por dominio (auth, sync, pagos, etc.).

Mantén cada archivo bajo 200 líneas. Material denso → archivos auxiliares.
```

---

**Carpetas de tipo `app`:**

**`docs/business/README.md`**:
```markdown
# Reglas de negocio

Pricing, onboarding, defaults, security, brand identity.

Cada archivo lleva un histórico de cambios al final con link al ADR cuando aplique.
```

**`docs/legal/README.md`**:
```markdown
# Legal

Términos, privacidad y notas legales del producto. Mantén la fuente de verdad linkeada (Notion/abogado) y un resumen aquí.
```

---

**Carpetas de tipo `service`:**

**`docs/api/README.md`**:
```markdown
# API pública

Contrato HTTP para consumidores externos de este servicio. Un archivo por área transversal.

Sugeridos: `auth.md`, `endpoints.md`, `errors.md`, `idempotency.md`, `pagination.md`, `webhooks.md`.

Regla: el shape de request/response y los error codes son un **contrato**. Si cambian en el código, se actualizan aquí en el mismo PR.
```

**`docs/integrations/README.md`**:
```markdown
# Integraciones

Guía paso a paso para cada consumidor real del servicio (server-to-server, widget, app cliente).

Un archivo por consumidor (`<consumidor>-consumer.md`): env vars, código de adapter, endpoints a implementar, manejo de errores y **bugs conocidos**.
```

**`docs/runbooks/README.md`**:
```markdown
# Runbooks

Operación del proyecto: cómo levantarlo, monitorearlo y resolver incidentes.

Sugeridos: `local-dev.md` (setup local reproducible), `operations.md` (monitoreo, escalado, incidentes), runbooks por integración (proxy, colas, deploy).

Un runbook responde "¿cómo hago X?" con pasos copiables, no con teoría.
```

---

**Carpetas de tipo `library`:**

`docs/api/README.md` → usa el mismo de `service` (contrato público de la librería).

**`docs/references/README.md`**:
```markdown
# Referencias

Material externo que consultamos pero del que NO dependemos (snapshots de repos, specs de terceros).

Marca siempre **fecha del snapshot** y **fuente**. No es un import — es un mapa de lectura.
```

> `docs/research/` es opcional (cualquier tipo): investigación técnica consolidada antes de decidir. Si el usuario la pide, crea `docs/research/README.md` con: "Investigación previa a decidir (comparativas, patrones de competidores, spikes). Al cerrar en decisión, enlázala desde el ADR resultante."

## Paso 3 — `docs/index.md` (TOC global)

Crea el índice con **sólo las secciones del tipo elegido**. Ejemplo para `app`:

```markdown
# Documentación del proyecto

## Architecture
(links a docs/architecture/*.md)

## Business
(links a docs/business/*.md)

## Decisions (ADRs)
Ver [decisions/README.md](decisions/README.md)

## PRDs
Ver [prds/README.md](prds/README.md)

## Plans
Ver [plans/README.md](plans/README.md)

## Legal
(links a docs/legal/*.md)
```

Para `service`, reemplaza Business/Legal por **API**, **Integrations** y **Runbooks**. Para `library`, por **API** y **References**.

## Paso 4 — `docs/README.md` (protocolo)

```markdown
# Protocolo de documentación

Estructura mantenida con el plugin [`skipper`](https://github.com/cristiandonnachie/skipper). Tipo de proyecto: **<TIPO>**.

## Cuándo actualizar qué

| Cambio | Doc | Comando |
|---|---|---|
| Decisión arquitectónica con tradeoffs | ADR en `decisions/` | `/skipper:new-adr "título"` |
| Feature nuevo (scope >1 día) | PRD en `prds/` | `/skipper:new-prd "título"` |
| Trabajo multi-sesión | Plan en `plans/` | `/skipper:new-plan "título"` |
| Subsistema técnico | Doc en `architecture/` | manual o `/skipper:update` |
| Regla de negocio (app) | Doc en `business/` | manual o `/skipper:update` |
| Cambio de contrato HTTP (service/library) | Doc en `api/` | manual, **en el mismo PR** |
| Nuevo consumidor (service) | Doc en `integrations/` | manual |
| Procedimiento operacional (service) | Runbook en `runbooks/` | manual |

## Salud de la documentación

- `/skipper:update`      → revisa git diff y propone qué documentar.
- `/skipper:docs-doctor` → diagnostica obsolescencia, stubs y links rotos.
- `/skipper:stack-sync`  → revisa que el stack declarado coincida con package.json.
```

## Paso 5 — Sugerir sección en `CLAUDE.md`

Si existe `CLAUDE.md`, sugiere agregar (sin duplicar):

```markdown
## Documentación

Estructura mantenida por plugin `skipper`. Ver [docs/README.md](docs/README.md).
```

## Paso 6 — Ofrecer aplicar perfil de stack

Con el JSON del detector (del paso 0), procede según `confidence`:

- **`high` + no ambiguo** → "Para aplicar el perfil opinado al CLAUDE.md, corre `/skipper:stack-apply <stack>`".
- **`medium` / `low`** → reporta candidato + señales, pregunta si aplicar o prefiere otro.
- **`ambiguous: true`** → lista frontends, pregunta cuál es el principal.
- **`none`** → reporta y lista stacks disponibles.

NO ejecutes `stack-apply` directamente — sólo reporta el siguiente paso.

## Reglas

- Si las carpetas ya existen, NO sobreescribas — sólo reporta y termina.
- Si CLAUDE.md ya tiene sección "Documentación", no la dupliques.
- Reporta al final: tipo de proyecto elegido, qué carpetas creaste, qué saltaste y qué stack se detectó.
- Si el detector falla o el repo no es soportado, sigue igual — la detección es opcional.
