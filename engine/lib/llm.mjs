// Optional LLM synthesis: turn the deterministic, cited evidence pack into polished prose
// via the user's OWN `claude` CLI (no bundled key — ADR-0014). Returns null if claude is
// unavailable or errors, so the caller falls back to the deterministic render (the CI path).
import { spawnSync } from 'node:child_process';

const SYS = `You are Skipper Memory answering a question about THIS software project. Below is a VERIFIED, cited evidence pack retrieved from the project's decision records (ADRs/PRDs/plans). Write a clear, concise answer grounded ONLY in the evidence — do not invent facts, ADR numbers, people, or citations, and do not call any tools. Keep the key citations inline (ADR ids / file:line). If the evidence is thin, say so plainly. No preamble.`;

export function synthesize(question, evidence) {
  const prompt = `${SYS}\n\nQuestion: ${question}\n\nEvidence pack:\n${evidence}`;
  try {
    const r = spawnSync('claude', ['-p', prompt], {
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 16 * 1024 * 1024,
    });
    if (r.error || r.status !== 0) return null;
    const out = (r.stdout || '').trim();
    return out || null;
  } catch {
    return null;
  }
}
