// Deterministic risk classifier (PRD-0006 S2, ADR-0026). Classifies a change as low|standard|high
// from objective signals — NOT the LLM's guess. The review skill uses the tier to scale ceremony:
//   low      → silent structural readback (0 lenses)
//   standard → 1 focus lens + consent
//   high     → canonical 4R (Risk · Readability · Reliability · Resilience) + consent + forecast
// (lens depth pattern from gentle-ai). The tier is recorded in the receipt (ADR-0025).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { changedFiles } from './receipt.mjs';
import { load } from './config.mjs';

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// Paths where a change is high-risk regardless of size. Overridable via config.gate.sensitive_paths.
const DEFAULT_SENSITIVE = [
  'auth', 'login', 'session', 'password', 'secret', 'token', 'crypto',
  'payment', 'billing', 'security', 'migration', 'schema', 'rls',
  'policy', 'policies', 'permission', '.env',
];
// Low-risk file kinds: docs, tests, styles. A change made ONLY of these can be `low`.
const SAFE = /(\.(md|mdx|css|scss|snap)$)|((^|\/)(tests?|__tests__)\/)|(\.(test|spec)\.[jt]sx?$)/i;

function churnFor(root, files) {
  let churn = 0;
  try {
    const ns = git(['diff', '--numstat', 'HEAD'], root);
    if (ns) for (const line of ns.split('\n')) {
      const [add, del] = line.split('\t');
      if (add !== '-' && del !== '-') churn += (parseInt(add, 10) || 0) + (parseInt(del, 10) || 0);
    }
  } catch { /* no HEAD */ }
  // untracked files aren't in numstat — approximate their churn by line count
  const tracked = new Set((() => { try { return git(['diff', '--name-only', 'HEAD'], root).split('\n'); } catch { return []; } })());
  for (const f of files) {
    if (tracked.has(f)) continue;
    try { churn += readFileSync(join(root, f), 'utf8').split('\n').length; } catch { /* deleted */ }
  }
  return churn;
}

export function classify(root, files = changedFiles(root)) {
  const cfg = load(root);
  const sensitive = (cfg?.gate?.sensitive_paths ?? DEFAULT_SENSITIVE).map((s) => s.toLowerCase());
  const reasons = [];

  const hit = files.filter((f) => sensitive.some((s) => f.toLowerCase().includes(s)));
  if (hit.length) reasons.push(`sensitive path (${hit.slice(0, 3).join(', ')})`);

  const churn = churnFor(root, files);
  const manyFiles = files.length >= 10;
  const bigChurn = churn >= 400;
  if (manyFiles) reasons.push(`${files.length} files changed`);
  if (bigChurn) reasons.push(`${churn} lines changed`);

  let tier = 'standard';
  if (hit.length || manyFiles || bigChurn) tier = 'high';
  else if (files.length > 0 && files.length <= 2 && churn <= 30 && files.every((f) => SAFE.test(f))) {
    tier = 'low';
    reasons.push('small, docs/tests/styles only');
  }
  return { tier, reasons, files: files.length, churn };
}
