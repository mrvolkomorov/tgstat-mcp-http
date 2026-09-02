import { createServer } from 'http';
import { spawn } from 'child_process';

const child = spawn('npx', ['-y', '@theyahia/tgstat-mcp'], {
  env: { ...process.env, TGSTAT_TOKEN: process.env.TGSTAT_TOKEN },
  stdio: ['pipe', 'pipe', 'inherit'],
});

let msgId = 0;
const pending = new Map();

child.stdout.setEncoding('utf8');
let buffer = '';

child.stdout.on('data', (chunk) => {
  buffer += chunk;
  let lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id !== undefined && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch (e) {}
  }
});

child.on('exit', (code) => {
  console.error(`tgstat-mcp exited with code ${code}`);
  process.exit(1);
});

function callStdin(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    pending.set(id, resolve);
    child.stdin.write(msg + '\n');
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error('Timeout'));
      }
    }, 30000);
  });
}

let cachedTools = null;
async function getTools() {
  if (!cachedTools) {
    const res = await callStdin('tools/list', {});
    cachedTools = res.result?.tools || [];
  }
  return cachedTools;
}

const VERSION = 'v3';
const httpServer = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', version: VERSION }));
    return;
  }

  if (req.method === 'POST' && (req.url === '/mcp' || req.url.startsWith('/mcp'))) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const msg = JSON.parse(body);
        const id = msg.id;
        const method = msg.method;
        console.log('MCP method:', method, 'id:', id);

        const ok = (result) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id, result }));
        };

        if (method === 'tools/list') {
          const tools = await getTools();
          ok({ tools });
        } else if (method === 'tools/call') {
          const r = await callStdin('tools/call', msg.params);
          ok(r.result);
        } else if (method === 'initialize') {
          ok({
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'tgstat-http', version: '1.0.0' }
          });
        } else if (method === 'notifications/initialized' || method.startsWith('notifications/')) {
          ok({});
        } else if (method === 'resources/list') {
          ok({ resources: [] });
        } else if (method === 'resources/read') {
          ok({ contents: [] });
        } else if (method === 'resources/templates/list') {
          ok({ resourceTemplates: [] });
        } else if (method === 'prompts/list') {
          ok({ prompts: [] });
        } else if (method === 'prompts/get') {
          ok({});
        } else if (method === 'completion/complete') {
          ok({ completion: { values: [], total: 0, hasMore: false } });
        } else if (method === 'logging/setLevel') {
          ok({});
        } else {
          // Catch-all: respond with empty success to avoid breaking clients
          console.log('Unknown method, returning empty result:', method);
          ok({});
        }
      } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: error.message } }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`🌐 MCP bridge ${VERSION} running on :${PORT}`));
