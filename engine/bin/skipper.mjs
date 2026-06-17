#!/usr/bin/env node
// Skipper Memory CLI. M0 ships `index` + `--version`; the rest land in later milestones.
import { build } from '../lib/build.mjs';
import { repoRoot } from '../lib/repo.mjs';
import { ensureGitignore } from '../lib/gitignore.mjs';

const NOT_YET = {
  ask: 'M3/M4 (retrieval + renderer)',
  context: 'M3/M5 (context_for + MCP/CLI)',
  verify: 'M4 (citation self-verification)',
  eval: 'M6 (gold regression gate)',
};

const [cmd] = process.argv.slice(2);

if (cmd === 'index') {
  const root = repoRoot();
  const added = ensureGitignore(root);
  if (added.length) console.log(`.gitignore += ${added.join(', ')}`);
  const r = build();
  console.log(`indexed: ${r.root}`);
  console.log(`  -> ${r.dbPath}`);
  console.log(
    `  graph: ${r.counts.nodes} nodes · ${r.counts.edges} edges · ${r.counts.mismatches} mismatches`,
  );
} else if (cmd === '--version' || cmd === 'version') {
  console.log('skipper-memory 0.0.1 (Phase B / M0 — foundations)');
} else if (NOT_YET[cmd]) {
  console.error(`'${cmd}' is not implemented yet — arrives in ${NOT_YET[cmd]}. M0 ships 'index' + '--version' only.`);
  process.exit(2);
} else {
  console.error('usage: skipper <index|ask|context|verify|eval|--version>');
  process.exit(2);
}
