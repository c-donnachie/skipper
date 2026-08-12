// Deterministic renderer (no LLM): Bundle -> WHY-first, cited, directed answer.
// Bakes in #1 (directed phrasing from stored edges), #3 ([quote]/[inferred] tags),
// #6 (WHY-first lead, compact). Citations are assembled from the Bundle, not invented.
import { readSection } from './retrieve.mjs';

const dedupe = (edges) => {
  const seen = new Set();
  return edges.filter((e) => { const k = `${e.from_id}|${e.type}|${e.to_id}`; if (seen.has(k)) return false; seen.add(k); return true; });
};
const trunc = (s, n) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s);

export function render(root, b, readDoc) {
  const cites = [];
  const cite = (path, line) => { cites.push({ path, line }); return `\`${path}:${line}\``; };
  const L = [];

  if (b.kind === 'ask') {
    L.push(`## ${b.question}`, '');
    if (!b.anchors.length) {
      L.push('_No grounded match in the decision graph (lexical anchor miss — a synonym/Spanish-phrasing case; the trigger to add vectors later)._');
      return { text: L.join('\n'), citations: cites };
    }
    const a = b.anchors[0];
    const dec = readSection(root, a.path, ['Decision', 'Decisión'], readDoc);
    L.push(`**${a.id} — ${a.title}** · ${a.status || '?'} · \`${a.path}\``);
    if (dec) L.push('', `> ${trunc(dec.text, 320)}`, `  —[quote] ${cite(a.path, dec.line)}`);
    if (b.freshness[a.id]) L.push('', `⚠ freshness: ${b.freshness[a.id].reason} —[inferred]`);
    if (b.deciders && b.deciders.length) L.push('', `Decided by: ${b.deciders.map((d) => '@' + d).join(', ')}`);

    const rel = dedupe(b.edges.filter((e) => e.from_id === a.id || e.to_id === a.id));
    if (rel.length) {
      L.push('', 'Related decisions (directed):');
      for (const e of rel) L.push(`- ${e.from_id} ${e.type} ${e.to_id}  —[quote] ${cite(e.src_file, e.src_line)}`);
    }
    if (b.mismatches && b.mismatches.length) {
      L.push('', 'Conflicts (flagged, not resolved):');
      for (const m of b.mismatches) L.push(`  ⚠ "${m.claim_a}" (${m.src_a}:${m.line_a}) vs "${m.claim_b}" (${m.src_b}:${m.line_b}) —[inferred] ${m.note}`);
    }
    if (b.anchors.length > 1) {
      L.push('', `Other matches: ${b.anchors.slice(1).map((n) => `${n.id} (${trunc(n.title || '', 40)})`).join(' · ')}`);
    }
  } else {
    L.push(`## context_for("${b.path}")`, '');
    if (b.subsystemDoc) {
      const f = b.freshness[b.subsystemDoc.id];
      L.push(`Subsystem doc: \`${b.subsystemDoc.path}\` ${f ? `⚠ ${f.reason}` : '✓ fresh'}`);
    } else {
      L.push('Subsystem doc: _none resolved_');
    }
    L.push('', 'Governing decisions:');
    if (!b.governing.length) L.push('- _(none configured — see related below)_');
    for (const n of b.governing) {
      L.push(`- **${n.id} — ${n.title}** (${n.status || '?'}) \`${n.path}\``);
      const dec = readSection(root, n.path, ['Decision', 'Decisión'], readDoc);
      if (dec) L.push(`    > ${trunc(dec.text, 200)}  —[quote] ${cite(n.path, dec.line)}`);
    }
    if (b.governingSpecs && b.governingSpecs.length) {
      L.push('', 'Anchored SPECs (verify the change against their acceptance criteria):');
      for (const s of b.governingSpecs) L.push(`- **${s.id} — ${s.title}** → \`divergence: ${s.id}#AC-k\` · then \`skipper gate freeze\``);
    }
    if (b.relevant && b.relevant.length) {
      L.push('', 'Related decisions (by relevance):');
      for (const n of b.relevant) L.push(`- ${n.id} — ${n.title} \`${n.path}\``);
    }
    if (b.recentCommits && b.recentCommits.length) {
      L.push('', 'Recent activity:');
      for (const c of b.recentCommits) L.push(`  • ${c.id.replace('COMMIT:', '')} ${c.title}${c.author ? ` — @${c.author}` : ''}`);
    }
    const subStale = b.subsystemDoc && b.freshness[b.subsystemDoc.id];
    if (subStale) L.push('', `Risk: subsystem doc may be stale — ${b.freshness[b.subsystemDoc.id].reason}. Verify before relying on it.`);
  }
  return { text: L.join('\n'), citations: cites };
}

// Compact, injectable form for the proactive hook (additionalContext). Returns '' when
// there is nothing actionable to say (no governing decisions and the subsystem doc is fresh),
// so the hook stays quiet instead of adding noise.
export function renderBrief(b) {
  if (b.kind !== 'context') return '';
  const gov = b.governing || [];
  const specs = b.governingSpecs || [];
  const rel = b.relevant || [];
  const sub = b.subsystemDoc;
  const subStale = sub ? b.freshness[sub.id] : null;
  if (!gov.length && !specs.length && !rel.length && !subStale) return '';
  const L = [`━━━ 🐧 SKIPPER · memory ━━━`, `context for \`${b.path}\`:`];
  for (const n of gov) L.push(`  • governs · ${n.id.replace(':', '-')} ${n.title} (${n.status || '?'})`);
  for (const s of specs) L.push(`  ⚓ anchored · ${s.id} ${s.title} — check the diff vs its acceptance criteria`);
  for (const n of rel) L.push(`  • related · ${n.id.replace(':', '-')} ${n.title}`);
  if (sub) L.push(`  • subsystem doc · ${sub.path}${subStale ? ` ⚠ ${subStale.reason}` : ' ✓ fresh'}`);
  L.push(`Consult these before changing behavior; run \`skipper context ${b.path}\` for detail.`);
  return L.join('\n');
}
