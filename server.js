import express from 'express';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const app = express();
app.use(express.json());

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

app.post('/mcp', async (req, res) => {
  try {
    const tools = await getTools();
    const server = new Server(
      { name: 'tgstat-http', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await client.callTool(request.params);
    });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('MCP error:', error);
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🌐 Running on :${PORT}`));
