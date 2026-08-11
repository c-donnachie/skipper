# 0026 — Superficies de config: archivos = verdad, CLI determinista infiere, UI = proyección paga

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Accepted
- **Date**: 2026-08-11
- **Deciders**: @c-donnachie

## Context and problem statement

El pipeline SDD (PRD-0006) y las mockups (wizard de setup, DoD board, panel de arquitectura/laws) abren una pregunta que atraviesa todo el producto: **dónde vive la config, quién la infiere y renderiza (código determinista vs LLM), y qué es libre vs pago.** Sin fijarlo, cada superficie nueva puede driftear la fuente de verdad, paywallear la cuña de onboarding, o erosionar lo opinado que distingue a Skipper.

## Decision drivers

- **Open-core fence** (ADR-0014/0021): no paywallear el engine ni la cuña (onboarding es donde se siente el dolor — ADR-0020).
- **Opinado** (ADR-0003): elección por **preset**, no por toggles infinitos.
- **Determinismo/reproducibilidad**: la config debe ser auditable, testeable (golden) y barata — no depender de la varianza del LLM.
- **Agent-native**: el LLM es glue fino, el engine hace el trabajo pesado.
- **Nuevo vs existente**: el setup debe **clasificar el repo** y adaptarse (greenfield ≠ brownfield).

## Decision

**Opción B — CLI determinista-first, archivos = verdad, LLM conduce, UI = proyección paga.**

1. **Los archivos del repo son la fuente de verdad**: SPEC md + `CLAUDE.md` (laws) + un **policy/DoD file commiteado** (no bajo el `.skipper/` gitignoreado — ver ADR-0025; va en config commiteada tipo `skipper.config.*` o bloque en `CLAUDE.md`).
2. **El binario `skipper` (determinista) infiere / renderiza / aplica** los bloques —detección de stack (algoritmo existente), presets, DoD— "como una dependencia": salida estructurada, reproducible, con golden tests. Expone `skipper setup --detect|--presets|--apply`.
3. **El LLM/skill (`/skipper:setup`) solo conduce**: captura elecciones y resuelve lo difuso (reglas en lenguaje natural, "¿qué preset para este monorepo?"). No infiere ni renderiza lo determinista.
4. **Clasificación greenfield/brownfield** (determinista): repo vacío/sin código → **scaffold desde preset**; codebase existente → **analiza, infiere el estado actual y marca dónde hay más trabajo** (retrofit de laws/SPECs; conecta con el `infer` diferido de ADR-0024).
5. **La UI (wizard, DoD board, laws panel) es una proyección PAGA** (Platform, Stage 2 — ADR-0020/0023) que **escribe de vuelta a los archivos**, nunca la única fuente. El onboarding libre vive en el engine (TUI / `/skipper:setup`).

## Alternatives considered

- **A — LLM-driven / config conversacional.** Rápido y flexible. NO elegida: no reproducible, caro en tokens, no testeable, alucinable; la config no tiene hogar durable.
- **C — UI-first / config vive en la Platform.** Linda, buena para no-devs. NO elegida: **paywallea el onboarding** (la cuña), rompe el fence (ADR-0021), no funciona offline/local, forkea la verdad fuera del repo.

## Consequences

### Positivas
- Config **reproducible, testeable y barata**; la detección/render no gastan tokens ni alucinan.
- **La cuña (onboarding) queda libre**; la verdad queda en el repo (self-hosteable).
- El setup **se adapta a nuevo vs existente** — expectativa honesta de cuánto trabajo falta.
- La UI hermosa existe, pero como proyección → no compromete el open-core.

### Negativas / costos
- **Trabajo de engine upfront**: subcomando `skipper setup`, formato del policy-file, mapeo preset→DoD, clasificador greenfield/brownfield.
- **Disciplina continua**: la UI nunca puede volverse la única forma de configurar (tentación de producto).
- El análisis brownfield es intrínsecamente más difícil (parcial, aproximado).

### Qué hay que vigilar
- Que el policy-file **no** termine bajo `.skipper/` gitignoreado (repetir el bug de los receipts).
- Que no crezca el número de toggles → erosión de "opinado".
- Que la UI (Stage 2) escriba de vuelta a los archivos sin driftear.

## Confirmation

Golden tests sobre `skipper setup --detect|--presets` (salida determinista). Fitness: correr setup dos veces sobre el mismo repo produce el mismo policy-file. La UI (cuando exista) se valida mostrando que un cambio en el board se refleja como diff en el archivo commiteado.

## More information

- Gobernado por: [ADR-0003 — CLAUDE.md opinado](0003-strongly-opinionated-claude-md.md) · [ADR-0014](0014-open-core-boundary.md)/[0021](0021-open-core-fence.md) — open-core fence · [ADR-0020](0020-platform-staging-vision-north-star.md)/[0023](0023-platform-separate-closed-repo.md) — platform staging
- Relacionado: [ADR-0005 — Presets monolíticos](0005-monolithic-then-layers.md) · [ADR-0024 — SPEC vivo](0024-spec-anchored-sdd-living-spec.md) (el `infer` brownfield) · [ADR-0025 — Receipt in-repo](0025-content-bound-receipt-rdd.md) (dónde NO poner el policy-file)
- Consumido por: [PRD-0006 — SDD verification pipeline](../prds/0006-sdd-verification-evidence-pipeline.md) (policy-as-file + `/skipper:setup`)
- Research: [sdd-spec-anchored-research.md](../business/sdd-spec-anchored-research.md)
