// git ingest: COMMIT + MODULE nodes, authored-by (commit→person) + touches (commit→top-level
// module) edges (all edge_class='derived'). Enables "what commits touched X / recent activity".
// Person ids share parse.mjs's canonicalization so they dedup with decided-by persons.
import { git } from './repo.mjs';
import { personId } from './parse.mjs';

const US = '\x1f';
const blank = (extra) => ({
  path: null, number: null, status: null, version_tag: null, date: null,
  self_freshness: null, reflects_version: null, git_last_sha: null, git_last_ts: null,
  code_commits_since: null, h1_line: null, ...extra,
});

export function ingestGit(root, limit = 300) {
  let raw;
  try {
    raw = git(['log', '--no-merges', `-n${limit}`, `--format=%H${US}%an${US}%ae${US}%aI${US}%s`, '--name-only'], root);
  } catch {
    return { nodes: [], edges: [] };
  }
  const nodes = [];
  const edges = [];
  const persons = new Map();
  const modules = new Set();
  const seenTouch = new Set();
  let cur = null;

  for (const line of raw.split('\n')) {
    if (line.includes(US)) {
      const p = line.split(US);
      const sha = (p[0] || '').slice(0, 7);
      const an = p[1] || '';
      const aI = p[3] || null;
      const subject = p.slice(4).join(US);
      const cid = `COMMIT:${sha}`;
      cur = cid;
      nodes.push({ id: cid, type: 'commit', title: subject.slice(0, 100), ...blank({ date: aI }) });
      const pid = personId(an);
      if (!persons.has(pid)) persons.set(pid, { id: pid, type: 'person', title: an, ...blank() });
      else if (an.includes(' ') && !persons.get(pid).title.includes(' ')) persons.get(pid).title = an;
      edges.push({ from_id: cid, to_id: pid, type: 'authored-by', edge_class: 'derived', src_file: 'git', src_line: null, raw_text: sha, resolved: 1 });
    } else if (line.trim() && cur) {
      const seg = line.split('/')[0];
      if (!seg || seg.startsWith('.')) continue;
      const mid = `MODULE:${seg}`;
      if (!modules.has(mid)) { modules.add(mid); nodes.push({ id: mid, type: 'module', title: seg, ...blank({ path: seg }) }); }
      const k = `${cur}|${mid}`;
      if (!seenTouch.has(k)) { seenTouch.add(k); edges.push({ from_id: cur, to_id: mid, type: 'touches', edge_class: 'derived', src_file: 'git', src_line: null, raw_text: line.trim(), resolved: 1 }); }
    }
  }
  for (const p of persons.values()) nodes.push(p);
  return { nodes, edges };
}
