// Content-bound receipt (RDD — ADR-0025). A receipt attests that a review passed and
// no acceptance criterion is `fail` for a specific content state. Delivery gates
// (pre-commit/push/PR) revalidate the SAME receipt without re-running the review.
//
// The receipt is the committed source of truth (.skipper/receipts/<branch>.json) — NOT
// the memory graph (which is opt-in, ADR-0017). A bare git hook can read it offline.
//
// content_hash is DETERMINISTIC: sha256 over the sorted (path, git blob-hash) pairs of the
// files changed vs HEAD (working tree). No wall-clock ⇒ revalidation is reproducible, and a
// change to any covered file flips the hash ⇒ the receipt invalidates and review must re-freeze.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function hasHead(cwd) {
  try { git(['rev-parse', '--verify', 'HEAD'], cwd); return true; } catch { return false; }
}

// Files changed vs HEAD (tracked, staged + unstaged) plus untracked new files, so a candidate can be
// frozen BEFORE commit. Excludes `.skipper/` — the receipt must never hash itself or the derived index.
export function changedFiles(root) {
  const files = new Set();
  if (hasHead(root)) {
    const diff = git(['diff', '--name-only', 'HEAD'], root);
    if (diff) for (const f of diff.split('\n')) files.add(f);
  }
  const untracked = git(['ls-files', '--others', '--exclude-standard'], root);
  if (untracked) for (const f of untracked.split('\n')) files.add(f);
  return [...files].filter((f) => f && !f.startsWith('.skipper/')).sort();
}

// Deterministic digest over (path, blob-hash) of changed files. Deleted files hash as "0".
export function contentHash(root, files = changedFiles(root)) {
  const h = createHash('sha256');
  for (const f of files) {
    let blob = '0';
    try { blob = git(['hash-object', '--', f], root); } catch { /* deleted/unreadable → "0" */ }
    h.update(`${f}\0${blob}\n`);
  }
  return h.digest('hex');
}

function branchKey(root) {
  let b;
  try { b = git(['rev-parse', '--abbrev-ref', 'HEAD'], root); } catch { b = 'detached'; }
  return b.replace(/[^A-Za-z0-9._-]/g, '-') || 'detached';
}

function receiptPath(root, key = branchKey(root)) {
  return join(root, '.skipper', 'receipts', `${key}.json`);
}

// Emit a receipt for the current content. Caller guarantees the gate policy (review passed AND
// no criterion `fail`) before calling — this module only records the attestation, deterministically.
export function emit(root, { criteria = [], evidenceDigest = null, reviewVerdict, riskTier = 'standard' }) {
  const files = changedFiles(root);
  const receipt = {
    schema: 1,
    content_hash: contentHash(root, files),
    files,
    criteria,            // [{ id, verdict }]
    evidence_digest: evidenceDigest,
    review_verdict: reviewVerdict,
    risk_tier: riskTier,
    issued_at_commit: (() => { try { return git(['rev-parse', 'HEAD'], root); } catch { return null; } })(),
  };
  const p = receiptPath(root);
  mkdirSync(join(root, '.skipper', 'receipts'), { recursive: true });
  writeFileSync(p, JSON.stringify(receipt, null, 2) + '\n');
  return receipt;
}

export function load(root) {
  const p = receiptPath(root);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

// Revalidate at a delivery gate: recompute content_hash and compare to the stored receipt.
//   valid     → content unchanged since freeze; gate passes without re-running review.
//   stale     → content changed; receipt invalid, re-freeze required.
//   unmanaged → no receipt (review never ran / disabled). NEVER fabricate approval (ADR-0025).
export function validate(root) {
  const receipt = load(root);
  if (!receipt) return { status: 'unmanaged', receipt: null };
  const now = contentHash(root);
  if (now === receipt.content_hash) return { status: 'valid', receipt };
  return { status: 'stale', receipt, expected: receipt.content_hash, actual: now };
}
