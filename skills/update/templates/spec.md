# {{NUMBER}} — {{TITLE}}

<!-- SPEC vivo (ADR-0024): mutable, mantenido por Skipper. El ANCLA es el ID estable
     (SPEC-{{NUMBER}}#AC-k), NO el contenido — a diferencia de un ADR, un SPEC evoluciona.
     El gate (ADR-0024/0025) contrasta el diff contra los Acceptance criteria de abajo. -->

- **Status**: Draft   <!-- Draft → Active → (Superseded by SPEC-NNNN | Retired) -->
- **Last updated**: {{DATE}}
- **Implements**: <!-- PRD-NNNN / ADR-NNNN que lo motivan (aristas `implements`) -->

## Intent

Qué debe seguir siendo verdad. Una o dos frases — el "qué", no el "cómo".

## Acceptance criteria

Cada criterio es **verificable**, lleva **ID estable** y declara un **método**
(`test` · `type` · `static` · `manual` · `memory` · `human`). El evidence-runner
(PRD-0006 M3) los corre; el gate reporta `divergence: SPEC-{{NUMBER}}#AC-k`.

| ID   | Criterio (qué debe cumplirse)        | Método | Verificación (comando / cómo)      |
|------|--------------------------------------|--------|------------------------------------|
| AC-1 | ...                                  | test   | `<comando de test que lo cubre>`   |
| AC-2 | ...                                  | type   | `tsc --noEmit`                     |

<!-- Métodos: test=corre tests · type=type-check · static=lint/build/boundaries ·
     manual=correr y observar (exige artefacto, PRD-0006 Q2) · memory=chequeo en el grafo ·
     human=aprobación humana. Sin método o sin corrida ⇒ `unverified`, nunca verde (M5). -->

## Out of scope

Qué NO cubre este SPEC (evita scope creep — el gate no exige lo que el SPEC no promete).

## Related

- Implements: <!-- PRD-NNNN · ADR-NNNN -->
- Touched code: <!-- lo completa el grafo (arista `touches`) tras el primer review anclado -->
