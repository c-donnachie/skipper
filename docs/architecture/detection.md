# Stack detection algorithm

> Last updated: 2026-04-30. Reflects v1.0.1.

## Goal

Given a project directory, decide which of the 8 supported stacks (or none) the project follows, with a confidence level. Pure bash, no runtime deps beyond `grep`, `find`, `stat`, `awk` and `python3` (used only for JSON output).

## Implementation

`lib/detect.sh` runs three independent layers and combines their scores.

### Layer 1 — Marker files

Single-file checks. Each match gives 1 point to a frontend or backend candidate.

| Marker | Indicator |
|---|---|
| `vite.config.{ts,js,mjs}` | vite |
| `next.config.{ts,js,mjs}` | next |
| `app.json` containing `"expo"` | expo |
| `supabase/config.toml` | supabase |
| `pyproject.toml` | python |
| `package.json` containing `"fastify"` | fastify |

### Layer 2 — Dependencies

Grep `package.json` (and `pyproject.toml` for Python) for known package names. Each match gives 1 point.

Tracked: `react`, `vite`, `next`, `expo`, `react-native`, `@supabase/supabase-js`, `fastify`, `express`, `hono`, `fastapi`, `django`.

### Layer 3 — Structure

Folder/file conventions:

- `src/features/` exists → contributes to react-vite or nextjs
- `app/**/page.tsx` exists → Next.js App Router
- `supabase/` directory → supabase backend

## Scoring

Each candidate stack accumulates points across the 3 layers. Decision rules:

```
score_react_vite = layer1(vite_config) + layer2(react+vite deps)
score_nextjs    = layer1(next_config) + layer2(next dep) + layer3(app router)
score_expo      = layer1(app.json+expo) + layer2(expo dep) + layer2(react-native dep)
score_supabase  = layer1(supabase_config) + layer2(supabase-js dep) + layer3(supabase dir)
score_node_api  = layer2(fastify || express || hono)
score_python    = layer1(pyproject) + layer2(fastapi || django)
```

### Selecting the frontend

In priority order:
1. nextjs if `score_nextjs ≥ 2`
2. react-vite if `score_react_vite ≥ 2` (and nextjs not selected)
3. expo if `score_expo ≥ 2`

### Selecting the backend

1. supabase if `score_supabase ≥ 1`
2. node otherwise (default fallback when supabase not detected)

### Combining frontend + backend → stack id

```
nextjs + supabase    → nextjs-supabase
nextjs + (no supabase) → nextjs-fullstack
react-vite + supabase  → react-vite-supabase
react-vite + (default) → react-vite-node
expo + supabase        → expo-supabase
expo + (default)       → expo-node
no frontend + node_api ≥ 1 → node-api
no frontend + python ≥ 2 → python-fastapi
otherwise              → none
```

## Confidence levels

```
total_score = sum of all layer scores for the selected stack(s)

high   if total_score ≥ 4
medium if total_score ≥ 2
low    if total_score ≥ 1
none   if no stack selected
```

## Ambiguity flag

Set `ambiguous: true` when **2+ frontends** competing simultaneously have score ≥ 2 (e.g. monorepo with both Next and Expo). The skill consumer (`scan` or `init-structure`) is expected to ask the user which frontend is primary.

## Output schema

```json
{
  "detected": ["expo-supabase"],
  "confidence": "high",
  "ambiguous": false,
  "signals": {
    "files":  { "vite_config": 0, "next_config": 0, "app_json_expo": 1, "supabase_config": 1, "pyproject": 0 },
    "deps":   { "react": 1, "vite": 0, "next": 0, "expo": 1, "react-native": 1, "supabase-js": 1, "fastify": 0, "express": 0, "hono": 0, "fastapi": 0, "django": 0 },
    "scores": { "react_vite": 0, "nextjs": 0, "expo": 3, "supabase": 2, "node_api": 0, "python": 0 }
  }
}
```

## Tests

`lib/test-detect.sh` runs the detector against `examples/fixtures/<stack-id>/` for each of the 8 stacks. Each fixture contains the minimum marker files (package.json, app.json, vite.config, etc.) for the stack to be detected with its expected id.

Current state: **8/8 passing**.

## Known limitations

1. **Monorepos**: detector runs on the cwd, not on sub-packages. Tools like Turborepo with multiple stacks aren't fully understood — `ambiguous: true` flags it but doesn't resolve per package.
2. **Custom build tools**: projects using esbuild/rollup/parcel directly without vite/next aren't recognized.
3. **Astro/SvelteKit/Tauri/Remix** not yet supported (planned in v1.x — see `docs/prds/0003-more-stacks.md`).
4. **Deno/Bun runtimes** not yet considered — currently only Node.js + Python.
5. **Python web frameworks beyond FastAPI/Django** (Flask, Litestar) not detected.
