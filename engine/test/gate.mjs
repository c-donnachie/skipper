// PRD-0006 gate acceptance: receipt is content-bound & deterministic, evidence is honest,
// verdict logic is correct. Runs in a throwaway git repo — no dependency on the host repo.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as receipt from '../lib/receipt.mjs';
import * as evidence from '../lib/evidence.mjs';
import * as config from '../lib/config.mjs';
import { classify } from '../lib/risk.mjs';

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log(`✓ ${name}`); } else { failed++; console.error(`✗ ${name}`); } };

function git(args, cwd) { return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim(); }

const root = mkdtempSync(join(tmpdir(), 'skipper-gate-'));
try {
  git(['init', '-q'], root);
  git(['config', 'user.email', 't@t'], root);
  git(['config', 'user.name', 't'], root);
  writeFileSync(join(root, 'a.txt'), 'hello\n');
  git(['add', '.'], root);
  git(['commit', '-qm', 'init'], root);

  // --- receipt: content-bound & deterministic ---
  writeFileSync(join(root, 'a.txt'), 'hello world\n'); // uncommitted change
  const h1 = receipt.contentHash(root);
  const h2 = receipt.contentHash(root);
  ok('content_hash deterministic (same content → same hash)', h1 === h2 && h1.length === 64);

  const rec = receipt.emit(root, { criteria: [{ id: 'tests', verdict: 'pass' }], reviewVerdict: 'pass' });
  ok('emit writes a receipt with the content hash', rec.content_hash === h1 && rec.files.includes('a.txt'));
  ok('validate → valid when content unchanged', receipt.validate(root).status === 'valid');

  writeFileSync(join(root, 'a.txt'), 'changed again\n');
  ok('validate → stale after a covered file changes', receipt.validate(root).status === 'stale');

  const clean = mkdtempSync(join(tmpdir(), 'skipper-gate-clean-'));
  git(['init', '-q'], clean);
  ok('validate → unmanaged with no receipt', receipt.validate(clean).status === 'unmanaged');
  rmSync(clean, { recursive: true, force: true });

  // --- evidence: honesty rule (M5) ---
  const pass = evidence.runCriterion(root, { id: 'x', method: 'test', command: 'true' });
  const fail = evidence.runCriterion(root, { id: 'y', method: 'test', command: 'false' });
  const manual = evidence.runCriterion(root, { id: 'z', method: 'manual' });
  const manualOk = evidence.runCriterion(root, { id: 'z', method: 'manual' }, { artifact: 'screenshot.png' });
  const noCmd = evidence.runCriterion(root, { id: 'w', method: 'test' });
  ok('test with exit 0 → pass', pass.result === 'pass');
  ok('test with exit 1 → fail', fail.result === 'fail');
  ok('manual without artifact → unverified (never green)', manual.result === 'unverified');
  ok('manual with artifact → pass', manualOk.result === 'pass');
  ok('runnable method without command → unverified', noCmd.result === 'unverified');

  // --- verdict logic ---
  ok('any fail → blocked', evidence.gateVerdict([fail, pass]).status === 'blocked');
  ok('unverified + warn policy → warn', evidence.gateVerdict([manual, pass], { unverified: 'warn' }).status === 'warn');
  ok('unverified + block policy → blocked', evidence.gateVerdict([manual], { unverified: 'block' }).status === 'blocked');
  ok('all pass → pass', evidence.gateVerdict([pass]).status === 'pass');

  // --- config: stack-aware DoD defaults ---
  const tsDod = config.defaultDod({ language: 'typescript@5.6' });
  ok('TS stack includes a type-check item', tsDod.some((i) => i.method === 'type'));
  ok('non-TS stack omits type-check', !config.defaultDod({ language: 'python' }).some((i) => i.method === 'type'));
  ok('scaffold produces schema+dod+gate', (() => { const c = config.scaffold({ stack: {}, preset: 'layered' }); return c.schema === 1 && Array.isArray(c.dod) && !!c.gate; })());

  // --- risk classifier (S2) — deterministic, from explicit file lists ---
  ok('sensitive path → high', classify(root, ['src/auth/login.ts']).tier === 'high');
  ok('migration → high', classify(root, ['db/migrations/001_init.sql']).tier === 'high');
  ok('10+ files → high', classify(root, Array.from({ length: 12 }, (_, i) => `src/f${i}.js`)).tier === 'high');
  ok('docs-only small → low', classify(root, ['docs/guide.md']).tier === 'low');
  ok('ordinary code change → standard', classify(root, ['src/widget.js']).tier === 'standard');

  console.log(`\n${passed}/${passed + failed} gate checks passed`);
  if (failed) process.exit(1);
} finally {
  rmSync(root, { recursive: true, force: true });
}
