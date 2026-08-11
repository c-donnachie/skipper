# Architecture

How skipper is built internally.

## Index

| Doc | Topic |
|---|---|
| [plugin.md](plugin.md) | Top-level layout, conceptual layers, data flow examples, distribution, token budget |
| [detection.md](detection.md) | Stack detection algorithm (3-layer), scoring, output schema, known limitations |
| [agents.md](agents.md) | Subagent coordination, routing logic, communication patterns, why design choices |
| [hooks.md](hooks.md) | The 7 proactive hook scripts across 5 events (additionalContext + Stop exit-2 enforcer), throttling, opt-out, state files |
| [platform-memory.md](platform-memory.md) | **Forward-looking** — Skipper Memory platform: graph + vector index + MCP, where data lives (PRD-0004) |
| [sdd-memory-integration.md](sdd-memory-integration.md) | Cómo el pipeline SDD (SPEC/evidencia/receipt) alimenta el grafo; local SQLite vs shared Postgres; el gate no depende del grafo (PRD-0006) |
