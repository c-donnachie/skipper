---
description: "Supersedes an existing ADR with a new one. ADRs are immutable — when a past decision changes you don't rewrite it, you supersede it. Marks the old ADR 'Superseded by ADR-NNNN', creates the replacement with 'Supersedes ADR-MMMM', links both, and updates the index. Takes the old ADR number and the new title."
argument-hint: "[old-adr-number] [new title]"
allowed-tools: Read Write Edit Bash(ls *) Bash(mkdir *) Bash(date *) Bash(printf *) Bash(git config *) Bash(grep *) Bash(basename *)
---

# Supersede un ADR

Reemplaza una decisión previa por una nueva, respetando la **inmutabilidad**: el ADR viejo NO se reescribe — sólo cambia su Status a "Superseded by …" y se enlaza con el nuevo.

Argumento: "$ARGUMENTS" → primer token = número del ADR viejo (ej. `7` o `0007`); el resto = título del nuevo ADR.

## Validación previa

- Si "$ARGUMENTS" está vacío o falta el título → pide al usuario "número del ADR a superseder + título del nuevo" y termina sin escribir.
- Localiza el ADR viejo: busca en `docs/decisions/` el archivo cuyo prefijo de 4 dígitos coincida con el número dado (ej. `0007-*.md`). Si no existe, lista los ADRs disponibles y termina.

## Pasos

1. **Lee el ADR viejo** completo. Extrae su número (`OLD`, 4 dígitos), su título y su Status actual.
   - Si su Status ya es "Superseded by …", avísalo y pregunta si igual quieres continuar.

2. **Calcula el número del nuevo** (`NEW`):
   ```bash
   printf "%04d" $(($(ls docs/decisions/ 2>/dev/null | grep -cE '^[0-9]{4}-') + 1))
   ```

3. **Crea el nuevo ADR** `docs/decisions/NEW-<slug>.md` desde `${CLAUDE_SKILL_DIR}/../update/templates/adr.md`:
   - Sustituye `{{NUMBER}}`→NEW, `{{TITLE}}`→título nuevo, `{{DATE}}`→`date +%Y-%m-%d`, `{{AUTHOR}}`→`git config user.name`.
   - Status arranca en **Proposed** (la nueva decisión también se ratifica).
   - Descomenta/añade la línea de metadata: `- **Supersedes**: ADR-OLD (<título viejo>)`.
   - En "Context and problem statement", parte explicando **qué cambió** respecto a ADR-OLD y por qué ya no aplica.

4. **Edita el ADR viejo** — SÓLO su línea de Status (no toques el resto, es inmutable):
   ```
   - **Status**: Superseded by [ADR-NEW](NEW-<slug>.md) — <fecha>
   ```
   Opcional: agrega una sola línea al final de su sección de metadata enlazando al nuevo. NADA más se modifica.

5. **Actualiza `docs/decisions/README.md`**:
   - Cambia el Status del ADR viejo en el índice a `Superseded by ADR-NEW`.
   - Agrega la fila del ADR nuevo (Status: Proposed).

6. **Reporta**: tabla con ADR viejo (→ Superseded) y ADR nuevo (creado), con sus paths.

## Reglas duras

- **NUNCA reescribas el cuerpo del ADR viejo.** Sólo su Status cambia. El histórico de decisiones es el valor.
- Los links son **bidireccionales**: viejo → "Superseded by NEW", nuevo → "Supersedes OLD".
- El ADR nuevo arranca **Proposed**, no Accepted (que el equipo lo ratifique).
- Si el usuario sólo quiere marcar algo como **Deprecated** (sin reemplazo), no uses este skill: edita el Status del ADR a `Deprecated` directamente.
