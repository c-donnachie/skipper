// M3 retrieval (no vectors): lexical anchor -> directed declared-edge expansion -> Bundle.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { resolveSubsystem, governingAdrs, freshnessFor } from './subsystem.mjs';
import { git } from './repo.mjs';
import { changedFiles } from './receipt.mjs';

// SPEC governance (PRD-0006 M7): a SPEC anchors code via the backtick-quoted paths in its body
// (its `Touched code:` line / criteria commands). Additive & config-free — does NOT touch the
// config-driven governingAdrs. Lets the proactive guard surface the governing SPEC on edit.
export function specGovernance(root) {
  let files;
  try { files = readdirSync(join(root, 'docs/specs')); } catch { return []; }
  const out = [];
  for (const f of files) {
    const m = f.match(/^(\d{4})-/);
    if (!f.endsWith('.md') || f === 'README.md' || !m) continue;
    let raw;
    try { raw = readFileSync(join(root, 'docs/specs', f), 'utf8'); } catch { continue; }
    const paths = new Set();
    for (const bm of raw.matchAll(/`([^`]+)`/g)) {
      const tok = bm[1].trim();
      if (/^[\w.@-]+(?:\/[\w.@-]+)+\.\w+$/.test(tok)) paths.add(tok); // looks like a real file path
    }
    if (!paths.size) continue;
    const title = (raw.match(/^#\s+(?:\d{4}\s*[—–-]\s*)?(.*)/m)?.[1] || f).trim();
    out.push({ id: `SPEC-${m[1]}`, title, paths: [...paths] });
  }
  return out;
}

// word-boundary match (avoids substring false positives like "algo" ⊂ "algoritmo")
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordHit = (text, tok) => new RegExp(`\\b${esc(tok)}\\b`, 'i').test(text);

const getNode = (db, id) => db.prepare('SELECT * FROM nodes WHERE id=?').get(id) || null;
const outE = (db, id) => db.prepare("SELECT * FROM edges WHERE from_id=? AND edge_class='declared'").all(id);
const inE = (db, id) => db.prepare("SELECT * FROM edges WHERE to_id=? AND edge_class='declared'").all(id);

// Read the first non-empty paragraph of a `## <heading>` section, with its 1-based line.
export function readSection(root, path, headings, readDoc = (p) => readFileSync(join(root, p), 'utf8')) {
  const cands = (Array.isArray(headings) ? headings : [headings]).map((x) => x.toLowerCase());
  let lines;
  try { lines = readDoc(path).split('\n'); } catch { return null; }
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.*)/);
    if (m && cands.some((h) => m[1].trim().toLowerCase().startsWith(h))) {
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
    for (const t of qToks) { if (wordHit(title, t)) s += 10; if (path.includes(t)) s += 5; }
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
  const govIds = governingAdrs(root, path);
  const governing = govIds.map((id) => getNode(db, id)).filter(Boolean);
  // retrieval: decisions relevant to the path's tokens — works with NO governance config
  const govSet = new Set(govIds);
  const toks = path.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 4);
  const relevant = toks.length === 0 ? [] : db.prepare("SELECT * FROM nodes WHERE type IN ('adr','prd','plan')").all()
    .map((n) => {
      let s = 0;
      const title = (n.title || '').toLowerCase();
      const p = (n.path || '').toLowerCase();
      for (const t of toks) { if (wordHit(title, t)) s += 10; if (p.includes(t)) s += 5; }
      return { n, s };
    })
    .filter((x) => x.s > 0 && !govSet.has(x.n.id))
    .sort((a, b2) => b2.s - a.s)
    .slice(0, 4)
    .map((x) => x.n);
  const b = bundle(root, db, [sub, ...governing], { kind: 'context', path });
  b.subsystemDoc = sub;
  b.governing = governing;
  // Governing SPECs (M7): a SPEC anchors this path → surface it pre-edit too, not just at Stop (guard).
  b.governingSpecs = specGovernance(root).filter((s) => s.paths.some((sp) => path === sp || path.startsWith(sp + '/')));
  b.relevant = relevant;
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
  let paths;
  try { paths = changedFiles(root); } catch { return ''; } // robust porcelain parse (diff vs HEAD + untracked)
  const adrIds = new Set();
  const stale = new Map();
  for (const p of paths) {
    if (/^docs\//.test(p) || /\.(md|mdx)$/.test(p) || /^engine\//.test(p) || /^\.skipper\//.test(p) || /^\.claude\//.test(p)) continue;
    const gov = governingAdrs(root, p);
    if (!gov.length) continue;
    gov.forEach((id) => adrIds.add(id));
    const sub = resolveSubsystem(db, p);
    if (sub) { const f = freshnessFor(root, sub); if (f.stale) stale.set(sub.path, f.reason); }
  }
  // SPEC governance (M7): additive, path-declared, not config-filtered. Skips docs/scratch only.
  const specHits = new Map();
  const specs = specGovernance(root);
  for (const p of paths) {
    if (/^docs\//.test(p) || /^\.skipper\//.test(p) || /^\.claude\//.test(p)) continue;
    for (const s of specs) if (s.paths.some((sp) => p === sp || p.startsWith(sp + '/'))) specHits.set(s.id, s.title);
  }
  if (!adrIds.size && !specHits.size) return '';
  const L = ['🐧 skipper memory — this turn changed code governed by project decisions. Before yielding, verify the change COMPLIES (fix it, or supersede the ADR if the decision itself changed):'];
  for (const id of [...adrIds].sort()) { const n = getNode(db, id); L.push(`  • ${id.replace(':', '-')}${n ? ` ${n.title}` : ''}`); }
  for (const [id, title] of [...specHits].sort()) L.push(`  ⚓ ${id} ${title} — check the diff against its acceptance criteria (divergence: ${id}#AC-k). Then \`skipper gate freeze\`.`);
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
