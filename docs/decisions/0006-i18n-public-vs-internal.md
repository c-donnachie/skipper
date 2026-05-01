# 0006 — Public docs in English, internal prompts in Spanish

- **Status**: Accepted (v1.0.1)
- **Date**: 2026-04-29
- **Deciders**: @c-donnachie

## Context

skipper was developed in Spanish (Chilean informal). With the imminent submission to Anthropic's official marketplace and broader international reach, the documentation needed translation.

The question: how much do we translate?

**Option A — Translate everything**: README, PRIVACY, all SKILL.md bodies, all agent system prompts, all stack templates.

**Option B — Translate nothing**: keep everything in Spanish. Bet on Spanish-speaking developers as primary audience.

**Option C — Hybrid**: translate public-facing content (README, PRIVACY, frontmatter descriptions). Keep internal prompts and templates in Spanish — agents detect the project language and adapt their output.

## Decision

**Option C — Hybrid.**

### Translated to English (visible to all users)
- `README.md`, `PRIVACY.md`, `CHANGELOG.md`, `SUBMISSION.md`
- `plugin.json` description and keywords
- `marketplace.json` description
- Marketplace `README.md`
- All `description` fields in skill and agent frontmatter (visible in `/plugin browse`)
- `argument-hint` values

### Kept in Spanish (internal — Claude reads these)
- Skill bodies (instructions for Claude — Claude handles both languages equally well)
- Agent system prompts (with personality "español chileno informal")
- Stack profile templates (`claude.md.tmpl`, `architecture.md.tmpl`)

The generated CLAUDE.md inherits the project's language: agents read existing `CLAUDE.md`, `docs/`, etc. and adapt their output to whatever language the project uses.

## Alternatives considered

- **Option A — Translate everything**: rejected. Loses the "Chilean Spanish personality" of internal prompts (which doesn't impact the user). Increases maintenance: every prompt change needs to be made in 2 languages. No clear value for the end user.

- **Option B — Translate nothing**: rejected. Limits reach in international marketplace. README in Spanish is hostile to non-Spanish speakers exploring options.

## Consequences

### Positive
- **Discoverable internationally**: marketplace browsers see English descriptions.
- **Adapts to user's language**: agents output Spanish or English based on the project's existing docs.
- **Maintains personality**: internal prompts keep the "Chilean Spanish, conservative captain" vibe.
- **Half the maintenance** vs translating everything.

### Negative / costs
- **Cognitive split**: contributors need to know which content is English vs Spanish. Mitigation: rule of thumb "if Claude reads it → Spanish; if a user reads it → English".
- **Inconsistency risk**: a future contributor might add a new skill with English body. That's fine functionally (Claude handles both) but breaks the personality consistency.

### What to watch
- **Stack templates**: if international users complain about the generated CLAUDE.md being in Spanish even when their project is English, the templates may need a default-English version. Currently agents detect the project language and adapt the *output* of dynamic content, but the templates' static text is in Spanish.
- **Future i18n**: if demand grows for fully localized templates (English-first stack profiles), build a `stacks/<id>/{es,en}/claude.md.tmpl` structure.
