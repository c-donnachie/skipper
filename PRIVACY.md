# Privacy Policy — skipper

**Last updated**: 2026-04-29

## TL;DR

**skipper does not collect, store, or transmit user data.** Period.

Everything the plugin does happens locally on your machine, inside your Claude Code session.

## What skipper does with your files

skipper reads and writes files **only inside the project directory where you invoke it**:

- **Reads**: `package.json`, `app.json`, `vite.config.*`, `next.config.*`, `pyproject.toml`, `supabase/config.toml`, `CLAUDE.md`, files in `docs/`, files in `src/`, output of `git diff`/`git log`/`git status`.
- **Writes**: `CLAUDE.md` (only inside `<!-- skipper:* -->` markers), `docs/architecture/stack.md`, numbered files in `docs/decisions/`, `docs/prds/`, `docs/plans/`.
- **Creates session state** in `.claude/.skipper-*` (hook throttle markers).

skipper **never**:

- Reads files outside the project.
- Reads environment variables containing secrets (`.env`, `.env.local`).
- Reads `~/.ssh/`, `~/.aws/`, `~/.config/`, or similar.
- Connects to its own backends.
- Sends telemetry.

## Optional external services

The `/skipper:lib-lookup` skill uses Claude Code's `WebSearch` and `WebFetch` tools to query public official documentation (`react.dev`, `nextjs.org`, `docs.expo.dev`, `supabase.com/docs`, `fastify.dev`, etc.). Those queries:

- Are **opt-in** (only when you explicitly invoke `/skipper:lib-lookup`).
- Go through the Claude Code engine, not skipper-owned servers.
- Don't include your project information — only the query you typed.

If you don't want skipper to make web lookups, simply don't use that skill.

## Data we don't control

skipper runs inside Claude Code, which has its own Anthropic privacy policy. To understand how Claude/Anthropic processes prompts and outputs:

- https://www.anthropic.com/legal/privacy

skipper as a plugin has no visibility into those flows. Any data collection related to using Claude Code is Anthropic's responsibility, not skipper's.

## Embedded third-party services

**None.** skipper does not integrate Google Analytics, Sentry, Mixpanel, or similar services.

## Open source

skipper is open source under the MIT license. You can audit the full code:

- https://github.com/c-donnachie/skipper

If you find anything that contradicts this document, open an issue.

## Contact

Questions or reports: cristianu@dropout.cl

Changes to this policy will be announced in the repo's [CHANGELOG.md](./CHANGELOG.md).
