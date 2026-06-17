// Idempotent full rebuild of the graph index.
// M0: creates the DB + schema + meta (schema_version, head_sha). The M1 parser
// will populate nodes/edges/mismatches at the marked point below.
//
// Idempotency contract (plan-0004 M0, critic must-fix #4): two builds at the SAME
// HEAD produce identical LOGICAL row content — NOT a byte-identical SQLite file.
// We therefore store no wall-clock time; head_sha is constant for a given HEAD.
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { openDb, applySchema, SCHEMA_VERSION } from './db.mjs';
import { repoRoot, headSha } from './repo.mjs';

export function indexDir(root) {
  return join(root, '.skipper', 'index');
}

export function indexPath(root) {
  return join(indexDir(root), 'graph.sqlite');
}

export function build({ cwd = process.cwd() } = {}) {
  const root = repoRoot(cwd);
  const dir = indexDir(root);

  // Full rebuild = trivially idempotent. Cheap at this corpus size; --since incremental is M6.
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const db = openDb(indexPath(root));
  applySchema(db);

  // === M1 parser populates nodes/edges/mismatches HERE ===

  const setMeta = db.prepare('INSERT OR REPLACE INTO meta(key, value) VALUES (?, ?)');
  setMeta.run('schema_version', String(SCHEMA_VERSION));
  setMeta.run('head_sha', headSha(root));

  const count = (t) => db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
  const counts = { nodes: count('nodes'), edges: count('edges'), mismatches: count('mismatches') };

  db.close();
  return { root, dbPath: indexPath(root), counts };
}
