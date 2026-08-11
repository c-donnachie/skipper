# SDD pipeline ↔ memory layer

> Cómo el pipeline de verificación SDD ([PRD-0006](../prds/0006-sdd-verification-evidence-pipeline.md): SPEC → review anclado → evidencia → receipt → gate) se integra con la capa de memoria ([platform-memory.md](platform-memory.md)). Gobernado por [ADR-0024](../decisions/0024-spec-anchored-sdd-living-spec.md) (SPEC vivo) y [ADR-0025](../decisions/0025-content-bound-receipt-rdd.md) (receipt in-repo).
> Última actualización: 2026-08-11.

## Regla de oro (no cambia)

**La fuente de verdad es el repo** — markdown de `docs/`, código, y el receipt commiteado en `.skipper/receipts/`. El **grafo es una proyección derivada y desechable**, regenerable con `skipper index`. El grafo *lee*, nunca *reemplaza*.

## Qué le suma el pipeline SDD al grafo

El pipeline **produce nodos y aristas nuevos** que antes no existían:

| Nodo nuevo | De dónde sale |
|---|---|
| `SPEC-NNNN` | `docs/specs/*.md` (parser, como ADR/PRD) |
| `evidence` | artefacto del evidence-runner (PRD-0006 M3) |
| `receipt` | `.skipper/receipts/*.json` (PRD-0006 M4 / ADR-0025) |

| Arista nueva | Señal |
|---|---|
| `implements` (`SPEC → PRD/ADR`) | links en el `Related` del SPEC |
| `touches` (`SPEC#AC-k → archivos`) | mapeo criterio→paths del review anclado (M2) |
| `evidences` (`SPEC#AC-k → evidence`) | resultado del runner por criterio |
| `attests` (`receipt → SPEC@content_hash`) | emisión del receipt (M4) |

Esto habilita **preguntas nuevas** que antes eran imposibles:

- *"¿qué SPECs están `unverified`?"* → nodos SPEC sin arista `evidences` con verdict `verified`.
- *"¿SPEC-0003 sigue fresco?"* → drift: evidencia más vieja que el código que `touches` ⇒ **stale** (ADR-0008).
- *"¿por qué existe este SPEC?"* → `implements` hasta el PRD/ADR que lo motivó.
- *"¿qué se aprobó en este PR?"* → el `receipt` y su cadena `attests → evidences → implements`.

Es la cadena **requisito → implementación → evidencia → aprobación**, interrogable. Ningún competidor (Predictable Code, agent-harness, gentle-ai/Engram) la integra en un grafo tipado — es el foso.

## El límite que hace esto seguro (honestidad)

**El gate NO depende del grafo.** Por [ADR-0025](../decisions/0025-content-bound-receipt-rdd.md), el receipt vive in-repo y esa es la fuente de verdad; un git hook pelado lo revalida **aunque la memoria no esté corriendo** (es opt-in — [ADR-0017](../decisions/0017-memory-engine-separate-opt-in-package.md)).

> El grafo es **amplificador, no dependencia**. Sin él: el gate funciona igual. Con él: además recordás e interrogás.

El nodo `receipt`/`evidence` en el grafo es un **espejo** del artefacto in-repo; si divergen, **manda el archivo**.

## Local vs compartido — dónde vive el grafo

Mismo grafo, dos modos (la cuña de negocio — [ADR-0014](../decisions/0014-open-core-boundary.md)/[PRD-0005](../prds/0005-skipper-platform-stage1.md)):

| | Engine OSS (local) | Platform (compartido) |
|---|---|---|
| **Store** | SQLite `.skipper/index/graph.sqlite` (gitignored, derivado) | **Postgres (Supabase)** con scoping `org_id`/`repo_id` |
| **Frescura** | `skipper index` on-demand / hooks | servidor **re-indexa en cada push** (GitHub App/webhook) |
| **Acceso** | por-clon, un dev, MCP/CLI local | equipo entero + no-devs (PM/QA) vía web, RLS por rol |
| **Fuente de verdad** | el repo | el repo (la DB es derivada; se reconstruye del repo) |

El pipeline SDD **no cambia** con el modo: escribe SPEC/evidencia/receipt igual; el engine los ingiere a SQLite o el servidor a Postgres. Compartido = "¿qué SPECs del equipo están sin evidencia?" respondible **sin clonar el repo**.

## Qué viaja a la nube (privacidad)

Alineado con [ADR-0022](../decisions/0022-saas-privacy-posture.md) y el tiering de [platform-memory.md](platform-memory.md): el grafo SDD (nodos SPEC/evidence/receipt + aristas) es **metadata (tier a/b)** — viaja sin problema. El **output crudo de evidencia** (logs/screenshots) puede contener fragmentos de código/datos → tratar como tier c: **no viaja por defecto**, solo una referencia/digest; o self-hosted. Minimizar lo que sale de la máquina.

## Related

- Pipeline: [PRD-0006 — SDD verification & evidence](../prds/0006-sdd-verification-evidence-pipeline.md)
- Decisiones: [ADR-0024 — SPEC vivo](../decisions/0024-spec-anchored-sdd-living-spec.md) · [ADR-0025 — Receipt content-bound](../decisions/0025-content-bound-receipt-rdd.md) · [ADR-0017 — Memoria opt-in](../decisions/0017-memory-engine-separate-opt-in-package.md) · [ADR-0008 — Drift](../decisions/0008-doc-code-drift-health-checks.md) · [ADR-0022 — Privacidad SaaS](../decisions/0022-saas-privacy-posture.md)
- Capa base: [platform-memory.md](platform-memory.md) · Research: [sdd-spec-anchored-research.md](../business/sdd-spec-anchored-research.md)
