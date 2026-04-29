# Submission al marketplace oficial de Anthropic

Guía paso a paso para enviar skipper al marketplace oficial de Claude Code.

## Pre-requisitos antes del submit

### Checklist técnico

- [x] Plugin público en GitHub: https://github.com/c-donnachie/skipper
- [x] Marketplace público en GitHub: https://github.com/c-donnachie/madagascar
- [x] `plugin.json` con `name`, `version`, `description`, `author`, `license`, `keywords`, `homepage`, `repository`.
- [x] `LICENSE` en el repo (MIT).
- [x] `README.md` con sección "Why" + demo + instalación + comandos completos.
- [x] `CHANGELOG.md` con histórico semver desde v0.1.
- [x] `lib/test-detect.sh` corre y pasa (8/8 fixtures).
- [x] Versión semver actual: `1.0.0`.

### Checklist visual (faltan)

Estos hay que **capturar manualmente** porque requieren la app real:

- [ ] **Screenshot 1**: SessionStart banner abriendo un proyecto con stack aplicado.
  ```
  ╭─ 🐧 skipper ──────────────────────────────────────────╮
  │ Stack:  React Native Expo + Supabase                 │
  │ Layers: tanstack-query zustand zod                   │
  │ Docs:   4 ADR · 1 PRD · 0 plan · update al día       │
  ╰───────────────────────────────────────────────────────╯
  ```
  **Cómo capturar**: en `not-pato` con CLAUDE.md aplicado, abrir Claude Code y screenshot del banner inicial.

- [ ] **Screenshot 2**: Output de `/skipper:scan` con confidence high.
  **Cómo capturar**: correr el comando en cualquier proyecto soportado, capturar el reporte.

- [ ] **Screenshot 3**: Tabla de violaciones de `/skipper:stack-doctor`.
  **Cómo capturar**: en proyecto con CLAUDE.md aplicado, correr stack-doctor, capturar la tabla.

- [ ] **GIF (opcional)**: Una sesión de `/skipper:ask "¿está bien esta estructura?"` que enruta a `/skipper:react-native`.
  **Cómo capturar**: usar Kap o LICEcap. ~15 segundos de duración.

**Ubicación sugerida**: `examples/screenshots/` (crear carpeta).

Después de capturar, agregar al README en los placeholders `<!-- TODO screenshot: ... -->`.

## Form de submission

URL: **https://claude.ai/settings/plugins/submit**

(Alternativa: https://platform.claude.com/plugins/submit)

### Datos a llenar

| Campo | Valor |
|---|---|
| Plugin name | `skipper` |
| Version | `1.0.0` |
| Repository URL | `https://github.com/c-donnachie/skipper` |
| Marketplace URL | `https://github.com/c-donnachie/madagascar` |
| Author | Cristian Donnachie (cristianu@dropout.cl) |
| License | MIT |
| Description | "Framework de Claude Code que arma, documenta y mantiene tu proyecto siguiendo Clean Code y SOLID. Detecta el stack, genera CLAUDE.md opinado, mantiene docs vivos, y trae 7 sub-agentes especialistas." |
| Keywords | framework, documentation, adr, prd, architecture, solid, clean-code |
| Categories | (elegir según opciones del form: probablemente "Framework", "Documentation", "Code Review") |

### Texto sugerido para descripción larga

```
Skipper es un framework completo para Claude Code que reemplaza la necesidad
de instalar varios plugins separados (boilerplate generators, ADR-tools,
plugins de doc-gen, reglas pegadas a mano).

Con un solo comando:

1. Detecta tu stack (8 stacks: React Vite, Next.js, Expo, Node API, Python
   FastAPI, todos con/sin Supabase).
2. Aplica un CLAUDE.md opinado fuerte (estructura obligatoria, naming, libs
   recomendadas, anti-patterns, reglas SOLID validables).
3. Mantiene docs vivos: ADRs, PRDs, planes de implementación con templates.
4. Trae 7 sub-agentes especialistas que pueden refactorizar respetando las
   leyes del proyecto: architect, solid-coach, react-vite, react-native,
   nextjs, node-backend, supabase.
5. Sugiere proactivamente vía hooks: SessionStart banner, PostToolUse que
   detecta dominios editados, Stop que sugiere actualizar docs.

20 skills, 9 subagents, 8 stack profiles, 6 layers componibles, 3 hooks.
Token cost en contexto: ~355 (0.18% de la ventana).
```

### Categorías sugeridas

- Framework
- Documentation
- Code Review
- Architecture

## Después del submit

1. Anthropic revisa manualmente. Tiempo estimado de aprobación: 1–2 semanas (no documentado, varía).
2. Recibirás un email con resultado.
3. Si aprobado: skipper aparece en `/plugin marketplace browse` para todos los usuarios de Claude Code.
4. Si rechazado: feedback con qué corregir. Itera y resubmite.

## Mantener marketplace propio en paralelo

Aunque skipper esté en el marketplace oficial, mantener `c-donnachie/madagascar` activo permite:

- Distribuir versiones beta antes del submit oficial.
- Tener add-ons opcionales (`private`, `rico`) sin pasar por revisión Anthropic.
- Control total sobre updates.

## Comandos útiles

```bash
# Validar antes de submit
bash lib/test-detect.sh                    # tests del detector
bash -n hooks/*.sh                         # syntax check de scripts
python3 -c "import json; json.load(open('.claude-plugin/plugin.json'))"  # plugin.json válido

# Ver versión actual
grep version .claude-plugin/plugin.json

# Crear release tag en GitHub (después del submit)
git tag v1.0.0
git push origin v1.0.0
```
