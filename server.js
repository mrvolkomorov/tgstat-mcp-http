import { createServer } from 'http';
import { spawn } from 'child_process';

// Start tgstat-mcp as stdio child process
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
    } catch (e) {
      // ignore non-JSON lines
    }
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

const tools = null;
async function getTools() {
  const res = await callStdin('tools/list', {});
  return res.result?.tools || [];
}

const httpServer = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.method === 'POST' && (req.url === '/mcp' || req.url.startsWith('/mcp'))) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const msg = JSON.parse(body);
        let result;
        
        if (msg.method === 'tools/list') {
          result = await getTools();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { tools: result } }));
        } else if (msg.method === 'tools/call') {
          const r = await callStdin('tools/call', msg.params);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: r.result }));
        } else if (msg.method === 'initialize') {
          const r = await callStdin('initialize', msg.params);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: r.result }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: 'Method not found' } }));
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
httpServer.listen(PORT, () => console.log(`🌐 MCP bridge running on :${PORT}`));
