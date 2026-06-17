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
import { parseRepo } from './parse.mjs';

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

  // === M1: parse the corpus into typed nodes + directed edges ===
  const { nodes, edges } = parseRepo(root);
  const insNode = db.prepare(
    `INSERT INTO nodes (id,type,title,path,number,status,version_tag,date,self_freshness,reflects_version,git_last_sha,git_last_ts,code_commits_since,h1_line)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );
  for (const n of nodes) {
    insNode.run(
      n.id, n.type, n.title ?? null, n.path, n.number ?? null, n.status ?? null,
      n.version_tag ?? null, n.date ?? null, n.self_freshness ?? null, n.reflects_version ?? null,
      null, null, null, n.h1_line ?? null,
    );
  }
  const insEdge = db.prepare(
    `INSERT INTO edges (from_id,to_id,type,edge_class,src_file,src_line,raw_text,resolved)
     VALUES (?,?,?,?,?,?,?,?)`,
  );
  for (const e of edges) {
    insEdge.run(e.from_id, e.to_id, e.type, e.edge_class, e.src_file ?? null, e.src_line ?? null, e.raw_text ?? null, e.resolved);
  }

  const setMeta = db.prepare('INSERT OR REPLACE INTO meta(key, value) VALUES (?, ?)');
  setMeta.run('schema_version', String(SCHEMA_VERSION));
  setMeta.run('head_sha', headSha(root));

  const count = (t) => db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
  const counts = { nodes: count('nodes'), edges: count('edges'), mismatches: count('mismatches') };

  db.close();
  return { root, dbPath: indexPath(root), counts };
}
