// skipper.config.json — committed source of truth for the gate & Definition of Done (PRD-0006 M8,
// ADR-0026). Lives at the repo root (NOT under the gitignored .skipper/ — ADR-0025). Zero-dep: JSON,
// parsed natively. Laws (Must comply / Must NOT) stay in CLAUDE.md and are NOT duplicated here.
//
// The deterministic CLI writes/reads this; the gate reads `dod()` to know which items must pass.
// A SPEC's acceptance criteria extend/override these project-wide defaults per requirement.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const CONFIG_FILE = 'skipper.config.json';

// method: test | type | static | manual | memory | human   (PRD-0006 M8 / SPEC methods)
// Strong defaults — the point of "opinionated" (ADR-0003): most items pre-enabled, tune at the margin.
const BASE_DOD = [
  { id: 'tests', title: 'Unit + integration tests pass', method: 'test', enabled: true },
  { id: 'boundaries', title: 'Lint & architecture boundaries pass', method: 'static', enabled: true },
  { id: 'adr', title: 'ADR added/updated if a decision was made', method: 'memory', enabled: true },
  { id: 'docs-indexed', title: 'Docs re-indexed into memory', method: 'memory', enabled: false },
  { id: 'pr-approved', title: 'PR reviewed & approved', method: 'human', enabled: false },
];
const TS_DOD = { id: 'types', title: 'Type-check clean, no `any`', method: 'type', enabled: true };

// Deterministic default DoD for a detected stack (used by `skipper setup` when no config exists yet).
export function defaultDod(stack = {}) {
  const items = [...BASE_DOD];
  const lang = String(stack.language || stack.primary || '').toLowerCase();
  if (lang.includes('typescript') || lang.includes('ts')) items.splice(1, 0, { ...TS_DOD });
  return items;
}

export function load(root) {
  const p = join(root, CONFIG_FILE);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

export function save(root, config) {
  writeFileSync(join(root, CONFIG_FILE), JSON.stringify(config, null, 2) + '\n');
  return config;
}

// The effective, enabled DoD items the gate must check. Falls back to stack defaults if unconfigured.
export function dod(root, stack = {}) {
  const cfg = load(root);
  const items = cfg?.dod ?? defaultDod(stack);
  return items.filter((it) => it.enabled);
}

// Gate policy knobs (PRD-0006 Q4). `unverified` warns in Phase A, blocks in Phase B; `fail` always blocks.
export function gatePolicy(root) {
  const cfg = load(root);
  return { unverified: 'warn', risk_tiers: true, ...(cfg?.gate ?? {}) };
}

// Build a fresh config object from a detected stack + picked preset (deterministic — ADR-0026).
export function scaffold({ stack = {}, preset = 'minimal' } = {}) {
  return {
    schema: 1,
    stack,
    architecture: { preset, boundaries: 'enforce' },
    dod: defaultDod(stack),
    gate: { unverified: 'warn', risk_tiers: true },
  };
}
