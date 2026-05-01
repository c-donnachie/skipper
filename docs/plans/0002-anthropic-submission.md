# Plan 0002 — Anthropic marketplace submission

- **Status**: Active
- **Created**: 2026-04-30
- **Related**: SUBMISSION.md (in repo root)

## Context

skipper v1.0.1 is feature-complete and bilingual-ready (English public docs, Spanish internal personality). The next external milestone is acceptance into the official Anthropic plugin marketplace at https://claude.ai/settings/plugins/submit.

Anthropic reviews each submission manually. Estimated timeline: 1–2 weeks (not formally documented, varies). Outcome is binary: approved (listed publicly) or rejected (with feedback to iterate).

## Steps

### Pre-submission

- [x] Public plugin repo (skipper, MIT, semver 1.0.1).
- [x] Public marketplace repo (madagascar).
- [x] CHANGELOG.md.
- [x] README with "Why" + demo + commands + screenshots placeholders.
- [x] PRIVACY.md (zero data collection statement).
- [x] SUBMISSION.md with form data ready.
- [x] Tests passing (8/8 fixtures).
- [ ] **Capture real screenshots** for README (currently still placeholders).
- [ ] Create v1.0.1 release tag on GitHub: `git tag v1.0.1 && git push origin v1.0.1`.

### Form filling

Page-by-page, using SUBMISSION.md as the source of truth:

1. **Introduction**: read terms, accept checkbox, click Siguiente.
2. **Plugin information**:
   - Plugin URL: `https://github.com/c-donnachie/skipper`
   - Homepage: `https://github.com/c-donnachie/skipper`
   - Plugin name: `skipper`
   - Description: see SUBMISSION.md long description.
   - Use cases: see SUBMISSION.md examples.
3. **Submission details**:
   - Platforms: ✅ Claude Code (NOT Cowork — untested).
   - License: `MIT`.
   - Privacy URL: `https://github.com/c-donnachie/skipper/blob/main/PRIVACY.md`.
   - Email: `ugar.cristian@gmail.com`.
4. Click "Enviar para revisión".

### Post-submission

- [ ] Receive confirmation email.
- [ ] Wait 1-2 weeks for Anthropic review.
- [ ] If approved: skipper appears in `/plugin marketplace browse`. Mention on social/share with collaborators.
- [ ] If rejected: read feedback, iterate (most likely a polish issue), resubmit.

### Parallel work during review

Don't block on the review. Continue:
- Validation (plan 0001).
- v1.0.x patches as issues come in.
- Add screenshots if Anthropic asks for them post-submission.

## Critical files

- `SUBMISSION.md` — the form-fill cheat sheet.
- `README.md`, `PRIVACY.md`, `CHANGELOG.md` — Anthropic reviewers will read these.
- `plugin.json` — name, version, description, license must match the form.

## Verification

Submission successful when:
- Confirmation email received.
- The plugin shows up at `https://claude.ai/settings/plugins/<id>` (probably with status "under review").

Approval successful when:
- skipper visible in `/plugin marketplace browse` from any Claude Code installation.
- A test install from a fresh Claude Code session works: `/plugin install skipper@<official-id>`.

## Notes

- **Keep madagascar marketplace alive**: even after official approval, the personal marketplace remains useful for beta versions and add-ons (private, rico) that aren't yet submitted to Anthropic.
- **Versioning**: the official marketplace listing should reflect the latest stable. If v1.0.2 ships before review is done, update the submission with the new version number (or the form auto-pulls from `plugin.json`).
- **Rejection isn't fatal**: most rejections are about polish (more screenshots, clearer description, license confusion). Iterate and resubmit.
