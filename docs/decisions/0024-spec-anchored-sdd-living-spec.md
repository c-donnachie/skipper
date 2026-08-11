# 0024 — SPEC vivo como ancla de SDD (spec-anchored, mutable, gate duro)

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Accepted
- **Date**: 2026-08-11
- **Deciders**: @c-donnachie

## Context and problem statement

Skipper quiere ofrecer **Spec-Driven Development anclado a spec**: que la spec sea el artefacto verificable contra el que se contrasta el trabajo del agente, no un doc que "debería" respetarse. Hoy Skipper ancla en decisiones y estructura (ADRs/PRDs, `CLAUDE.md`, laws por stack) — un ancla *documental y por convención*: nada bloquea cuando el código diverge.

El research de referencia ([sdd-spec-anchored-research.md](../business/sdd-spec-anchored-research.md), sobre Predictable Code y CodelyTV/agent-harness) da el modelo. Falta fijar 4 piezas acopladas: (1) qué es el ancla, (2) qué es el checker y si bloquea, (3) alcance del sync spec↔código, (4) si la inferencia de specs entra en v1. La tensión conceptual central: *"anchored" no puede significar "congelada"* — la spec debe ser **viva y mutable**, o se vuelve documentación muerta.

## Decision drivers

- **La spec es autoridad viva, no una foto congelada** — el código se verifica contra la spec *vigente*; el ancla es la *identidad estable* (ID), no el contenido.
- **Reusar el grafo tipado de docs** (memoria + ADR-0013) en vez de infra paralela.
- **Scope agent-first del MVP** (ADR-0015) — entregar el valor sin sobrecargar v1.
- **El ancla debe "morder"** — si diverger no tiene consecuencia, seguimos en convención.
- **Evitar el anti-patrón "el código siempre gana"** — si Skipper reescribe la spec sola para cuadrar con el código, la spec nunca atrapa un bug.

## Decision

Introducir un **tipo de doc nuevo `SPEC-NNNN`**, distinto de ADR/PRD por su lifecycle:

- **Vivo / mutable.** A diferencia del ADR (inmutable, se supersede) y del PRD (evoluciona lento, manual), un `SPEC` es un **contrato vivo mantenido por Skipper**. El **ancla es el ID estable** (`SPEC-0003`); el contenido evoluciona.
- **Sync bidireccional propuesto-por-Skipper / aprobado-por-humano.** Skipper detecta drift en ambas direcciones (código→spec ya existe vía `/skipper:update`+kowalski; se añade spec→marca-código) y **propone** el update. Un humano **aprueba la dirección**: *¿la spec cambió a propósito, o el código se desvió por error?* Automático = detección + propuesta; humano = decide quién tiene razón. Esto preserva la spec como autoridad y a la vez viva.
- **Checker = review anclado por agente.** `/skipper:review` contrasta el diff contra los criterios de aceptación de cada `SPEC` y reporta `divergence: SPEC-NNNN` (no un review genérico). **Sustituye la prueba formal en Lean** (foso de Predictable Code, ortogonal a Skipper) por juicio de agente.
- **Gate duro en v1.** Una *major divergence* bloquea el commit/PR; las *minor* vuelven como recomendación (patrón agent-harness). El ancla muerde desde el día 1.
- **Creación manual en v1; `infer` diferido a v2.** Los `SPEC` se crean vía un `/skipper:new-spec` (como ADR/PRD hoy). La inferencia automática de specs desde código existente (on-ramp de Predictable Code) es un acelerador, no un requisito → v2.

## Alternatives considered

- **A — Extender PRD con criterios de aceptación (advisory).** Cero infra nueva, reusa el grafo. NO elegida: un PRD no tiene semántica de "siempre fresco/vivo"; forzarle auto-mantenimiento mezcla dos lifecycles distintos, y advisory no hace morder el ancla.
- **C — Híbrido por fases (advisory v1 → gate v2).** Menor riesgo inicial. NO elegida: el usuario priorizó que el ancla muerda desde v1; posponer el gate deja el problema de "convención" sin resolver en el primer release.
- **Auto-sync puro (sin aprobación humana).** Más "automático". Rechazada explícitamente: el código siempre ganaría y la spec nunca atraparía un bug — mata el propósito del ancla.
- **Verificación formal estilo Lean 4.** Máxima garantía. Fuera de alcance: foso ortogonal, costo desproporcionado para el stack y el mercado de Skipper.

## Consequences

### Positivas
- La spec es **fuente de verdad viva**: verificable y siempre fresca, sin rotar como un wiki.
- El review pasa de genérico a **anclado por ID** — trazabilidad requisito↔código.
- El gate duro convierte "spec-anchored" en algo real, no aspiracional.
- Reusa memoria/`context_for` y el grafo tipado (el `SPEC` entra como nodo con aristas `implements`/`touches`).

### Negativas / costos
- **Tipo de doc nuevo** = comandos (`/skipper:new-spec`), template, índice, y soporte en review/update.
- **Gate duro arriesga falsos positivos** que frenen trabajo real → necesita calibración del juicio del agente.
- El sync inverso (spec→marca-código) es **pieza nueva** a construir.
- Sin `infer` en v1, adoptar SPECs en un codebase existente es manual.

### Qué hay que vigilar
- Tasa de **falsos positivos** del gate: si frena de más, degradar a advisory por severidad.
- Que el flujo propose/approve **no derive en auto-aprobar** (el anti-patrón "código gana").
- Solape conceptual `SPEC` vs `PRD`/criterios de aceptación — mantener la frontera clara.
- Reevaluar `infer` (v2) cuando haya SPECs manuales suficientes para validar el modelo.

## Confirmation

Code review + el propio `/skipper:review` anclado (dogfooding). Fitness: un PR con divergence *major* contra un `SPEC` debe fallar el gate. La frescura del `SPEC` se vigila con las health checks de drift existentes (ADR-0008).

## More information

- Research: [sdd-spec-anchored-research.md](../business/sdd-spec-anchored-research.md) (Predictable Code + agent-harness)
- ADR relacionados: [0008 — Doc/code drift health checks](0008-doc-code-drift-health-checks.md) · [0013 — MADR-aligned ADR lifecycle](0013-madr-aligned-adr-lifecycle.md) · [0015 — MVP scope, agent-first](0015-mvp-scope-agent-first.md) · [0018 — Proactive memory injection](0018-proactive-memory-injection.md)
- PRD: [0005 — Skipper Platform, Stage 1](../prds/0005-skipper-platform-stage1.md)
- Revisar: tras el primer ciclo de dogfooding del gate, y al decidir `infer` (v2).
