#!/usr/bin/env node
// Skipper Memory CLI. Phase B slice: index (M0/M1) + ask/context (M3 retrieval +
// deterministic render). LLM synthesis (claude -p) and standalone verify/eval are later.
import { build, indexPath } from '../lib/build.mjs';
import { openDb } from '../lib/db.mjs';
import { repoRoot } from '../lib/repo.mjs';
import { ensureGitignore } from '../lib/gitignore.mjs';
import { ask, contextFor } from '../lib/retrieve.mjs';
import { render } from '../lib/render.mjs';
import { verifyCitations } from '../lib/verify.mjs';
import { serveMcp } from '../lib/mcp.mjs';

const NOT_YET = { verify: 'M4 (standalone verify)', eval: 'M6 (gold gate)' };
const argv = process.argv.slice(2);
const cmd = argv[0];

function answer(makeBundle) {
  const root = repoRoot();
  const db = openDb(indexPath(root));
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
  if (!q) { console.error('usage: skipper ask "<question>"'); process.exit(2); }
  answer((root, db) => ask(root, db, q));
} else if (cmd === 'context') {
  const p = argv[1];
  if (!p) { console.error('usage: skipper context <path>'); process.exit(2); }
  answer((root, db) => contextFor(root, db, p));
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
