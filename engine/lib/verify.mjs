// Citation self-verification (precursor to the full M4 suite): every cited file:line
// must exist on disk and be in range. Quotes are pulled from the file at render time,
// so they are present by construction; this proves it and catches any drift.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function verifyCitations(root, citations, readDoc = (p) => readFileSync(join(root, p), 'utf8')) {
  const cache = new Map();
  let ok = 0;
  const failures = [];
  for (const c of citations) {
    let lines = cache.get(c.path);
    if (lines === undefined) {
      try { lines = readDoc(c.path).split('\n'); } catch { lines = null; }
      cache.set(c.path, lines);
    }
    if (lines && c.line >= 1 && c.line <= lines.length && lines[c.line - 1].trim() !== '') ok++;
    else failures.push(c);
  }
  return { checked: citations.length, ok, failures };
}
