// doc<->code mapping, governing-ADR seed, and version-drift freshness.
// (Phase B slice. git-based freshness, person identity, and a committed repo override
// for the seed are M2-remainder — noted in plan-0004.)
import { readFileSync } from 'node:fs';
import { join, basename } from 'node:path';

// Seed: code-path prefix -> governing ADR ids. Graph edges are too sparse for code
// modules to derive this, so it is curated for Phase B (critic must-fix #3).
const GOVERNS = [
  ['hooks/',  ['ADR:0009', 'ADR:0010', 'ADR:0011', 'ADR:0018']],
  ['agents/', ['ADR:0002', 'ADR:0004']],
  ['skills/', ['ADR:0002', 'ADR:0004']],
  ['lib/',    ['ADR:0008']],
  ['stacks/', ['ADR:0003', 'ADR:0005']],
];

export function governingAdrs(path) {
  const p = path.replace(/^\.\//, '').replace(/^\//, '');
  for (const [prefix, adrs] of GOVERNS) {
    if (p === prefix.replace(/\/$/, '') || p.startsWith(prefix)) return adrs;
  }
  return [];
}

// The arch doc whose >=4-char name tokens overlap the path (bidirectional substring),
// mirroring the spirit of hooks/docs-sync.sh's keyword map.
export function resolveSubsystem(db, path) {
  const p = path.toLowerCase();
  const pTokens = p.split(/[^a-z0-9]+/).filter((t) => t.length >= 4);
  for (const a of db.prepare("SELECT * FROM nodes WHERE type='arch'").all()) {
    const key = basename(a.path, '.md').toLowerCase();
    const kTokens = key.split(/[^a-z0-9]+/).filter((t) => t.length >= 4);
    const hit = kTokens.some((t) => p.includes(t)) || pTokens.some((pt) => key.includes(pt));
    if (hit) return a;
  }
  return null;
}

export function pluginVersion(root) {
  try {
    return JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8')).version || null;
  } catch {
    return null;
  }
}

// Version-drift half of the freshness signal (#2): doc-declared "Reflects vX" vs plugin.json.
// (The git-delta half — code_commits_since — is M2-remainder.)
export function freshnessFor(root, node) {
  const pv = pluginVersion(root);
  const declared = node.reflects_version ? node.reflects_version.replace(/^v/, '') : null;
  if (declared && pv && declared !== pv) {
    return { stale: true, reason: `doc declares v${declared} vs plugin v${pv}` };
  }
  return { stale: false };
}
