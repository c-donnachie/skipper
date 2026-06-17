// Smoke-test the MCP server over real stdio JSON-RPC, without a full Claude Code client:
// spawn `skipper mcp`, run the initialize -> tools/list -> tools/call handshake, print results.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const bin = join(HERE, '..', 'bin', 'skipper.mjs');
const srv = spawn('node', [bin, 'mcp'], { stdio: ['pipe', 'pipe', 'inherit'], env: { ...process.env, NODE_NO_WARNINGS: '1' } });

const guard = setTimeout(() => { console.error('TIMEOUT'); srv.kill('SIGTERM'); process.exit(1); }, 10000);
const done = (code) => { clearTimeout(guard); srv.kill('SIGTERM'); process.exit(code); };

const requests = [
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'smoke', version: '0' } } },
  { jsonrpc: '2.0', method: 'notifications/initialized' },
  { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'context_for', arguments: { path: 'hooks/' } } },
  { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'ask', arguments: { question: 'why proactive hooks?' } } },
];

let buf = '';
srv.stdout.setEncoding('utf8');
srv.stdout.on('data', (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    const m = JSON.parse(line);
    if (m.id === 1) console.log('initialize  →', JSON.stringify(m.result.serverInfo), 'proto', m.result.protocolVersion);
    else if (m.id === 2) console.log('tools/list  →', m.result.tools.map((t) => t.name).join(', '));
    else if (m.id === 3) console.log('\n=== tools/call context_for("hooks/") ===\n' + m.result.content[0].text);
    else if (m.id === 4) { console.log('\n=== tools/call ask("why proactive hooks?") ===\n' + m.result.content[0].text); done(0); }
  }
});
srv.on('error', (e) => { console.error('spawn error', e); done(1); });

for (const r of requests) srv.stdin.write(JSON.stringify(r) + '\n');
