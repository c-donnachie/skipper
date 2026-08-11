# PRD 0006 — SDD verification & evidence pipeline (la mitad trasera)

- **Status**: Draft
- **Owner**: @Cristian Donnachie
- **Created**: 2026-08-11
- **Target date**: TBD

## Problem

Skipper es fuerte en la **mitad delantera** del ciclo (objetivo → decisión → arquitectura por stack → auto-doc → memoria) y un prototipo en la **mitad trasera** (verificar → gatear → **probar que funciona** → entregar). Hoy `/skipper:review` ancla en *laws de stack*, no en la spec; la sección "Confirmation" de un ADR es **aspiracional** (no corre nada); y nada bloquea un commit que viola una decisión. El hueco más caro es el **#9: evidencia de que el código realmente funciona** — lo que separa un *harness de documentación* de un *harness de desarrollo*.

Este PRD implementa la mitad trasera como un pipeline coherente sobre [ADR-0024](../decisions/0024-spec-anchored-sdd-living-spec.md) (SPEC vivo como ancla, gate duro): **SPEC con criterios de aceptación → review anclado → evidencia ejecutada → receipt content-bound → delivery gate**, todo colgado del grafo de memoria existente.

## Users

- **Dev + su agente Claude** — define specs y cambia código; quiere que el gate *muerda* sin re-litigar ni fingir aprobación.
- **Tech lead** — quiere trazabilidad "requisito → implementación → evidencia" sin montar infra de verificación formal.
- **El propio Skipper** (dogfooding) — primer consumidor del pipeline.

## Goals

- **G1** — Un dev puede declarar un **`SPEC-NNNN` vivo** con criterios de aceptación, cada uno con **sub-ID estable** y **método de verificación** declarado.
- **G2** — Al cambiar código, `/skipper:review` **contrasta el diff contra los criterios tocados** y reporta `divergence: SPEC-NNNN#AC-k` (no un review genérico).
- **G3** — Skipper **orquesta la verificación propia del stack** (el especialista sabe los comandos) y produce un **artefacto de evidencia** por criterio (`pass/fail/unverified` + output crudo).
- **G4** — Un **receipt content-bound** se emite solo si el review pasa **y** ningún criterio está `fail`; los delivery gates **revalidan el mismo receipt** sin re-correr (RDD).
- **G5** — **Honestidad por diseño**: sin evidencia ≠ verde; `unverified` se reporta, nunca se aprueba en silencio. Review deshabilitado ⇒ `unmanaged`, no "pasa".
- **G6** — Evidencia y receipt **se adjuntan al nodo SPEC en el grafo de memoria** → consultables y sujetos a drift (ADR-0008).

## Non-goals

- **NG1** — Skipper **no** construye un test runner ni reemplaza Vitest/Jest/Playwright/tsc — los **orquesta**.
- **NG2** — **No** verificación formal (Lean) — foso de Predictable Code, fuera de alcance permanente.
- **NG3** — **No** portabilidad cross-agente (gentle-ai) — Skipper es plugin de Claude Code.
- **NG4** — **No** `specs infer` (derivar SPECs del código) — v2 (diferido en ADR-0024).
- **NG5** — **No** sync inverso spec→marca-código más allá del review — v2 (ADR-0024).

## Requirements

### Must (Phase A — un SPEC evidenciado y gateado, punta a punta)
- **M1 — Artefacto SPEC.** `/skipper:new-spec` crea `docs/specs/NNNN-slug.md` (tipo **vivo** per ADR-0024) con **criterios de aceptación** estructurados; cada criterio lleva sub-ID estable (`SPEC-0003#AC-2`) y **método** declarado: `test | type | e2e | static | manual`.
- **M2 — Review anclado.** `/skipper:review` mapea el diff a los criterios de los SPEC tocados y reporta `divergence: SPEC-NNNN#AC-k` (extiende el routing de review actual, ADR-0019).
- **M3 — Evidence runner.** Por cada criterio, el especialista de stack corre el comando de verificación del proyecto y Skipper **captura el output crudo**; produce el artefacto `criterio → {método, comando, resultado, ref-output, commit}`.
- **M4 — Receipt content-bound.** Hash de (diff + evidencia). Se emite solo si review pasa y ningún criterio es `fail`. Persistido para que los gates revaliden el receipt idéntico sin re-correr.
- **M5 — Regla de honestidad.** Criterio sin método o sin corrida ⇒ `unverified` (nunca verde). El gate reporta `unverified` explícito.
- **M6 — Attach al grafo.** Evidencia + receipt se adjuntan al nodo SPEC (consultable: "¿SPEC-0003 evidenciado / fresco?").
- **M7 — Awareness proactiva (inyección incluye SPECs).** Extender el hook de memoria (ADR-0018): al editar un archivo con arista `touches` a un `SPEC`, `context_for(path)` inyecta el/los `SPEC-NNNN#AC-k` que lo gobiernan, junto a los ADR/PRD de hoy. Requiere enseñarle al hook el tipo de nodo `SPEC`. Opt-in (ADR-0017).
- **M8 — DoD policy-as-file (determinista).** Un **archivo commiteado** (config tipo `skipper.config.*` o bloque en `CLAUDE.md` — **NO** bajo el `.skipper/` gitignoreado, ADR-0025) declara los ítems de DoD a nivel proyecto: `{item, method (test|type|static|manual|memory|human), enabled}`, con **defaults fuertes por stack detectado**; los criterios por-SPEC extienden/overridean. El binario `skipper` lo infiere/renderiza/aplica (ADR-0026); el gate (M4/S1) lo lee.
- **M9 — `/skipper:setup` orquestador.** Skill conductor fino que encadena los pasos existentes (`scan` → `stack-apply`/preset → **DoD (M8)** → `index`) y clasifica **greenfield vs brownfield** (ADR-0026): repo nuevo → scaffold desde preset; existente → analiza y marca dónde falta trabajo. Happy path **skippable con defaults**; los pasos son el override. Lo determinista lo hace el CLI, no el LLM.

### Should (Phase B — gate real + ceremonia proporcional)
- **S1 — Delivery gate hook.** Pre-commit/pre-push valida que el receipt corresponde al contenido actual; mismatch ⇒ bloquea. Review deshabilitado ⇒ `unmanaged` (no aprueba). Coordina con hooks proactivos existentes (ADR-0009/0011).
- **S2 — Tiers de riesgo (4R).** Bajo = readback estructural silencioso; alto = lentes **Risk/Readability/Reliability/Resilience** + consent (patrón gentle-ai). Ceremonia proporcional.
- **S3 — Evidencia `manual`.** Integra el flujo `/verify`·`/run` para que un criterio `manual` capture "app corrió, se observó X" como evidencia.
- **S4 — Config de política.** `review mode enable/disable`; política de `unverified` (bloquea vs advierte) por SPEC o por proyecto.
- **S5 — Drift de evidencia.** Evidencia más vieja que el código que cubre ⇒ **stale**, vía las health checks existentes (ADR-0008).

### Won't (este PRD)
- **W1 — `specs infer`** (v2). **W2 — sync inverso completo** (v2). **W3 — Lean/formal** (permanente). **W4 — cross-agente** (permanente). **W5 — test framework propio** (permanente).

## Trigger policy (qué se autogatilla vs qué es comando)

Principio (de gentle-ai: *el tamaño/archivos/riesgo nunca seleccionan SDD por sí solos — solo petición explícita o propuesta aceptada*). Preserva la capa proactiva actual (ADR-0018/0019) sin imponer SDD en cada edición.

| Capa | Disparo | Requisito |
|---|---|---|
| **Awareness** (te avisa que tocás un SPEC) | **Auto** (hook, `additionalContext`) | M7 |
| **Crear SPEC** | **Comando explícito** (`/skipper:new-spec`) | M1 |
| **Review anclado + evidencia + freeze** | **Comando / nudge** (el hook lo *ofrece*, no fuerza) | M2/M3/M4 |
| **Delivery gate** (revalida receipt) | **Auto por git** (pre-commit/push); sin receipt gestionado ⇒ `unmanaged` | S1 |

Regla: **awareness = automático · ceremonia = explícita · gate = automático al entregar.**

## Decisiones que este PRD asume

- **Gobernante:** [ADR-0024](../decisions/0024-spec-anchored-sdd-living-spec.md) (SPEC vivo, gate duro).
- **Receipt:** [ADR-0025](../decisions/0025-content-bound-receipt-rdd.md) — receipt content-bound in-repo (`.skipper/receipts/`) que M4/S1 implementan.
- **Default de `unverified`:** advierte en Phase A, **bloquea** en Phase B (a confirmar en Q4).

## Open questions

- **Q1** — *Resuelto por [ADR-0025](../decisions/0025-content-bound-receipt-rdd.md):* receipt in-repo en `.skipper/receipts/` (fuente de verdad) + espejo en el grafo.
- **Q2** — *Resuelto:* la evidencia `manual` da `verified` **solo con artefacto capturado** (screenshot/log/output pegado); la sola narración del agente ⇒ `unverified` (preserva "trust por evidencia, no narrativa", RDD).
- **Q3** — ¿El gate vive en git hooks (entrega) o solo en `/skipper:review` (advisory→enforced)? Interacción con ADR-0009/0011.
- **Q4** — *Resuelto:* `unverified` **advierte en Phase A** (adopción) y **bloquea en Phase B**, con override por-SPEC para specs críticos. `fail` **siempre** bloquea (esto aplica solo al "todavía no verificado").
- **Q5** — Declaración del método por criterio: ¿inline en el `.md` del SPEC o inferido por el especialista?

## Related

- ADR: [0024 — SPEC vivo como ancla de SDD](../decisions/0024-spec-anchored-sdd-living-spec.md) (gobernante) · [0025 — Receipt content-bound](../decisions/0025-content-bound-receipt-rdd.md) · [0026 — Superficies de config (CLI determinista)](../decisions/0026-config-surfaces-deterministic-cli-files-truth.md) · [0008 — Drift health checks](../decisions/0008-doc-code-drift-health-checks.md) · [0009](../decisions/0009-proactive-hooks-via-additional-context.md)/[0011](../decisions/0011-dependency-and-subsystem-proactive-hooks.md) — hooks proactivos · [0019 — Auto-routing de especialista](../decisions/0019-proactive-specialist-auto-routing.md) · [0004 — Especialistas escriben](../decisions/0004-specialists-can-write.md)
- Research: [sdd-spec-anchored-research.md](../business/sdd-spec-anchored-research.md) (Predictable Code · agent-harness · gentle-ai/RDD)
