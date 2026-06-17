// Ensure the derived index dir is never committed (it is disposable — like node_modules).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ENTRIES = ['.skipper/'];

export function ensureGitignore(root) {
  const p = join(root, '.gitignore');
  let txt = existsSync(p) ? readFileSync(p, 'utf8') : '';
  const present = new Set(txt.split('\n').map((l) => l.trim()));
  const missing = ENTRIES.filter((e) => !present.has(e));
  if (missing.length) {
    if (txt && !txt.endsWith('\n')) txt += '\n';
    txt += missing.join('\n') + '\n';
    writeFileSync(p, txt);
  }
  return missing;
}
