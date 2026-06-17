// Minimal, zero-dependency MCP stdio server for skipper-memory.
// stdio transport = newline-delimited JSON-RPC 2.0. stdout is the protocol channel
// (only JSON-RPC goes there); any diagnostics must go to stderr.
//
// Exposes two tools over the M3 retrieval+render core:
//   - ask(question)        -> cited, graph-expanded evidence answer
//   - context_for(path)    -> governing decisions + invariants/risks + freshness, BEFORE an edit
// Synthesis stays on the caller's Claude (ADR-0014): the server returns evidence, not prose.
import { createInterface } from 'node:readline';
import { existsSync } from 'node:fs';
import { openDb } from './db.mjs';
import { build, indexPath } from './build.mjs';
import { repoRoot } from './repo.mjs';
import { ask, contextFor } from './retrieve.mjs';
import { render } from './render.mjs';
import { verifyCitations } from './verify.mjs';

const SERVER_INFO = { name: 'skipper-memory', version: '0.0.1' };

const TOOLS = [
  {
    name: 'ask',
    description:
      'Answer a question about THIS project from its decision records (ADRs/PRDs/plans) with cited, graph-expanded evidence. Returns the originating decision, its directed neighbourhood, and source citations — synthesis is left to you.',
    inputSchema: { type: 'object', properties: { question: { type: 'string' } }, required: ['question'] },
  },
  {
    name: 'context_for',
    description:
      'Given a code path, return the governing decisions (ADRs), their invariants/quotes, and a freshness/drift flag. CALL THIS BEFORE EDITING the path to avoid repeating settled mistakes.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
];

function runTool(name, args) {
  const root = repoRoot();
  if (!existsSync(indexPath(root))) build(); // self-sufficient: build the index on first use
  const db = openDb(indexPath(root));
  try {
    let b;
    if (name === 'ask') b = ask(root, db, String(args.question || ''));
    else if (name === 'context_for') b = contextFor(root, db, String(args.path || ''));
    else throw new Error(`unknown tool: ${name}`);
    const { text, citations } = render(root, b);
    const v = verifyCitations(root, citations);
    return `${text}\n\n— ${v.ok}/${v.checked} citations verified`;
  } finally {
    db.close();
  }
}

export function serveMcp() {
  const send = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');
  const ok = (id, result) => send({ jsonrpc: '2.0', id, result });
  const err = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });

  const rl = createInterface({ input: process.stdin });
  rl.on('line', (line) => {
    line = line.trim();
    if (!line) return;
    let msg;
    try { msg = JSON.parse(line); } catch { return; }
    const { id, method, params } = msg;

    if (method === 'initialize') {
      ok(id, {
        protocolVersion: (params && params.protocolVersion) || '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    } else if (method === 'ping') {
      ok(id, {});
    } else if (method === 'tools/list') {
      ok(id, { tools: TOOLS });
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params || {};
      try {
        ok(id, { content: [{ type: 'text', text: runTool(name, args || {}) }] });
      } catch (e) {
        err(id, -32603, String((e && e.message) || e));
      }
    } else if (method && method.startsWith('notifications/')) {
      // notifications carry no id and need no response
    } else if (id !== undefined) {
      err(id, -32601, `method not found: ${method}`);
    }
  });
  process.stderr.write('skipper-memory MCP server ready (stdio)\n');
}
