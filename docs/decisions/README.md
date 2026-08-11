# Architecture Decision Records (ADRs)

Technical decisions with real tradeoffs that apply more than once in the project.

## When to create an ADR

- Choice of library/framework with valid alternatives
- Change of architectural pattern
- Integration with external service
- Deprecation of something in use

## Index

| # | Title | Status |
|---|---|---|
| 0001 | [Monolithic plugin vs multi-plugin split](0001-monolithic-vs-multi-plugin.md) | Accepted |
| 0002 | [Skipper as router, Kowalski as docs analyst](0002-skipper-router-kowalski-analyst.md) | Accepted (v0.4.0) |
| 0003 | [Strongly opinionated CLAUDE.md profiles](0003-strongly-opinionated-claude-md.md) | Accepted (v0.2.0) |
| 0004 | [Specialist subagents can write code](0004-specialists-can-write.md) | Accepted (v0.3.0) |
| 0005 | [Monolithic stack profiles in v0.2, composable layers in v0.6](0005-monolithic-then-layers.md) | Accepted |
| 0006 | [Public docs in English, internal prompts in Spanish](0006-i18n-public-vs-internal.md) | Accepted (v1.0.1) |
| 0007 | [Madagascar marketplace expandable for future add-ons](0007-marketplace-expandable.md) | Accepted (v0.4.0) |
| 0008 | [Health checks for doc/code drift (stack-sync + docs-doctor)](0008-doc-code-drift-health-checks.md) | Accepted (v1.1.0) |
| 0009 | [Proactive hooks via additionalContext + Stop enforcer](0009-proactive-hooks-via-additional-context.md) | Accepted (v1.1.0) |
| 0010 | [Plan-mode architecture guard](0010-plan-mode-architecture-guard.md) | Accepted (v1.1.0) |
| 0011 | [Dependency-change & subsystem-aware proactive hooks](0011-dependency-and-subsystem-proactive-hooks.md) | Accepted (v1.1.0) |
| 0012 | [Next.js profiles adopt layered + Container architecture](0012-nextjs-layered-container-architecture.md) | Accepted (v1.2.0) |
| 0013 | [MADR-aligned ADR lifecycle + supersede workflow](0013-madr-aligned-adr-lifecycle.md) | Accepted (v1.3.0) |
| 0014 | [Open-core boundary: engine OSS, persistent shared memory SaaS](0014-open-core-boundary.md) | Accepted |
| 0015 | [MVP scope: retrieval agent first, visualizations later](0015-mvp-scope-agent-first.md) | Proposed |
| 0016 | [Connector strategy: deferred, repo-first, no "connect everything"](0016-connector-strategy-deferred.md) | Accepted |
| 0017 | [Memory engine as a separate opt-in package, not bundled in the plugin](0017-memory-engine-separate-opt-in-package.md) | Proposed |
| 0018 | [Proactive memory: hook auto-injects governing decisions on edit](0018-proactive-memory-injection.md) | Proposed |
| 0019 | [Proactive specialist auto-routing (inspired by Superpowers)](0019-proactive-specialist-auto-routing.md) | Proposed |
| 0020 | [Skipper Platform: vision as staged north star (extends ADR-0016)](0020-platform-staging-vision-north-star.md) | Proposed |
| 0021 | [Open-core fence: engine features are never paywalled](0021-open-core-fence.md) | Proposed |
| 0022 | [SaaS privacy posture: host graph + docs, never source by default](0022-saas-privacy-posture.md) | Proposed |
| 0023 | [Platform is a separate closed-source repo that consumes the engine as a package](0023-platform-separate-closed-repo.md) | Proposed |
| 0024 | [SPEC vivo como ancla de SDD (spec-anchored, mutable, gate duro)](0024-spec-anchored-sdd-living-spec.md) | Accepted |
| 0025 | [Receipt content-bound in-repo para el gate duro (RDD)](0025-content-bound-receipt-rdd.md) | Accepted |
| 0026 | [Superficies de config: archivos = verdad, CLI determinista infiere, UI = proyección paga](0026-config-surfaces-deterministic-cli-files-truth.md) | Accepted |
