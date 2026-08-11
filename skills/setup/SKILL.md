---
description: Guided one-time Skipper setup — detects stack, picks an architecture preset, writes the Definition-of-Done policy, and (optionally) indexes memory. Classifies new vs existing project. The deterministic CLI infers/renders; this skill only conducts.
argument-hint: [optional notes]
allowed-tools: Read Write Edit Grep Glob Bash(git *) Bash(ls *) Bash(skipper *) Bash(cat *)
---

# Skipper :: Setup

Onboarding de una vez. **Regla de oro (ADR-0026):** lo determinista lo hace el binario `skipper`
y los skills existentes — vos (el LLM) sólo **conducís** y resolvés juicio/lenguaje natural.
**Happy path skippable:** ofrecé "aplicar todo lo recomendado" en un paso; los 6 pasos son el override.

## Contexto (determinista)

- Commits: !`git rev-list --count HEAD 2>/dev/null || echo 0`
- Archivos de código (aprox): !`git ls-files 2>/dev/null | grep -cE '\.(ts|tsx|js|jsx|py|go|rs|java|kt)$' || echo 0`
- CLAUDE.md presente: !`test -f CLAUDE.md && echo sí || echo no`
- Config existente: !`test -f skipper.config.json && echo sí || echo no`

## Paso 0 — Clasificar el repo (greenfield vs brownfield)

- **0 commits / ~0 archivos de código** → **greenfield**: scaffold completo desde el preset, sin retrofit.
- **Con historia y código** → **brownfield**: esperá *trabajo de retrofit*; al final reportá los gaps.

## Pasos

1. **Detect stack** → `/skipper:scan` (determinista). Mostrá los chips (candidato, confianza, señales). No inventes.
2. **Architecture** → mostrá los presets con el **recomendado** según el stack, y aplicá con `/skipper:stack-apply <id>`.
   Es "elegí UN preset opinado", no toggles sueltos.
3. **Guardrails · DoD** → escribí el policy-file:
   ```bash
   skipper config init --preset=<id>     # escribe skipper.config.json (committed, NO bajo .skipper/)
   skipper config show                   # muestra el DoD efectivo
   ```
   Los defaults son fuertes por stack (TS → agrega type-check). Ajustá al margen sólo si el usuario lo pide.
4. **Index memory** (opt-in, ADR-0017) → ofrecé `skipper index`. Si el usuario no quiere memoria, saltá — el gate igual funciona (receipt in-repo).
5. **Ready** — resumen. En **brownfield**, reportá el retrofit pendiente (determinista donde puedas):
   - imports que cruzan capas mal (según el preset) → candidato a `/skipper:stack-doctor`
   - ADRs referenciados en código pero ausentes en `docs/decisions/`
   - `0 SPECs` → el gate no tiene a qué anclarse → sugerí `/skipper:new-spec`

## Reglas

- **No paywallees la cuña**: todo esto es del engine **libre**. La UI (wizard/board) es proyección paga (Stage 2), fuera de acá.
- **Determinista primero**: detección, DoD defaults y análisis brownfield salen del CLI/skills, no de tu memoria.
- **Preset-driven, no toggle-driven** (ADR-0003): preservá lo opinado.
- Si ya hay `skipper.config.json`, no lo pises — mostralo y preguntá si se ajusta algo.
- Cerrá con los próximos pasos reales: `/skipper:new-spec` · `/skipper:review`.
