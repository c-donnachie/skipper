// Git helpers. The engine indexes the repo it is pointed at, anchored to the
// git toplevel (not cwd) — same discipline as the plugin's hooks.
import { execFileSync } from 'node:child_process';

export function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

export function repoRoot(cwd = process.cwd()) {
  return git(['rev-parse', '--show-toplevel'], cwd);
}

export function headSha(cwd) {
  return git(['rev-parse', 'HEAD'], cwd);
}
