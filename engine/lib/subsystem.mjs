// doc<->code mapping, governing-ADR seed, and version-drift freshness.
// (Phase B slice. git-based freshness, person identity, and a committed repo override
// for the seed are M2-remainder — noted in plan-0004.)
import { readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { git } from './repo.mjs';

// Built-in defaults. Overridable per-repo via a committed `skipper-memory.config.json`
// (graph edges are too sparse for code modules to derive governance — critic must-fix #3).
const DEFAULT_GOVERNS = {
  'hooks/': ['ADR-0009', 'ADR-0010', 'ADR-0011', 'ADR-0018'],
  'agents/': ['ADR-0002', 'ADR-0004'],
  'skills/': ['ADR-0002', 'ADR-0004'],
  'lib/': ['ADR-0008'],
  'stacks/': ['ADR-0003', 'ADR-0005'],
};
const DEFAULT_SUBSYSTEMS = {
  'docs/architecture/hooks.md': 'hooks',
  'docs/architecture/agents.md': 'agents',
  'docs/architecture/detection.md': 'lib',
  'docs/architecture/platform-memory.md': 'engine',
};

// Read the committed per-repo override (NOT under .skipper/, so it is tracked), else defaults.
let _cfg = null;
let _cfgRoot = null;
function loadConfig(root) {
  if (_cfgRoot === root && _cfg) return _cfg;
  let file = {};
  try {
    const p = join(root, 'skipper-memory.config.json');
    if (existsSync(p)) file = JSON.parse(readFileSync(p, 'utf8'));
  } catch { file = {}; }
  _cfg = { governs: file.governs || DEFAULT_GOVERNS, subsystems: file.subsystems || DEFAULT_SUBSYSTEMS };
  _cfgRoot = root;
  return _cfg;
}
const normAdr = (id) => id.replace(/^([A-Za-z]+)-/, (m, g) => `${g.toUpperCase()}:`);

export function governingAdrs(root, path) {
  const { governs } = loadConfig(root);
  const p = path.replace(/^\.\//, '').replace(/^\//, '');
  for (const [prefix, adrs] of Object.entries(governs)) {
    if (p === prefix.replace(/\/$/, '') || p.startsWith(prefix)) return adrs.map(normAdr);
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

export const STALE_CODE_COMMITS = 12;

// git-delta: when was the doc last edited, and how many commits touched its code since.
// Computed at build time and stored on the node (query stays fast). Deterministic for a HEAD.
export function docGitStats(root, node) {
  const dir = loadConfig(root).subsystems[node.path];
  if (!dir) return {};
  try {
    const lastSha = git(['log', '-1', '--format=%H', '--', node.path], root);
    if (!lastSha) return {};
    const lastTs = git(['log', '-1', '--format=%aI', '--', node.path], root);
    const n = parseInt(git(['rev-list', '--count', `${lastSha}..HEAD`, '--', dir], root) || '0', 10);
    return { git_last_sha: lastSha.slice(0, 7), git_last_ts: lastTs, code_commits_since: Number.isNaN(n) ? null : n };
  } catch {
    return {};
  }
}

// Freshness signal (#2): version-drift (doc "Reflects vX" vs plugin.json) OR git-delta
// (>= STALE_CODE_COMMITS commits touched the doc's code since it was last edited).
export function freshnessFor(root, node) {
  const pv = pluginVersion(root);
  const declared = node.reflects_version ? node.reflects_version.replace(/^v/, '') : null;
  const versionDrift = !!(declared && pv && declared !== pv);
  const codeDrift = node.code_commits_since != null && node.code_commits_since >= STALE_CODE_COMMITS;
  if (versionDrift || codeDrift) {
    const r = [];
    if (versionDrift) r.push(`doc declares v${declared} vs plugin v${pv}`);
    if (codeDrift) r.push(`${node.code_commits_since} code commits since the doc was last touched`);
    return { stale: true, reason: r.join('; ') };
  }
  return { stale: false };
}
