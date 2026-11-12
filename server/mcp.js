// Streamable-HTTP MCP endpoints: /mcp (all sellers) and /mcp/:slug (one store).
// Stateless: a fresh server per request, so it scales horizontally and needs no session store.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { buildTools } from './tools.js';
import { db } from './db.js';

function buildServer(store, baseUrl) {
  const server = new McpServer(
    { name: store ? `kams-${store.slug}` : 'kams', version: '1.0.0' },
    {
      instructions: store
        ? `You are connected to ${store.name}${store.location ? ` (${store.location})` : ''}, an independent seller on Kams. Search the catalog, then create a PayPal checkout for the buyer. Never claim an order is paid until get_order_status says paid=true.`
        : 'Kams lets you discover and buy from small independent sellers who have no website. Search products, then create a PayPal checkout. Never claim an order is paid until get_order_status says paid=true.',
    },
  );
  for (const t of buildTools({ store, baseUrl, channel: 'mcp' })) {
    server.registerTool(t.name, { description: t.description, inputSchema: t.shape }, async (args) => {
      try {
        const result = await t.handler(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: e.message }] };
      }
    });
  }
  return server;
}

export function mountMcp(app, getBaseUrl) {
  const handler = async (req, res) => {
    const store = req.params.slug ? db.getStore(req.params.slug) : null;
    if (req.params.slug && !store) return res.status(404).json({ error: 'Unknown store' });
    if (store) db.logEvent(store.id, 'mcp', { method: req.body?.method });
    const server = buildServer(store, getBaseUrl(req));
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  };
  const notAllowed = (req, res) => res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null });
  app.post('/mcp', handler);
  app.post('/mcp/:slug', handler);
  app.get(['/mcp', '/mcp/:slug'], notAllowed);
  app.delete(['/mcp', '/mcp/:slug'], notAllowed);
}
