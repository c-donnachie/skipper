# Privacy Policy — skipper

**Última actualización**: 2026-04-29

## Resumen rápido

**skipper no recolecta, almacena, ni transmite datos del usuario.** Punto.

Todo lo que el plugin hace ocurre localmente en tu máquina, dentro de tu sesión de Claude Code.

## Qué hace skipper con tus archivos

skipper lee y escribe archivos **únicamente en el directorio del proyecto donde lo invocas**:

- **Lee**: `package.json`, `app.json`, `vite.config.*`, `next.config.*`, `pyproject.toml`, `supabase/config.toml`, `CLAUDE.md`, archivos en `docs/`, archivos en `src/`, output de `git diff`/`git log`/`git status`.
- **Escribe**: `CLAUDE.md` (sólo dentro de marcadores `<!-- skipper:* -->`), `docs/architecture/stack.md`, archivos numerados en `docs/decisions/`, `docs/prds/`, `docs/plans/`.
- **Crea estado de sesión** en `.claude/.skipper-*` (markers de throttle de hooks).

skipper **nunca**:

- Lee archivos fuera del proyecto.
- Lee variables de entorno con secretos (`.env`, `.env.local`).
- Lee `~/.ssh/`, `~/.aws/`, `~/.config/`, ni similares.
- Conecta a backends propios.
- Envía telemetría.

## Servicios externos opcionales

El skill `/skipper:lib-lookup` usa las herramientas `WebSearch` y `WebFetch` de Claude Code para consultar documentación oficial pública (`react.dev`, `nextjs.org`, `docs.expo.dev`, `supabase.com/docs`, `fastify.dev`, etc.). Esas consultas:

- Son **opt-in** (sólo cuando tú invocas explícitamente `/skipper:lib-lookup`).
- Pasan por el motor de Claude Code, no por servidores propios de skipper.
- No incluyen información de tu proyecto, sólo el query que escribiste.

Si no quieres que skipper haga lookups web, simplemente no uses ese skill.

## Datos que NO controlamos

skipper se ejecuta dentro de Claude Code, que sí tiene su propia política de privacidad de Anthropic. Para entender cómo Claude/Anthropic procesa los prompts y outputs:

- https://www.anthropic.com/legal/privacy

skipper como plugin no tiene visibilidad sobre esos flujos. Toda recolección de datos relativa a usar Claude Code es responsabilidad de Anthropic, no de skipper.

## Servicios de terceros embebidos

**Ninguno.** skipper no integra Google Analytics, Sentry, Mixpanel, ni servicios similares.

## Open source

skipper es open source bajo licencia MIT. Puedes auditar el código completo:

- https://github.com/c-donnachie/skipper

Si encuentras algo que contradiga este documento, abre un issue.

## Contacto

Preguntas o reportes: cristianu@dropout.cl

Cambios a esta política se anunciarán en el [CHANGELOG.md](./CHANGELOG.md) del repo.
