# Submission to Anthropic's official marketplace

Step-by-step guide to submit skipper to the official Claude Code marketplace.

## Pre-submission checklist

### Technical checklist

- [x] Public plugin on GitHub: https://github.com/c-donnachie/skipper
- [x] Public marketplace on GitHub: https://github.com/c-donnachie/madagascar
- [x] `plugin.json` with `name`, `version`, `description`, `author`, `license`, `keywords`, `homepage`, `repository`.
- [x] `LICENSE` in the repo (MIT).
- [x] `README.md` with "Why" section + demo + installation + complete commands.
- [x] `CHANGELOG.md` with semver history since v0.1.
- [x] `lib/test-detect.sh` runs and passes (8/8 fixtures).
- [x] Current semver version: `1.0.1`.

### Visual checklist (still pending)

These need to be **captured manually** because they require the actual app:

- [ ] **Screenshot 1**: SessionStart banner when opening a project with stack applied.
  ```
  ╭─ 🐧 skipper ──────────────────────────────────────────╮
  │ Stack:  React Native Expo + Supabase                 │
  │ Layers: tanstack-query zustand zod                   │
  │ Docs:   4 ADR · 1 PRD · 0 plan · update up to date   │
  ╰───────────────────────────────────────────────────────╯
  ```
  **How to capture**: in any project with applied CLAUDE.md, open Claude Code and screenshot the initial banner.

- [ ] **Screenshot 2**: Output of `/skipper:scan` with high confidence.
  **How to capture**: run the command in any supported project, capture the report.

- [ ] **Screenshot 3**: `/skipper:stack-doctor` violations table.
  **How to capture**: in a project with applied CLAUDE.md, run stack-doctor, capture the table.

- [ ] **GIF (optional)**: a `/skipper:ask "is this structure ok?"` session that routes to `/skipper:react-native`.
  **How to capture**: use Kap or LICEcap. ~15 seconds.

**Suggested location**: `examples/screenshots/` (create folder).

After capturing, replace the `<!-- TODO screenshot: ... -->` placeholders in README with `![desc](examples/screenshots/foo.png)`.

## Submission form

URL: **https://claude.ai/settings/plugins/submit**

(Alternative: https://platform.claude.com/plugins/submit)

### Fields to fill

| Field | Value |
|---|---|
| Plugin name | `skipper` |
| Version | `1.0.1` |
| Repository URL | `https://github.com/c-donnachie/skipper` |
| Marketplace URL (if asked) | `https://github.com/c-donnachie/madagascar` |
| Author | Cristian Donnachie (cristianu@dropout.cl) |
| License | MIT |
| Privacy URL | `https://github.com/c-donnachie/skipper/blob/main/PRIVACY.md` |
| Description | "A Claude Code framework that scaffolds, documents, and maintains your project following Clean Code and SOLID principles. Detects the stack, generates an opinionated CLAUDE.md, keeps living docs, and ships 7 specialist subagents." |
| Keywords | framework, documentation, adr, prd, architecture, solid, clean-code |
| Categories | (pick from form: probably "Framework", "Documentation", "Code Review") |

### Suggested long description

```
skipper is a complete framework for Claude Code that replaces the need to install several separate plugins (boilerplate generators, ADR-tools, doc-gen plugins, hand-pasted rules).

With a single command:

1. Detects your stack (8 stacks: React Vite, Next.js, Expo, Node API, Python FastAPI, all with/without Supabase).
2. Applies an opinionated CLAUDE.md (mandatory structure, naming, recommended libs, anti-patterns, validatable SOLID rules).
3. Keeps living docs: ADRs, PRDs, implementation plans with templates.
4. Ships 7 specialist subagents that refactor while respecting the project's laws: architect, solid-coach, react-vite, react-native, nextjs, node-backend, supabase.
5. Suggests proactively via hooks: SessionStart banner, PostToolUse that detects edited domains, Stop that nudges you to update docs.

20 skills, 9 subagents, 8 stack profiles, 6 composable layers, 3 hooks. Token cost in context: ~355 (0.18% of the window).
```

### Suggested categories

- Framework
- Documentation
- Code Review
- Architecture

## After submission

1. Anthropic reviews manually. Estimated approval time: 1–2 weeks (not documented, varies).
2. You'll receive an email with the result.
3. If approved: skipper appears in `/plugin marketplace browse` for all Claude Code users.
4. If rejected: feedback with what to fix. Iterate and resubmit.

## Keep your own marketplace in parallel

Even if skipper lands in the official marketplace, keeping `c-donnachie/madagascar` active allows:

- Distributing beta versions before official submission.
- Hosting optional add-ons (`private`, `rico`) without going through Anthropic review.
- Full control over updates.

## Useful commands

```bash
# Validate before submit
bash lib/test-detect.sh                    # detector tests
bash -n hooks/*.sh                         # syntax check of scripts
python3 -c "import json; json.load(open('.claude-plugin/plugin.json'))"  # valid plugin.json

# View current version
grep version .claude-plugin/plugin.json

# Create release tag on GitHub (after submit)
git tag v1.0.1
git push origin v1.0.1
```
