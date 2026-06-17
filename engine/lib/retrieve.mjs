// M3 retrieval (no vectors): lexical anchor -> directed declared-edge expansion -> Bundle.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveSubsystem, governingAdrs, freshnessFor } from './subsystem.mjs';
import { git } from './repo.mjs';

const getNode = (db, id) => db.prepare('SELECT * FROM nodes WHERE id=?').get(id) || null;
const outE = (db, id) => db.prepare("SELECT * FROM edges WHERE from_id=? AND edge_class='declared'").all(id);
const inE = (db, id) => db.prepare("SELECT * FROM edges WHERE to_id=? AND edge_class='declared'").all(id);

// Read the first non-empty paragraph of a `## <heading>` section, with its 1-based line.
export function readSection(root, path, heading) {
  let lines;
  try { lines = readFileSync(join(root, path), 'utf8').split('\n'); } catch { return null; }
  const h = heading.toLowerCase();
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.*)/);
    if (m && m[1].trim().toLowerCase().startsWith(h)) {
      const para = [];
      let startLine = null;
      for (let k = i + 1; k < lines.length; k++) {
        if (/^##\s/.test(lines[k])) break;
        if (lines[k].trim() === '') { if (para.length) break; else continue; }
        if (startLine === null) startLine = k + 1;
        para.push(lines[k].trim());
      }
      return para.length ? { text: para.join(' '), line: startLine } : null;
    }
  }
  return null;
}

function bundle(root, db, anchors, meta) {
  const edges = [];
  const nodeMap = new Map();
  for (const a of anchors) {
    if (!a) continue;
    nodeMap.set(a.id, a);
    for (const e of outE(db, a.id)) { edges.push(e); const t = getNode(db, e.to_id); if (t) nodeMap.set(t.id, t); }
    for (const e of inE(db, a.id)) { edges.push(e); const f = getNode(db, e.from_id); if (f) nodeMap.set(f.id, f); }
  }
  const freshness = {};
  for (const n of nodeMap.values()) { const f = freshnessFor(root, n); if (f.stale) freshness[n.id] = f; }
  return { ...meta, anchors: anchors.filter(Boolean), edges, nodes: [...nodeMap.values()], freshness };
}

export function ask(root, db, question) {
  const explicit = [...question.matchAll(/\b(ADR|PRD|PLAN)-?\s?(\d{4})\b/gi)].map((m) => `${m[1].toUpperCase()}:${m[2]}`);
  const qToks = question.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 4);
  const scored = db.prepare('SELECT * FROM nodes').all().map((n) => {
    let s = 0;
    if (explicit.includes(n.id)) s += 100;
    const title = (n.title || '').toLowerCase();
    const path = (n.path || '').toLowerCase();
    for (const t of qToks) { if (title.includes(t)) s += 10; if (path.includes(t)) s += 5; }
    return { n, s };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  const b = bundle(root, db, scored.slice(0, 3).map((x) => x.n), { kind: 'ask', question });
  const top = b.anchors[0];
  if (top) {
    b.deciders = db.prepare("SELECT to_id FROM edges WHERE from_id=? AND type='decided-by'").all(top.id)
      .map((r) => getNode(db, r.to_id)).filter(Boolean).map((n) => n.title);
    b.mismatches = db.prepare('SELECT * FROM mismatches WHERE node_a=? OR node_b=?').all(top.id, top.id);
  }
  return b;
}

export function contextFor(root, db, path) {
  const sub = resolveSubsystem(db, path);
  const govIds = governingAdrs(path);
  const governing = govIds.map((id) => getNode(db, id)).filter(Boolean);
  const b = bundle(root, db, [sub, ...governing], { kind: 'context', path });
  b.subsystemDoc = sub;
  b.governing = governing;
  const seg = (path.replace(/^\.?\//, '').split('/')[0]) || '';
  if (seg) {
    b.recentCommits = db.prepare(
      `SELECT n.id AS id, n.title AS title, n.date AS date, p.title AS author
       FROM edges t JOIN nodes n ON n.id = t.from_id
       LEFT JOIN edges a ON a.from_id = n.id AND a.type = 'authored-by'
       LEFT JOIN nodes p ON p.id = a.to_id
       WHERE t.type = 'touches' AND t.to_id = ?
       ORDER BY n.date DESC LIMIT 3`,
    ).all(`MODULE:${seg}`);
  }
  return b;
}

// Stop-enforcement (ADR-0018 follow-on): inspect the working tree's uncommitted changes;
// if any GOVERNED code path changed, return a block directive listing the governing ADRs
// (+ stale governing docs) for Claude to self-verify compliance. Empty when nothing governed
// changed. Detecting actual violation is Claude's judgment — this forces the confrontation.
export function guard(root, db) {
  let status;
  try { status = git(['status', '--porcelain'], root); } catch { return ''; }
  const paths = status.split('\n').map((l) => l.slice(3).trim()).filter(Boolean)
    .map((p) => (p.includes(' -> ') ? p.split(' -> ')[1] : p)); // handle renames
  const adrIds = new Set();
  const stale = new Map();
  for (const p of paths) {
    if (/^docs\//.test(p) || /\.(md|mdx)$/.test(p) || /^engine\//.test(p) || /^\.skipper\//.test(p) || /^\.claude\//.test(p)) continue;
    const gov = governingAdrs(p);
    if (!gov.length) continue;
    gov.forEach((id) => adrIds.add(id));
    const sub = resolveSubsystem(db, p);
    if (sub) { const f = freshnessFor(root, sub); if (f.stale) stale.set(sub.path, f.reason); }
  }
  if (!adrIds.size) return '';
  const L = ['🐧 skipper memory — this turn changed code governed by project decisions. Before yielding, verify the change COMPLIES (fix it, or supersede the ADR if the decision itself changed):'];
  for (const id of [...adrIds].sort()) { const n = getNode(db, id); L.push(`  • ${id.replace(':', '-')}${n ? ` ${n.title}` : ''}`); }
  for (const [doc, reason] of stale) L.push(`  ⚠ ${doc} ${reason} — update it this turn.`);
  return L.join('\n');
}

// Hub-node fallback (#5): relate two nodes. Prefer a direct declared edge; else route through
// a hub doc that declares references to BOTH (labelled doc-mediated, never a fabricated direct
// edge); else 'not-linked'. Hubs ranked: architecture docs first, then fewest outbound refs.
export function relate(db, a, b) {
  const direct = db.prepare(
    "SELECT from_id,to_id,type,src_file,src_line FROM edges WHERE edge_class='declared' AND ((from_id=? AND to_id=?) OR (from_id=? AND to_id=?))",
  ).all(a, b, b, a);
  if (direct.length) return { kind: 'direct', edges: direct };

  const refTo = (id) => new Set(db.prepare("SELECT from_id FROM edges WHERE edge_class='declared' AND type IN ('references','originated-from','implements') AND to_id=?").all(id).map((r) => r.from_id));
  const toA = refTo(a);
  const hubs = [...refTo(b)].filter((x) => toA.has(x) && x !== a && x !== b);
  if (!hubs.length) return { kind: 'not-linked' };

  const ranked = hubs.map((h) => ({
    h, node: getNode(db, h),
    out: db.prepare("SELECT COUNT(*) AS c FROM edges WHERE from_id=? AND edge_class='declared'").get(h).c,
  })).sort((x, y) => (y.node?.type === 'arch' ? 1 : 0) - (x.node?.type === 'arch' ? 1 : 0) || x.out - y.out);
  const best = ranked[0];
  const cite = (from, to) => db.prepare("SELECT src_file,src_line FROM edges WHERE from_id=? AND to_id=? AND edge_class='declared' LIMIT 1").get(from, to);
  return { kind: 'doc-mediated', hub: best.h, hubNode: best.node, citeA: cite(best.h, a), citeB: cite(best.h, b) };
}
