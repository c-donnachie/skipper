---
description: "Facilitate a decision (problem then real options then tradeoffs then recommendation) and capture it as a complete, pre-filled ADR — the brainstorm-to-decision loop. Use when you are about to make, or just made, a technical or product decision with real alternatives and want it recorded instead of lost in a chat thread."
argument-hint: "[decision topic]"
allowed-tools: Read Write Edit Bash(ls *) Bash(mkdir *) Bash(date *) Bash(printf *) Bash(git config *)
---

# Decidir y registrar (brainstorm → ADR)

Convierte una decisión con tradeoffs en un ADR completo. Fusiona el **brainstorm** (pensar la decisión bien) con la **captura** (que no se pierda en un chat). Tema: "$ARGUMENTS".

## Pasos

1. **Encuadra el problema.** En 1-2 frases: qué hay que decidir y por qué ahora. Si el tema ya se discutió en este turno, sintetízalo; si es nuevo, plantéalo.
2. **Opciones reales (2-3).** Para cada una: qué es, pros y contras. Nada de strawmen — alternativas que de verdad considerarías.
3. **Recomendación.** La opción elegida y **por qué** (qué driver o restricción resuelve). Sé honesto sobre el costo de la elegida.
4. **Confirma antes de escribir.** Mostrá problema + opciones + recomendación y **preguntá al usuario si lo registra así** (o ajusta). No escribas un ADR a medias ni sin acuerdo.
5. **Registra el ADR** (sólo tras confirmación) siguiendo el protocolo de `/skipper:new-adr`:
   - `mkdir -p docs/decisions`; siguiente número: `printf "%04d" $(($(ls docs/decisions/ 2>/dev/null | grep -cE '^[0-9]{4}-') + 1))`
   - Lee el template `${CLAUDE_SKILL_DIR}/../update/templates/adr.md` y **pre-llénalo** con lo discutido: Context and problem statement, Decision drivers, Decision, Alternatives considered, Consequences. Status **Proposed**, Date `date +%Y-%m-%d`, Deciders `git config user.name`.
   - Escribe `docs/decisions/NNNN-slug.md`, agrega la entrada al índice `docs/decisions/README.md`, y reporta el path.
6. **Enlaza** las decisiones/PRDs relacionados en la sección "More information" — así entran al grafo de la memoria como aristas (`skipper context`/`relate` los va a encontrar).

## Reglas

- **Inmutabilidad**: si esto reemplaza una decisión previa, NO crees un ADR suelto — usá `/skipper:supersede-adr <número-viejo> "título"`.
- Status arranca **Proposed**; el usuario lo pasa a Accepted cuando ratifica.
- Si "$ARGUMENTS" está vacío y no hay una decisión clara en el turno, preguntá cuál es la decisión antes de seguir.
- Conciso: el ADR es un registro, no un ensayo (apuntá a < 200 líneas).
