// Ensure Skipper's machine-local artifacts are never committed. Both are rewritten by the
// engine/hooks on every run, so tracking them produces perpetual diff noise:
//   .skipper/            the derived index (disposable — like node_modules)
//   .claude/.skipper-*   hook scratch (throttle timestamps, session state, run locks)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const HEADER = '# Skipper — machine-local artifacts (derived index + hook scratch), never commit';
const ENTRIES = ['.skipper/', '.claude/.skipper-*'];

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
