# 0025 — Receipt content-bound in-repo para el gate duro (RDD)

<!-- Ciclo de vida del Status: Proposed → Accepted | Rejected → (luego) Deprecated | Superseded by ADR-NNNN -->
<!-- Inmutable: un ADR Accepted NO se reescribe. Si la decisión cambia, se supersede (/skipper:supersede-adr). -->

- **Status**: Accepted
- **Date**: 2026-08-11
- **Deciders**: @c-donnachie

## Context and problem statement

[ADR-0024](0024-spec-anchored-sdd-living-spec.md) decidió un **gate duro**: una divergence *major* contra un `SPEC` bloquea la entrega. [PRD-0006](../prds/0006-sdd-verification-evidence-pipeline.md) (M4/S1) necesita el mecanismo que haga eso barato y determinista: un **receipt** que pruebe *qué se revisó y evidenció*, y que los delivery gates puedan **revalidar sin re-correr** el review. Concepto tomado de gentle-ai/RDD ([research](../business/sdd-spec-anchored-research.md)).

Falta fijar tres piezas: (1) a qué contenido se liga el receipt, (2) dónde se persiste, (3) cómo se revalida en un git hook pelado. El gate corre en pre-commit/push/PR, donde **el motor de memoria puede no estar** (es opt-in, [ADR-0017](0017-memory-engine-separate-opt-in-package.md)).

## Decision drivers

- **Determinismo:** revalidar el receipt debe dar el mismo resultado sin re-ejecutar review ni tests.
- **Disponible en un git hook pelado**, sin depender del motor de memoria opt-in (ADR-0017).
- **Transparencia:** el humano debe poder ver qué se aprobó (revisable en el PR).
- **Honestidad (ADR-0024):** sin evidencia ≠ verde; review deshabilitado ⇒ `unmanaged`, nunca aprobación fingida.
- **No reabrir review para contenido sin cambios** (RDD).

## Decision

Un **receipt content-bound persistido in-repo**, con identidad git-native y espejo en el grafo.

**Forma del receipt** (JSON):
`{ content_hash, spec_criteria:[{id, verdict}], evidence_digest, review_verdict, risk_tier, issued_at_commit }`.

- **`content_hash`** = digest **determinista sobre los blob-hashes de git de los archivos cambiados** (sin wall-clock). Reproducible ⇒ revalidación estable.
- **Emisión:** solo si el review pasa **y** ningún criterio de aceptación está `fail` (gate de ADR-0024). Se **invalida** en cuanto `content_hash` deja de coincidir.
- **Persistencia:** fichero commiteado en **`.skipper/receipts/`** — **fuente de verdad**. Un receipt actual por rama/candidato (overwrite en cada re-freeze; no acumular). El **nodo SPEC del grafo guarda una referencia-espejo** (PRD-0006 M6) para consulta, pero **no** es la fuente de verdad.
- **Revalidación en el gate:** pre-commit/push/PR recomputa `content_hash` y compara con el receipt guardado → match ⇒ pasa sin re-correr; mismatch ⇒ inválido ⇒ bloquea / re-freeza. Review deshabilitado ⇒ el gate reporta `unmanaged` (no fabrica aprobación).

## Alternatives considered

- **B — git-notes (`refs/notes/skipper`).** Git-native, sin clutter en el working tree. NO elegida: las notes **no se fetchean por defecto** → frágiles e invisibles; fricción de tooling; no se ven en el diff del PR.
- **C — Solo nodo del grafo (motor de memoria).** Consultable, integrado al foso. NO elegida: la memoria es **opt-in** (ADR-0017) ⇒ el gate en un hook pelado no puede depender de ella; además puede driftear vs git y no funciona offline.
- **Ligar a tree-hash del commit** en vez de blobs de archivos cambiados. Descartado para v1: obliga a un commit antes de freezar; ligar a blobs del working/staged tree permite freezar el candidato **antes** de commitear (RDD).

## Consequences

### Positivas
- El gate duro se vuelve **barato y determinista**: revalida un hash, no re-corre el review.
- **Transparente y auditable**: el receipt viaja en el PR; "requisito → evidencia → aprobación" es visible.
- **Funciona sin el motor de memoria** — el grafo es un lujo (consulta), no una dependencia del gate.

### Negativas / costos
- Suma un archivo (`.skipper/receipts/`) al diff → puede generar ruido/merge conflicts.
- Definir bien `content_hash` (staged vs working tree, qué archivos entran) es delicado: mal hecho ⇒ **invalidaciones falsas** que frenan trabajo.
- Requiere **política de overwrite/prune** para no acumular receipts.
- El espejo en el grafo puede quedar **stale** vs el fichero (mitiga: el fichero manda).

### Qué hay que vigilar
- Tasa de invalidaciones falsas del `content_hash`.
- Ruido de merge del directorio de receipts (¿gitignore parcial? ¿un receipt por rama?).
- Que el espejo del grafo nunca se use como fuente de verdad del gate.
- Riesgo de manipulación: un receipt commiteado es editable a mano — evaluar firma/HMAC si se vuelve un control de seguridad (no en v1).

## Confirmation

Fitness function: cambiar un archivo cubierto por el receipt ⇒ `content_hash` cambia ⇒ el gate bloquea hasta re-freeze. Cambiar algo NO cubierto ⇒ receipt sigue válido (no reabre review). Review deshabilitado ⇒ gate reporta `unmanaged`, no "pass". Verificable en los e2e del gate (PRD-0006 S1).

## More information

- Gobernante: [ADR-0024 — SPEC vivo como ancla de SDD](0024-spec-anchored-sdd-living-spec.md)
- Consumido por: [PRD-0006 — SDD verification & evidence pipeline](../prds/0006-sdd-verification-evidence-pipeline.md) (M4, S1)
- Restricción: [ADR-0017 — Memory engine opt-in](0017-memory-engine-separate-opt-in-package.md) · hooks: [ADR-0009](0009-proactive-hooks-via-additional-context.md)/[0011](0011-dependency-and-subsystem-proactive-hooks.md)
- Research: [sdd-spec-anchored-research.md](../business/sdd-spec-anchored-research.md) (gentle-ai/RDD)
- Revisar: tras los primeros e2e del gate, si la tasa de invalidaciones falsas es alta o el ruido de merge molesta.
