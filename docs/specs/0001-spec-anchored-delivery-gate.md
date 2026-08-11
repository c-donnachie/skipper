# 0001 — Spec-anchored delivery gate

<!-- SPEC vivo (ADR-0024): mutable, mantenido por Skipper. El ANCLA es el ID estable
     (SPEC-0001#AC-k), NO el contenido. El gate contrasta el diff contra los criterios de abajo. -->

- **Status**: Active
- **Last updated**: 2026-08-11
- **Implements**: PRD-0006 · ADR-0024 · ADR-0025

## Intent

Un cambio no llega a "Done" hasta que la evidencia demuestra que cumple los criterios de
aceptación, y esa aprobación queda atada al contenido exacto revisado (receipt content-bound).
Sin evidencia no hay verde; el gate nunca finge aprobación.

## Acceptance criteria

| ID   | Criterio (qué debe cumplirse)                                            | Método | Verificación (comando / cómo)          |
|------|-------------------------------------------------------------------------|--------|-----------------------------------------|
| AC-1 | El receipt es content-bound y determinista (mismo contenido → mismo hash)| test   | `node test/gate.mjs`                    |
| AC-2 | Cambiar un archivo cubierto invalida el receipt (`valid` → `stale`)       | test   | `node test/gate.mjs`                    |
| AC-3 | Sin receipt, el gate reporta `unmanaged` — nunca aprueba                  | test   | `node test/gate.mjs`                    |
| AC-4 | `manual`/`human`/`memory` sin artefacto ⇒ `unverified`, jamás verde (M5)  | test   | `node test/gate.mjs`                    |
| AC-5 | `fail` siempre bloquea; `unverified` según política (warn/block)          | test   | `node test/gate.mjs`                    |
| AC-6 | El engine sigue zero-dep y el suite completo pasa                         | static | `npm test` (engine)                     |

## Out of scope

- El delivery git-hook que corre `skipper gate validate` (PRD-0006 S1) — se ancla en su propio criterio cuando exista.
- La proyección UI del board (Stage 2, pago).
- `specs infer` y el sync inverso (v2, ADR-0024).

## Related

- Implements: [PRD-0006](../prds/0006-sdd-verification-evidence-pipeline.md) · [ADR-0024](../decisions/0024-spec-anchored-sdd-living-spec.md) · [ADR-0025](../decisions/0025-content-bound-receipt-rdd.md)
- Touched code: `engine/lib/receipt.mjs` · `engine/lib/evidence.mjs` · `engine/lib/config.mjs`
