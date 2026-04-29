---
description: Creates the initial docs/ structure (architecture, business, decisions, prds, plans, legal) with a protocol README.md in each folder, then detects the project stack and offers to apply an opinionated profile. Use once when adopting the plugin in a project.
allowed-tools: Read Write Edit Bash(mkdir *) Bash(ls *) Bash(${CLAUDE_PLUGIN_ROOT}/lib/detect.sh *)
---

# Init estructura de docs

Crea la estructura completa para empezar a usar `skipper` en un proyecto.

## Pasos

### 1. Crear carpetas

```bash
mkdir -p docs/{architecture,business,decisions,prds,plans,legal}
```

### 2. Escribir README de cada carpeta

Cada carpeta lleva un `README.md` que explica qué va ahí:

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

Numeración 4 dígitos secuencial: `0001-titulo-en-kebab.md`. Status: Proposed → Accepted → Superseded.

## Índice

(Se completa automáticamente con `/skipper:new-adr`)
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

**`docs/business/README.md`**:
```markdown
# Reglas de negocio

Pricing, onboarding, defaults, security, brand identity.

Cada archivo lleva un histórico de cambios al final con link al ADR cuando aplique.
```

### 3. Crear `docs/index.md` (TOC global)

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

### 4. Crear `docs/README.md` (protocolo)

```markdown
# Protocolo de documentación

Estructura mantenida con el plugin [`skipper`](https://github.com/cristiandonnachie/skipper).

## Cuándo actualizar qué

| Cambio | Doc | Comando |
|---|---|---|
| Decisión arquitectónica con tradeoffs | ADR en `decisions/` | `/skipper:new-adr "título"` |
| Feature nuevo (scope >1 día) | PRD en `prds/` | `/skipper:new-prd "título"` |
| Trabajo multi-sesión | Plan en `plans/` | `/skipper:new-plan "título"` |
| Subsistema técnico | Doc en `architecture/` | manual o `/skipper:update` |
| Regla de negocio | Doc en `business/` | manual o `/skipper:update` |

## Auto-update

`/skipper:update` revisa git diff y propone qué actualizar.
```

### 5. Sugerir agregar sección a `CLAUDE.md`

Si existe `CLAUDE.md` en la raíz, sugiere al usuario agregar:

```markdown
## Documentación

Estructura mantenida por plugin `skipper`. Ver [docs/README.md](docs/README.md).
```

### 6. Detectar stack y ofrecer aplicar perfil

Una vez creada la estructura `docs/`, corre el detector:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/lib/detect.sh" "$(pwd)"
```

Parsea el JSON resultante y procede según `confidence`:

- **`high` + no ambiguo**: reporta el stack detectado y dile al usuario "Para aplicar el perfil opinado al CLAUDE.md, corre `/skipper:stack:apply <stack>`".
- **`medium` o `low`**: reporta el stack candidato y las señales — pregunta al usuario si quiere aplicarlo o prefiere uno diferente.
- **`ambiguous: true`** (≥2 frontends): lista los frontends detectados y pregunta cuál es el principal antes de sugerir.
- **`none`**: reporta "No detecté stack soportado" y lista los stacks disponibles. El usuario puede correr `/skipper:stack:apply <stack>` manualmente si quiere uno.

NO ejecutes `stack:apply` directamente — sólo reporta al usuario el siguiente paso.

## Reglas

- Si las carpetas ya existen, NO sobreescribas — sólo reporta y termina.
- Si CLAUDE.md ya tiene una sección "Documentación", no la dupliques.
- Reporta al final qué creaste, qué saltaste y qué stack se detectó.
- Si el detector retorna error o el repo no es soportado, sigue normalmente — la detección es opcional, no obligatoria.
