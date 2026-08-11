# SDD spec-anchored — research de referencia

> Notas de investigación que alimentan las decisiones de producto sobre **Spec-Driven Development anclado a spec** para Skipper. No es un ADR ni un PRD: es la evidencia previa. Las decisiones se capturan por separado (ver *Decisiones tomadas* al final: ADR-0024, ADR-0025, PRD-0006).
> Última actualización: 2026-08-11.

## Por qué esto

Skipper quiere ofrecer **SDD spec-anchored**: que la spec sea el ancla contra la que se verifica el trabajo del agente, no un doc que "debería" respetarse. Hoy Skipper ancla en **decisiones y estructura** (ADRs/PRDs, `CLAUDE.md`, laws por stack) — un ancla *documental y por convención*: el agente debería respetarla, pero **nada bloquea** cuando el código diverge. Estos tres productos resuelven justo ese gap desde ángulos distintos.

---

## Fuente 1 — Predictable Code (Predictable Machines)

**Qué es:** plataforma de **verificación formal** que comprueba que el código —lo escriba humano o IA (Claude/Copilot/Codex)— **cumple una spec**. No genera código: lo *verifica*. Construido sobre **Lean 4** + LLMs para verificar código en cualquier lenguaje target. En private beta (public beta Q2 2026, GA Q3 2026). Cuña de mercado: industrias reguladas (fintech, salud, aeroespacial).

**Tesis:** la generación con IA *fragmenta el contexto* — cada generación ocurre con lo que cabe en el prompt, cada persona promptea distinto, los requisitos evolucionan y el código ya generado "no se entera" → **drift acumulado**. Respuesta: requisitos como **constraints machine-checked** que aplican a todo cambio.

**Modelo (lo rescatable):**
1. **`predictable init` → `predictable specs infer`** — infiere specs formales (invariantes, precondiciones, postcondiciones) **desde el código existente**. No exige escribir specs a mano: extrae "lo que el código ya promete". Habilita **adopción incremental** (empiezas por módulos críticos).
2. **Verificación continua** — cada cambio se chequea contra la spec; reporta **divergence** con el ID exacto del requisito violado.
3. **Bidirectional sync** — código, spec y docs formalmente ligados: cambias código → docs se actualizan; cambias un requisito → marca el código que dejó de cumplir.
4. **Audit-ready proofs** — cadenas requisito → implementación → verificación.

**Superficies (idénticas a la topología de Skipper):** CLI (`predictable verify` local, pre-commit) · GitHub App (status check que bloquea el PR) · Claude Code plugin (verifica dentro de la conversación).

**El ancla es un ID estable:** `REQ-0001`, `REQ-0003`, `REQ-0007`. Ejemplos de divergence: *"REQ-0003 diverge: session timeout es 30m pero la spec pide 15m"*, *"REQ-0007 (rate limit header) diverge → bloquea merge"*.

**Foso propio (no adoptable tal cual):** prueba formal en Lean 4. Caro y potente; ortogonal a lo que Skipper necesita.

## Fuente 2 — CodelyTV / agent-harness (contract-first loop)

**Qué es:** framework centralizado (skills, plugins, hooks) compartido entre agentes (Claude/Cursor/Copilot) con `AGENTS.md` como single source of truth symlinkeado a cada agente. Instala vía `npx skills@latest add codelytv/agent-harness` o plugin de Claude Code.

**Lo relevante — el loop RPI / contract-first de cinco verbos:**
`/harness-setup` → `/harness-plan` → `/harness-work` → `/harness-review` → `/harness-release`. Cada verbo es un **gate deliberado**, no un handoff continuo.

- **Dos ficheros autoritativos:** `spec.md` (el *contrato de producto*: qué debe seguir siendo verdad) y `Plans.md` (el ledger de tareas/estado).
- **`/harness-plan`** genera scope, **criterios de aceptación**, dependencias y stop conditions. *"El trabajo del usuario es aprobar o corregir, no escribir el plan a mano."* **Ninguna línea de código se escribe sin sign-off explícito del contrato** → mata el scope creep silencioso.
- **`/harness-work`** implementa **una slice aprobada a la vez**. *"Rechaza expansión silenciosa de scope"*: si la implementación excede la fila de tarea aprobada, **se detiene y pide aclaración**.
- **Vertical slices > horizontal layers** para trabajo de agente (mock API → front → DB con checkpoints, no "toda la DB, luego toda la API").
- **`/harness-review`** es una **fase separada** de la implementación (revisor ve el trabajo fresco). *"Major findings bloquean; minor findings vuelven como recomendaciones."*
- **`/harness-release --dry-run`** valida changelog, versión sincronizada, tags y **evidencia empaquetada** antes de liberar.
- **Principio de fondo:** *"la data que el agente no ha visto directamente queda desconocida en vez de inventada silenciosamente."* El loop convierte el desarrollo en **recolección de evidencia** con gates que fuerzan honestidad sobre scope y capacidad.

## Fuente 3 — Gentleman-Programming/gentle-ai (RDD)

**Qué es:** **configurador de ecosistema** (binario Go, MIT, ~5.6k★) que inyecta la misma metodología en N agentes ya instalados (Claude/Cursor/Copilot/Codex/OpenCode/Windsurf/Qwen/Pi): memoria (Engram), SDD, skills, MCP, model routing, persona y review acotado. Lema: *"cuanto menos pienses en gentle-ai después de instalarlo, mejor funciona."* SDD es **opt-in** y se enruta por *complejidad*, no por riesgo percibido (Organic / Delegated / SDD).

**Lo relevante — RDD (Receipt-Driven Development), la joya:**
- El review acotado **congela un candidato una sola vez** y emite **un receipt content-bound** (ligado al hash del contenido). **Cada gate de entrega** (commit/push/PR/release) valida el **mismo receipt idéntico**; *el review nunca se reabre para contenido sin cambios.*
- Si el contenido cambia, el receipt se invalida → re-freeze. Sin "replay de budget" ni aprobación fabricada.
- **Trust verificable, no narrativa:** lo que se confía se deriva de *evidencia*, no de que el agente diga "ya revisé".
- Review escalonado por riesgo: bajo = readback estructural silencioso; alto = **4R (Risk/Readability/Reliability/Resilience)** + consent. **One-candidate bound:** ante hallazgos severos, *una* corrección; el receipt se emite recién cuando el fix valida.
- **Disabled ≠ approved:** review deshabilitado ⇒ los gates reportan `disabled/unmanaged`, no fingen aprobación.

**No adoptable:** la maquinaria multi-agente / 8-componentes / binario Go — producto distinto (portabilidad cross-agente). El foso de Skipper es el grafo tipado de decisiones + memoria, no la portabilidad.

---

## Síntesis para Skipper — qué rescatamos

Los dos productos validan la dirección "spec-anchored" y, juntos, cubren los dos lados que a Skipper le faltan:

| Pieza | Predictable Code | agent-harness | Estado en Skipper |
|---|---|---|---|
| **Ancla con ID estable** | `REQ-NNNN` | `spec.md` + criterios de aceptación | Tiene `ADR-NNNN`/`PRD-NNNN` inmutables — falta decidir el tipo de ancla de spec |
| **Gate de aprobación pre-código** | — | `/harness-plan` (sign-off del contrato) | `/skipper:goal` grilla el objetivo, pero **no bloquea** hasta aprobar |
| **Checker de conformidad (divergence-por-ID)** | Lean 4 | `/harness-review` (fase separada) | `/skipper:review` existe pero ancla en *laws de stack*, no en spec |
| **Anti scope-creep en implementación** | — | `/harness-work` (una slice, se detiene si excede) | No existe |
| **Bidirectional sync (spec↔código)** | sí | parcial (spec.md autoritativo) | Media pieza: `/skipper:update`+kowalski hacen código→doc; **falta doc→código** |
| **Infer-first (on-ramp)** | `specs infer` desde código | — | No existe; `init-structure` podría ganarlo |
| **Receipt content-bound (RDD)** | — | evidencia empaquetada | gentle-ai lo formaliza → adoptado en [ADR-0025](../decisions/0025-content-bound-receipt-rdd.md) |
| **Evidencia de que funciona (#9)** | pruebas formales (Lean) | evidence packaging | El hueco más caro → resuelto por [PRD-0006](../prds/0006-sdd-verification-evidence-pipeline.md) |
| **Review escalonado por riesgo / disabled≠approved** | — | major bloquea / minor recomienda | gentle-ai (4R) → PRD-0006 S2 + regla de honestidad |

**Adoptable sin foso formal:** el modelo entero de Predictable Code —ancla con ID estable, divergence-por-ID, bidirectional sync, infer-first— más el loop de gates de agent-harness (plan→aprobar→work-una-slice→review-separado), **sustituyendo "prueba en Lean" por "review anclado por agente".** Eso es SDD spec-anchored realista para el stack de Skipper.

**Los gaps de mayor valor / menor costo de imitar:**
1. **Divergence-por-ID en el review** — `/skipper:review` reporta `divergence: SPEC-0003` contra criterios de aceptación, no un review genérico.
2. **Bidirectional sync inverso** — cambiar una spec **marca** el código que ya no cumple (la dirección que hoy falta).
3. **Gate de aprobación del contrato** antes de escribir código (de agent-harness).
4. **`infer` como on-ramp** — inferir specs del código existente para adopción incremental.

## Decisiones tomadas (este research las alimentó)

- **[ADR-0024](../decisions/0024-spec-anchored-sdd-living-spec.md)** — `SPEC-NNNN` vivo como ancla (ID estable, contenido mutable, mantenido por Skipper), review anclado por agente, **gate duro**; `infer` y sync inverso completo diferidos a v2.
- **[ADR-0025](../decisions/0025-content-bound-receipt-rdd.md)** — receipt **content-bound in-repo** (`.skipper/receipts/`) que los delivery gates revalidan sin re-correr; espejo en el grafo; `disabled ⇒ unmanaged`.
- **[PRD-0006](../prds/0006-sdd-verification-evidence-pipeline.md)** — la mitad trasera del pipeline: SPEC con criterios → review anclado → **evidencia ejecutada (#9)** → receipt → delivery gate.

Sigue abierto para v2: `specs infer` (on-ramp) y el sync inverso completo spec→marca-código.

## Fuentes

- Predictable Code — landing: https://code.predictablemachines.com/
- Predictable Machines — home: https://predictablemachines.com/
- "Why We Chose Lean for Predictable Code": https://predictablemachines.com/blog/why-we-chose-lean-for-predictable-code/ *(blog devuelve 403 al fetch; detalles vía snippets de búsqueda)*
- CodelyTV/agent-harness: https://github.com/CodelyTV/agent-harness
- "How Claude Code Harness turns agent coding into a contract-first delivery loop": https://alphasignalai.substack.com/p/how-claude-code-harness-turns-agent
- Gentleman-Programming/gentle-ai (RDD): https://github.com/Gentleman-Programming/gentle-ai · docs: https://deepwiki.com/Gentleman-Programming/gentle-ai

## Related

- ADR: [0008 — Doc/code drift health checks](../decisions/0008-doc-code-drift-health-checks.md) · [0013 — MADR-aligned ADR lifecycle](../decisions/0013-madr-aligned-adr-lifecycle.md) · [0015 — MVP scope, agent-first](../decisions/0015-mvp-scope-agent-first.md)
- PRD: [0005 — Skipper Platform, Stage 1](../prds/0005-skipper-platform-stage1.md)
