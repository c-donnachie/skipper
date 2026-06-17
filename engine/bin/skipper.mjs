#!/usr/bin/env node
// Skipper Memory CLI. Phase B slice: index (M0/M1) + ask/context (M3 retrieval +
// deterministic render). LLM synthesis (claude -p) and standalone verify/eval are later.
import { build, indexPath } from '../lib/build.mjs';
import { openDb } from '../lib/db.mjs';
import { existsSync } from 'node:fs';
import { repoRoot } from '../lib/repo.mjs';
import { ensureGitignore } from '../lib/gitignore.mjs';
import { ask, contextFor, guard } from '../lib/retrieve.mjs';
import { render, renderBrief } from '../lib/render.mjs';
import { verifyCitations } from '../lib/verify.mjs';
import { serveMcp } from '../lib/mcp.mjs';
import { runGold } from '../lib/eval.mjs';
import { synthesize } from '../lib/llm.mjs';

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
} else if (cmd === 'mcp') {
  serveMcp(); // stdio MCP server; stays alive on stdin
} else if (cmd === '--version' || cmd === 'version') {
  console.log('skipper-memory 0.0.1 (Phase B — M0/M1 + M3 retrieval + M5 MCP)');
} else if (NOT_YET[cmd]) {
  console.error(`'${cmd}' not implemented yet — ${NOT_YET[cmd]}.`);
  process.exit(2);
} else {
  console.error('usage: skipper <index|ask|context|mcp|--version>');
  process.exit(2);
}
