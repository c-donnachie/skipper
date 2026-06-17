// Curated count-mismatch detector (#7). For now the 'subagent' concept — specialist /
// technical / subagent all normalize to it — which is the validated ADR-0004 "7 specialists"
// vs agents.md "9 subagents" case. Kept narrow (one concept) to avoid false positives; more
// concepts (stack, layer, …) can be added later.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const NOUN = /(\d{1,3})\s+((?:[a-z]+\s+){0,2}(?:subagents?|specialists?|technicals?))\b/i;

export function detectMismatches(root, docNodes) {
  const items = [];
  for (const n of docNodes) {
    if (!n.path) continue;
    let lines;
    try { lines = readFileSync(join(root, n.path), 'utf8').split('\n'); } catch { continue; }
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(NOUN);
      if (m) items.push({ count: parseInt(m[1], 10), node: n.id, file: n.path, line: i + 1, claim: `${m[1]} ${m[2].trim()}` });
    }
  }
  const counts = [...new Set(items.map((x) => x.count))];
  if (counts.length < 2) return [];
  const minC = Math.min(...counts);
  const maxC = Math.max(...counts);
  const a = items.find((x) => x.count === minC);
  const b = items.find((x) => x.count === maxC && x.node !== a.node) || items.find((x) => x.count === maxC);
  if (!a || !b || (a.node === b.node && a.line === b.line)) return [];
  return [{
    node_a: a.node, src_a: a.file, line_a: a.line, claim_a: a.claim,
    node_b: b.node, src_b: b.file, line_b: b.line, claim_b: b.claim,
    kind: 'count',
    note: "subagent count differs — likely 'specialists/technicals' (a subset) vs total 'subagents' (incl. skipper + kowalski). Reconcile or clarify scope.",
  }];
}
