// Evidence runner (PRD-0006 M3) + honesty rule (M5). Skipper does NOT reinvent a test runner —
// it ORCHESTRATES the project's own verification commands (the specialist knows them per stack)
// and captures the result as evidence, mapped to the acceptance criterion it covers.
//
// Honesty (M5, gentle-ai's "trust by evidence, not narrative"): a criterion with no runnable
// command, or a `manual`/`human`/`memory` check without a captured artifact, is `unverified` —
// NEVER green. Only `test`/`type`/`static` produce an objective pass/fail from an exit code.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const RUNNABLE = new Set(['test', 'type', 'static']);

// Run one criterion. `criterion`: { id, method, command? }. `opts.artifact`: proof for manual/human.
export function runCriterion(root, criterion, opts = {}) {
  const { id, method, command } = criterion;
  const base = { id, method, command: command ?? null };

  if (RUNNABLE.has(method)) {
    if (!command) return { ...base, result: 'unverified', output: 'no command declared for this criterion' };
    const r = spawnSync('sh', ['-c', command], { cwd: root, encoding: 'utf8', timeout: 10 * 60_000 });
    const output = `${r.stdout ?? ''}${r.stderr ?? ''}`.slice(-4000); // tail; full log stays out of the receipt
    if (r.error) return { ...base, result: 'fail', output: String(r.error.message ?? r.error) };
    return { ...base, result: r.status === 0 ? 'pass' : 'fail', exit: r.status, output };
  }

  // Non-executable methods: verified only with a captured artifact (M5 / PRD-0006 Q2).
  if (method === 'manual' || method === 'human') {
    return opts.artifact
      ? { ...base, result: 'pass', artifact: opts.artifact }
      : { ...base, result: 'unverified', output: `${method} check needs a captured artifact` };
  }
  if (method === 'memory') {
    // Graph-backed check (e.g. "ADR added"): resolved by the memory engine when present; else honest unverified.
    return opts.memoryVerified
      ? { ...base, result: 'pass' }
      : { ...base, result: 'unverified', output: 'memory check unresolved (engine opt-in — ADR-0017)' };
  }
  return { ...base, result: 'unverified', output: `unknown method: ${method}` };
}

export function runAll(root, criteria, optsById = {}) {
  return criteria.map((c) => runCriterion(root, c, optsById[c.id] ?? {}));
}

// Deterministic digest binding evidence into the receipt (ADR-0025). Excludes raw output (noisy/large).
export function evidenceDigest(results) {
  const norm = results
    .map((r) => `${r.id}:${r.method}:${r.result}`)
    .sort()
    .join('\n');
  return createHash('sha256').update(norm).digest('hex');
}

// Overall gate verdict. `fail` always blocks; `unverified` blocks only if policy says so (Phase B).
export function gateVerdict(results, policy = { unverified: 'warn' }) {
  const failed = results.filter((r) => r.result === 'fail');
  const unverified = results.filter((r) => r.result === 'unverified');
  if (failed.length) return { status: 'blocked', reason: 'fail', failed, unverified };
  if (unverified.length && policy.unverified === 'block') return { status: 'blocked', reason: 'unverified', unverified };
  if (unverified.length) return { status: 'warn', unverified };
  return { status: 'pass' };
}
