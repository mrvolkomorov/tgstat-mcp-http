import { createServer } from 'http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const client = new Client(
  { name: 'tgstat-bridge', version: '1.0.0' },
  { capabilities: {} }
);

await client.connect(new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@theyahia/tgstat-mcp'],
  env: { ...process.env, TGSTAT_TOKEN: process.env.TGSTAT_TOKEN },
}));

console.log('✅ tgstat-mcp connected');

let cachedTools = null;
async function getTools() {
  if (!cachedTools) {
    const { tools } = await client.listTools();
    cachedTools = tools;
  }
  return cachedTools;
}

const httpServer = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-protocol-version');

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
    try {
      const tools = await getTools();
      const mcpServer = new Server(
        { name: 'tgstat-http', version: '1.0.0' },
        { capabilities: { tools: {} } }
      );
      mcpServer.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));
      mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
        return await client.callTool(request.params);
      });

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      res.on('close', () => transport.close());
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('MCP error:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`🌐 Running on :${PORT}`));
