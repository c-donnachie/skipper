// M6 gold regression gate: run the declarative gold set (eval/gold.json) against the engine
// deterministically (no LLM) and assert the verified behaviors. exit non-zero on any failure.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ask, contextFor } from './retrieve.mjs';
import { render } from './render.mjs';
import { verifyCitations } from './verify.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLD = join(HERE, '..', 'eval', 'gold.json');

export function runGold(root, db) {
  const checks = JSON.parse(readFileSync(GOLD, 'utf8'));
  const results = [];
  const add = (id, ok, detail = '') => results.push({ id, ok, detail });

  for (const c of checks) {
    try {
      if (c.kind === 'ask') {
        const b = ask(root, db, c.query);
        const got = b.anchors[0] ? b.anchors[0].id : '(none)';
        add(c.id, got === c.expect_anchor, `anchor=${got} expect=${c.expect_anchor}`);
      } else if (c.kind === 'no_outbound_declared') {
        const n = db.prepare("SELECT COUNT(*) AS c FROM edges WHERE from_id=? AND edge_class='declared'").get(c.node).c;
        add(c.id, n === 0, `${c.node} declared-outbound=${n} (expect 0)`);
      } else if (c.kind === 'edge_exists') {
        let q = 'SELECT COUNT(*) AS c FROM edges WHERE from_id=? AND to_id=?';
        const args = [c.from, c.to];
        if (c.type) { q += ' AND type=?'; args.push(c.type); }
        if (c.class) { q += ' AND edge_class=?'; args.push(c.class); }
        const n = db.prepare(q).get(...args).c;
        add(c.id, n >= 1, `${c.from}->${c.to}${c.type ? ` (${c.type})` : ''}${c.class ? ` [${c.class}]` : ''} matches=${n}`);
      } else if (c.kind === 'edges_to') {
        const rows = db.prepare("SELECT to_id FROM edges WHERE from_id=? AND edge_class='declared'").all(c.from).map((r) => r.to_id);
        const missing = c.to_includes.filter((t) => !rows.includes(t));
        add(c.id, missing.length === 0, missing.length ? `missing ${missing.join(', ')}` : 'all present');
      } else if (c.kind === 'count_zero') {
        const ph = c.edge_types.map(() => '?').join(',');
        const n = db.prepare(`SELECT COUNT(*) AS c FROM edges WHERE type IN (${ph})`).get(...c.edge_types).c;
        add(c.id, n === 0, `count=${n} (expect 0)`);
      } else if (c.kind === 'provenance_all_declared') {
        const rows = db.prepare("SELECT src_file,src_line,raw_text FROM edges WHERE edge_class='declared'").all();
        const cache = {};
        let bad = 0;
        for (const r of rows) {
          const lines = (cache[r.src_file] ||= readFileSync(join(root, r.src_file), 'utf8').split('\n'));
          if ((lines[r.src_line - 1] || '').trim() !== (r.raw_text || '').trim()) bad++;
        }
        add(c.id, bad === 0, `${rows.length - bad}/${rows.length} provenance ok`);
      } else if (c.kind === 'context_stale') {
        const b = contextFor(root, db, c.path);
        const sub = b.subsystemDoc;
        const stale = sub ? !!b.freshness[sub.id] : false;
        add(c.id, !!sub && sub.path === c.doc && stale === c.stale, `doc=${sub ? sub.path : '(none)'} stale=${stale} expect=${c.stale}`);
      } else if (c.kind === 'governing_includes') {
        const b = contextFor(root, db, c.path);
        const ids = (b.governing || []).map((n) => n.id);
        const missing = c.includes.filter((i) => !ids.includes(i));
        add(c.id, missing.length === 0, missing.length ? `missing ${missing.join(', ')}` : `govern=[${ids.join(', ')}]`);
      } else if (c.kind === 'ask_citations_valid') {
        const b = ask(root, db, c.query);
        const { citations } = render(root, b);
        const v = verifyCitations(root, citations);
        add(c.id, v.failures.length === 0, `${v.ok}/${v.checked} citations valid`);
      } else if (c.kind === 'node_field_number') {
        const n = db.prepare('SELECT * FROM nodes WHERE id=?').get(c.node);
        const v = n ? n[c.field] : null;
        add(c.id, typeof v === 'number', `${c.node}.${c.field}=${v}`);
      } else if (c.kind === 'node_type_min') {
        const n = db.prepare('SELECT COUNT(*) AS c FROM nodes WHERE type=?').get(c.type).c;
        add(c.id, n >= c.min, `${c.type} nodes=${n} (min ${c.min})`);
      } else if (c.kind === 'edge_type_exists') {
        let q = 'SELECT COUNT(*) AS c FROM edges WHERE type=?';
        const args = [c.type];
        if (c.to) { q += ' AND to_id=?'; args.push(c.to); }
        const n = db.prepare(q).get(...args).c;
        add(c.id, n >= 1, `${c.type}${c.to ? `→${c.to}` : ''} count=${n}`);
      } else if (c.kind === 'mismatch_exists') {
        const n = db.prepare('SELECT COUNT(*) AS c FROM mismatches WHERE node_a=? OR node_b=?').get(c.node, c.node).c;
        add(c.id, n >= 1, `mismatches involving ${c.node}=${n}`);
      } else {
        add(c.id, false, `unknown kind: ${c.kind}`);
      }
    } catch (e) {
      add(c.id, false, `error: ${(e && e.message) || e}`);
    }
  }

  const failed = results.filter((r) => !r.ok).length;
  return { results, total: results.length, passed: results.length - failed, failed };
}
