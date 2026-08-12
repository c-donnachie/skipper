// Ensure Skipper's machine-local artifacts are never committed (derived index + hook scratch),
// but KEEP .skipper/receipts/ committed — receipts are the delivery-gate source of truth (ADR-0025).
// Pattern: ignore .skipper/* then re-include receipts (a whole-dir `.skipper/` would swallow them).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const HEADER = '# Skipper — machine-local artifacts (derived index + hook scratch), never commit';
const ENTRIES = ['.skipper/*', '!.skipper/receipts/', '.claude/.skipper-*'];

export function ensureGitignore(root) {
  const p = join(root, '.gitignore');
  let txt = existsSync(p) ? readFileSync(p, 'utf8') : '';
  const present = new Set(txt.split('\n').map((l) => l.trim()));
  const missing = ENTRIES.filter((e) => !present.has(e));
  if (missing.length) {
    if (txt && !txt.endsWith('\n')) txt += '\n';
    txt += `${HEADER}\n${missing.join('\n')}\n`;
    writeFileSync(p, txt);
  }
  return missing;
}
