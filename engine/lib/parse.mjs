// M1 parser: markdown corpus -> typed nodes + DIRECTED edges with provenance.
//
// Discipline (plan-0004 M1, refinements #1 + #4):
// - Declared outbound edges come ONLY from markdown links inside `## More information`
//   / `## Related` sections, or from frontmatter `- **Related ...**` / `- **Supersedes**`
//   bullets, or an `Originated by [PRD-NNNN]` line. Link-shape wins over section membership.
// - Body-prose mentions like `(ADR-0001)` become edge_class='prose' (excluded from the
//   directed neighborhood) — never a fabricated declared outbound edge.
// - Supersession is decoy-safe: HTML comments are stripped first, then matched only on
//   frontmatter Status / `- **Supersedes**` bullets requiring 4 literal digits.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative, resolve, basename } from 'node:path';

const DOC_DIRS = [
  ['docs/decisions', 'adr', 'ADR'],
  ['docs/prds', 'prd', 'PRD'],
  ['docs/plans', 'plan', 'PLAN'],
  ['docs/architecture', 'arch', 'ARCH'],
];

const DECLARED_SECTIONS = new Set(['more information', 'related']);

// Person canonicalization: collapse known aliases of one human to a single node.
const PERSON_ALIASES = { 'c-donnachie': 'cristian-donnachie' };
export function personId(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `PERSON:${PERSON_ALIASES[slug] || slug}`;
}

function listDocs(root) {
  const out = [];
  for (const [rel, type, prefix] of DOC_DIRS) {
    let files;
    try { files = readdirSync(join(root, rel)).sort(); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith('.md') || f === 'README.md') continue; // index files are not nodes
      out.push({ type, prefix, rel, file: f, abs: join(root, rel, f), path: `${rel}/${f}` });
    }
  }
  return out;
}

function nodeId(d) {
  if (d.type === 'arch') return `ARCH:${basename(d.file, '.md')}`;
  const m = d.file.match(/^(\d{4})-/);
  return `${d.prefix}:${m ? m[1] : basename(d.file, '.md')}`;
}

// Blank out HTML-comment characters but keep newlines, so line numbers stay accurate.
function stripComments(raw) {
  return raw.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
}

function targetId(root, doc, byPath, target) {
  const clean = target.split('#')[0];
  if (!clean.endsWith('.md')) return null;
  const abs = resolve(dirname(join(root, doc.path)), clean);
  const rel = relative(root, abs).split('\\').join('/');
  return byPath.get(rel) || null;
}

export function parseRepo(root) {
  const docs = listDocs(root);
  const byPath = new Map();
  const idSet = new Set();
  for (const d of docs) { d.id = nodeId(d); byPath.set(d.path, d.id); idSet.add(d.id); }

  const nodes = [];
  const edges = [];
  const persons = new Map();
  const push = (from_id, to_id, type, edge_class, src_file, src_line, raw_text, resolved) =>
    edges.push({ from_id, to_id, type, edge_class, src_file, src_line, raw_text: raw_text.trim(), resolved });

  for (const d of docs) {
    const raw = readFileSync(d.abs, 'utf8');
    const lines = raw.split('\n');
    const ncLines = stripComments(raw).split('\n'); // comment-safe view, same indexing

    const node = {
      id: d.id, type: d.type, title: null, path: d.path,
      number: null, status: null, version_tag: null, date: null,
      self_freshness: null, reflects_version: null, h1_line: null,
    };
    const nm = d.file.match(/^(\d{4})-/);
    if (nm) node.number = parseInt(nm[1], 10);

    // title (first H1)
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^#\s+(.*)/);
      if (m) { node.title = m[1].trim().replace(/^\d{4}\s*[—–-]\s*/, ''); node.h1_line = i + 1; break; }
    }
    // frontmatter bullets (comment-safe)
    for (const ln of ncLines.slice(0, 14)) {
      let m;
      if (node.status == null && (m = ln.match(/^\s*-\s*\*\*Status\*\*\s*:\s*(.+?)\s*$/))) {
        const vm = m[1].match(/^([A-Za-z ]+?)\s*\(([^)]+)\)\s*$/);
        if (vm) { node.status = vm[1].trim(); node.version_tag = vm[2].trim(); }
        else node.status = m[1].trim();
      }
      if (node.date == null && (m = ln.match(/^\s*-\s*\*\*(?:Date|Created)\*\*\s*:\s*(.+?)\s*$/))) node.date = m[1].trim();
    }
    // arch freshness blockquote: "> Last updated: DATE. Reflects vX.Y.Z."
    for (const ln of lines.slice(0, 8)) {
      let m;
      if (node.self_freshness == null && (m = ln.match(/Last updated:\s*([0-9-]+)/i))) node.self_freshness = m[1];
      if (node.reflects_version == null && (m = ln.match(/Reflects\s+v?(\d+(?:\.\d+)*)/i))) node.reflects_version = 'v' + m[1];
    }
    nodes.push(node);

    // --- edges ---
    let section = null; // null | 'declared' | 'other'
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNo = i + 1;
      const h = line.match(/^##\s+(.*)/);
      if (h) { section = DECLARED_SECTIONS.has(h[1].trim().toLowerCase()) ? 'declared' : 'other'; continue; }

      const isFrontRelated = /^\s*-\s*\*\*(Related|Supersedes)\b/.test(line);
      const isOriginated = /Originated by/i.test(line);

      // markdown links -> declared edges (only in declared sections / frontmatter-related / originated lines)
      const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
      let lm;
      while ((lm = linkRe.exec(line)) !== null) {
        const to = targetId(root, d, byPath, lm[1]);
        if (!to || to === d.id) continue;
        if (section === 'declared' || isFrontRelated || isOriginated) {
          let type = 'references';
          if (isOriginated) type = 'originated-from';
          else if (d.type === 'plan' && isFrontRelated) type = 'implements';
          push(d.id, to, type, 'declared', d.path, lineNo, line, 1);
        }
        // links in body prose are intentionally NOT emitted as outbound edges (refinement #1)
      }

      // body-prose mentions like (ADR-0001) -> edge_class='prose' (not a declared edge)
      if (section !== 'declared') {
        const proseRe = /\((ADR|PRD|PLAN)-(\d{4})\)/g;
        let pm;
        while ((pm = proseRe.exec(line)) !== null) {
          const to = `${pm[1]}:${pm[2]}`;
          if (to === d.id || !idSet.has(to)) continue;
          push(d.id, to, 'references', 'prose', d.path, lineNo, line, 1);
        }
      }
    }

    // --- decoy-safe supersession (comment-stripped frontmatter only) ---
    for (let i = 0; i < ncLines.length && i < 14; i++) {
      let m;
      if ((m = ncLines[i].match(/^\s*-\s*\*\*Status\*\*\s*:\s*Superseded by \[?ADR-(\d{4})\]?/))) {
        const other = `ADR:${m[1]}`;
        push(d.id, other, 'superseded-by', 'declared', d.path, i + 1, lines[i], idSet.has(other) ? 1 : 0);
        push(other, d.id, 'supersedes', 'declared', d.path, i + 1, lines[i], 1);
      }
      if ((m = ncLines[i].match(/^\s*-\s*\*\*Supersedes\*\*\s*:\s*ADR-(\d{4})/))) {
        const other = `ADR:${m[1]}`;
        push(d.id, other, 'supersedes', 'declared', d.path, i + 1, lines[i], idSet.has(other) ? 1 : 0);
        push(other, d.id, 'superseded-by', 'declared', d.path, i + 1, lines[i], 1);
      }
      // who decided: ADR `Deciders` frontmatter -> PERSON nodes + decided-by edges (derived)
      if ((m = ncLines[i].match(/^\s*-\s*\*\*Deciders?\*\*\s*:\s*(.+?)\s*$/)) && (d.type === 'adr' || d.type === 'plan')) {
        for (const raw of m[1].split(/[,·]/)) {
          const name = raw.trim().replace(/^@/, '').trim();
          if (!name) continue;
          const pid = personId(name);
          if (!persons.has(pid)) persons.set(pid, { id: pid, type: 'person', title: name, path: null, number: null, status: null, version_tag: null, date: null, self_freshness: null, reflects_version: null, h1_line: null });
          else if (name.includes(' ') && !persons.get(pid).title.includes(' ')) persons.get(pid).title = name; // prefer the full name over a handle
          push(d.id, pid, 'decided-by', 'derived', d.path, i + 1, lines[i], 1);
        }
      }
    }
  }

  for (const p of persons.values()) nodes.push(p);
  return { nodes, edges };
}
