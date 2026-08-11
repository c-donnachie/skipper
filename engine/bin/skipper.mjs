#!/usr/bin/env node
// Skipper Memory CLI. Phase B slice: index (M0/M1) + ask/context (M3 retrieval +
// deterministic render). LLM synthesis (claude -p) and standalone verify/eval are later.
import { build, indexPath } from '../lib/build.mjs';
import { openDb } from '../lib/db.mjs';
import { existsSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from '../lib/repo.mjs';
import { ensureGitignore } from '../lib/gitignore.mjs';
import { ask, contextFor, guard, relate } from '../lib/retrieve.mjs';
import { render, renderBrief } from '../lib/render.mjs';
import { verifyCitations } from '../lib/verify.mjs';
import { serveMcp } from '../lib/mcp.mjs';
import { runGold } from '../lib/eval.mjs';
import { synthesize } from '../lib/llm.mjs';
import * as receipt from '../lib/receipt.mjs';
import * as evidence from '../lib/evidence.mjs';
import * as config from '../lib/config.mjs';
import { classify } from '../lib/risk.mjs';

const NOT_YET = { verify: 'M4 (standalone verify)' };
const argv = process.argv.slice(2);
const cmd = argv[0];

function openIndex(root) {
  if (!existsSync(indexPath(root))) build();
  return openDb(indexPath(root));
}

function answer(makeBundle) {
  const root = repoRoot();
  const db = openIndex(root);
  try {
    const b = makeBundle(root, db);
    const { text, citations } = render(root, b);
    const v = verifyCitations(root, citations);
    console.log(text);
    console.log(`\n— ${v.ok}/${v.checked} citations verified${v.failures.length ? ` (FAIL: ${v.failures.length})` : ''}`);
  } finally {
    db.close();
  }
}

if (cmd === 'index') {
  const root = repoRoot();
  const added = ensureGitignore(root);
  if (added.length) console.log(`.gitignore += ${added.join(', ')}`);
  const r = build();
  console.log(`indexed: ${r.root}`);
  console.log(`  -> ${r.dbPath}`);
  console.log(`  graph: ${r.counts.nodes} nodes · ${r.counts.edges} edges · ${r.counts.mismatches} mismatches`);
} else if (cmd === 'ask') {
  const q = argv.slice(1).filter((a) => !a.startsWith('--')).join(' ');
  if (!q) { console.error('usage: skipper ask "<question>" [--no-llm]'); process.exit(2); }
  const root = repoRoot();
  const db = openIndex(root);
  try {
    const b = ask(root, db, q);
    const { text, citations } = render(root, b);
    const v = verifyCitations(root, citations);
    const prose = argv.includes('--no-llm') ? null : synthesize(q, text);
    if (prose) {
      console.log(prose);
      console.log(`\n— synthesized by your claude from ${v.ok}/${v.checked} verified citations (skipper-memory)`);
    } else {
      console.log(text);
      console.log(`\n— ${v.ok}/${v.checked} citations verified`);
    }
  } finally {
    db.close();
  }
} else if (cmd === 'context') {
  const p = argv.slice(1).find((a) => !a.startsWith('--'));
  if (!p) { console.error('usage: skipper context <path> [--brief]'); process.exit(2); }
  if (argv.includes('--brief')) {
    const root = repoRoot();
    const db = openIndex(root);
    try { const t = renderBrief(contextFor(root, db, p)); if (t) process.stdout.write(t + '\n'); }
    finally { db.close(); }
  } else {
    answer((root, db) => contextFor(root, db, p));
  }
} else if (cmd === 'relate') {
  const normId = (s) => { const m = (s || '').match(/^(adr|prd|plan|arch)[-:](.+)$/i); return m ? `${m[1].toUpperCase()}:${m[2]}` : s; };
  const A = normId(argv[1]);
  const B = normId(argv[2]);
  if (!argv[1] || !argv[2]) { console.error('usage: skipper relate <A> <B>   (e.g. ADR-0001 ADR-0014)'); process.exit(2); }
  const root = repoRoot();
  const db = openIndex(root);
  try {
    const r = relate(db, A, B);
    if (r.kind === 'direct') {
      console.log(`${A} and ${B} are directly linked:`);
      for (const e of r.edges) console.log(`  • ${e.from_id} ${e.type} ${e.to_id}  (${e.src_file}:${e.src_line})`);
    } else if (r.kind === 'doc-mediated') {
      console.log(`${A} ↔ ${B} — doc-mediated via ${r.hub}${r.hubNode ? ` (${r.hubNode.title})` : ''}:`);
      if (r.citeA) console.log(`  • ${r.hub} → ${A}  (${r.citeA.src_file}:${r.citeA.src_line})`);
      if (r.citeB) console.log(`  • ${r.hub} → ${B}  (${r.citeB.src_file}:${r.citeB.src_line})`);
      console.log('  (doc-mediated — NOT a direct ADR-to-ADR edge.)');
    } else {
      console.log(`${A} and ${B} are not linked in the decision graph.`);
    }
  } finally {
    db.close();
  }
} else if (cmd === 'guard') {
  const root = repoRoot();
  const db = openIndex(root);
  try { const t = guard(root, db); if (t) process.stdout.write(t + '\n'); }
  finally { db.close(); }
} else if (cmd === 'eval') {
  const root = repoRoot();
  const db = openIndex(root);
  try {
    const r = runGold(root, db);
    for (const c of r.results) console.log(`${c.ok ? '✓' : '✗'} ${c.id.padEnd(22)} ${c.detail}`);
    console.log(`\n${r.passed}/${r.total} gold checks passed`);
    if (r.failed) process.exitCode = 1;
  } finally {
    db.close();
  }
} else if (cmd === 'gate') {
  // Spec-anchored delivery gate (PRD-0006 M3/M4 + ADR-0024/0025). Zero graph dependency.
  const root = repoRoot();
  const sub = argv[1] || 'validate';
  if (sub === 'risk') {
    // Deterministic risk classification for the current change (drives review lens depth — S2).
    const r = classify(root);
    console.log(`risk: ${r.tier}  (${r.files} files · ${r.churn} lines)`);
    for (const reason of r.reasons) console.log(`  • ${reason}`);
    const lens = r.tier === 'high' ? '4R (Risk · Readability · Reliability · Resilience) + forecast'
      : r.tier === 'low' ? 'structural readback (silent, 0 lenses)' : '1 focus lens + consent';
    console.log(`  → review: ${lens}`);
  } else if (sub === 'install-hook') {
    // Opt-in delivery gate (PRD-0006 S1). pre-push revalidates the receipt before code leaves the
    // machine. Graceful: if the `skipper` CLI isn't on PATH, the hook is a no-op (never blocks push).
    const hookDir = join(root, '.git', 'hooks');
    const hookPath = join(hookDir, 'pre-push');
    const script = [
      '#!/bin/sh',
      '# Skipper spec-anchored delivery gate (PRD-0006 S1 / ADR-0025).',
      '# Revalidates the content-bound receipt; blocks push if STALE. Unmanaged never blocks.',
      'command -v skipper >/dev/null 2>&1 || exit 0',
      'exec skipper gate validate',
      '',
    ].join('\n');
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(hookPath, script);
    chmodSync(hookPath, 0o755);
    console.log(`installed ${hookPath} → skipper gate validate (pre-push)`);
  } else if (sub === 'freeze') {
    // Run the project DoD evidence, then emit a content-bound receipt if nothing failed.
    const items = config.dod(root);
    const policy = config.gatePolicy(root);
    // Manual/human evidence: `--artifact=<id>=<path>` attaches proof (PRD-0006 S3/Q2). Without it, `unverified`.
    const optsById = {};
    for (const a of argv) {
      const m = a.match(/^--artifact=([^=]+)=(.+)$/);
      if (m) optsById[m[1]] = { artifact: m[2] };
    }
    const results = evidence.runAll(root, items, optsById);
    const verdict = evidence.gateVerdict(results, policy);
    for (const r of results) {
      const mark = r.result === 'pass' ? '✓' : r.result === 'fail' ? '✗' : '○';
      console.log(`  ${mark} ${r.id.padEnd(16)} ${r.method.padEnd(7)} ${r.result}`);
    }
    if (verdict.status === 'blocked') {
      console.error(`\ngate: BLOCKED (${verdict.reason}) — no receipt issued.`);
      process.exit(1);
    }
    const risk = classify(root);
    const rec = receipt.emit(root, {
      criteria: results.map((r) => ({ id: r.id, verdict: r.result })),
      evidenceDigest: evidence.evidenceDigest(results),
      reviewVerdict: verdict.status, // pass | warn
      riskTier: risk.tier,
    });
    console.log(`\ngate: receipt issued (${verdict.status}, risk: ${risk.tier}) — ${rec.content_hash.slice(0, 12)} over ${rec.files.length} file(s)`);
    if (verdict.status === 'warn') console.log(`  note: ${verdict.unverified.length} unverified (policy: ${policy.unverified})`);
  } else {
    // validate: revalidate the stored receipt against current content (for delivery hooks).
    const v = receipt.validate(root);
    if (v.status === 'valid') { console.log('gate: receipt valid ✓ (content unchanged since freeze)'); }
    else if (v.status === 'stale') { console.error('gate: receipt STALE — content changed; re-run /skipper:review to re-freeze.'); process.exit(1); }
    else { console.log('gate: unmanaged (no receipt — review not run or disabled). Not blocking.'); }
  }
} else if (cmd === 'config') {
  // Deterministic policy-file management (ADR-0026). `config init` scaffolds skipper.config.json
  // (committed, at repo root — NOT under .skipper/). `config show` prints the effective DoD.
  const root = repoRoot();
  const sub = argv[1] || 'show';
  if (sub === 'init') {
    if (config.load(root)) { console.log(`${config.CONFIG_FILE} already exists — leaving it untouched.`); process.exit(0); }
    const presetArg = argv.find((a) => a.startsWith('--preset='));
    const preset = presetArg ? presetArg.split('=')[1] : 'minimal';
    const isTs = existsSync(`${root}/tsconfig.json`);
    const stack = isTs ? { language: 'typescript' } : {};
    config.save(root, config.scaffold({ stack, preset }));
    const items = config.dod(root, stack);
    console.log(`wrote ${config.CONFIG_FILE} (preset: ${preset}) — ${items.length} DoD items enabled`);
    for (const it of items) console.log(`  ● ${it.id.padEnd(14)} ${it.method}`);
  } else {
    const items = config.dod(root);
    console.log(`DoD (${items.length} enabled):`);
    for (const it of items) console.log(`  ● ${it.id.padEnd(14)} ${it.method.padEnd(7)} ${it.title}`);
  }
} else if (cmd === 'mcp') {
  serveMcp(); // stdio MCP server; stays alive on stdin
} else if (cmd === '--version' || cmd === 'version') {
  console.log('skipper-memory 0.0.1 (Phase B — M0/M1 + M3 retrieval + M5 MCP + gate)');
} else if (NOT_YET[cmd]) {
  console.error(`'${cmd}' not implemented yet — ${NOT_YET[cmd]}.`);
  process.exit(2);
} else {
  console.error('usage: skipper <index|ask|context|relate|guard|gate|config|mcp|--version>');
  process.exit(2);
}
