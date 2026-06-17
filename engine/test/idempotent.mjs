// M0 acceptance: two builds at the same HEAD yield identical LOGICAL rows
// (not a byte-identical SQLite file). Synthetic AUTOINCREMENT ids (edges, mismatches)
// are excluded from the comparison; nodes.id is a real type-prefixed key and is kept.
import { build, indexPath } from '../lib/build.mjs';
import { openDb } from '../lib/db.mjs';
import { repoRoot } from '../lib/repo.mjs';

const TABLES = {
  meta: 'key, value',
  nodes:
    'id, type, title, path, number, status, version_tag, date, self_freshness, reflects_version, git_last_sha, git_last_ts, code_commits_since, h1_line',
  edges: 'from_id, to_id, type, edge_class, src_file, src_line, raw_text, resolved',
  mismatches: 'node_a, src_a, line_a, claim_a, node_b, src_b, line_b, claim_b, kind, note',
};

function dump(dbPath) {
  const db = openDb(dbPath);
  const out = {};
  for (const [t, cols] of Object.entries(TABLES)) {
    out[t] = db.prepare(`SELECT ${cols} FROM ${t} ORDER BY ${cols}`).all();
  }
  db.close();
  return JSON.stringify(out);
}

const root = repoRoot();
const r1 = build();
const d1 = dump(indexPath(root));
const r2 = build();
const d2 = dump(indexPath(root));

console.log('build #1 counts:', r1.counts);
console.log('build #2 counts:', r2.counts);
const ok = d1 === d2;
console.log(`logical rows identical at same HEAD: ${ok ? 'PASS' : 'FAIL'}`);
if (!ok) {
  console.error('--- build #1 ---\n' + d1 + '\n--- build #2 ---\n' + d2);
  process.exit(1);
}
