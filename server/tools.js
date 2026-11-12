// Commerce tools shared by the MCP server and the built-in AI shopper.
// Every tool is defined once (zod schema + handler) and exposed to both surfaces.
import { z } from 'zod';
import { db } from './db.js';
import * as paypal from './paypal.js';

const round2 = (n) => Math.round(n * 100) / 100;

export function productView(p, baseUrl) {
  const store = db.getStoreById(p.store_id);
  return {
    product_id: p.id,
    title: p.title,
    price: { value: p.price_usd, currency: 'USD' },
    in_stock: p.in_stock !== false,
    category: p.category,
    attributes: p.attributes,
    description: p.agent_description || p.description,
    store: store ? { name: store.name, slug: store.slug, location: store.location } : undefined,
    image_url: p.image ? `${baseUrl}/uploads/${p.image}` : undefined,
    product_url: store ? `${baseUrl}/s/${store.slug}#${p.id}` : undefined,
  };
}

function score(p, terms) {
  if (!terms.length) return 1;
  const fields = [
    [p.title, 5], [(p.tags || []).join(' '), 4], [p.category, 3],
    [Object.values(p.attributes || {}).join(' '), 3], [p.agent_description, 1], [p.description, 1],
  ].map(([t, w]) => [(t || '').toLowerCase(), w]);
  let s = 0;
  for (const term of terms) {
    const stem = term.replace(/(es|s)$/, '');
    for (const [text, w] of fields) if (text.includes(stem)) s += w;
  }
  return s;
}

const STOP = new Set(['a', 'an', 'the', 'for', 'me', 'my', 'i', 'want', 'need', 'buy', 'get', 'some', 'with', 'and', 'or', 'of', 'to', 'under', 'below', 'less', 'than', 'something', 'find', 'gift', 'nice']);

export function buildTools(ctx) {
  // ctx: { store (optional scope), baseUrl, channel }
  const scopeId = ctx.store?.id;
  const where = ctx.store ? `from ${ctx.store.name}` : 'from independent sellers on Snapstall';

  const tools = [
    {
      name: 'search_products',
      description: `Search products ${where}. Returns matching in-stock items with price (USD), attributes and an agent-oriented description. Use broad keywords; call again with synonyms if nothing matches.`,
      shape: {
        query: z.string().describe('Keywords, e.g. "woven basket" or "leather sandals"'),
        max_price: z.number().optional().describe('Maximum unit price in USD'),
        category: z.string().optional().describe('Optional category filter'),
        limit: z.number().int().min(1).max(20).optional().describe('Max results (default 8)'),
      },
      handler: async ({ query, max_price, category, limit = 8 }) => {
        const terms = (query || '').toLowerCase().split(/[^a-z0-9]+/).filter((t) => t && !STOP.has(t));
        let items = db.listProducts(scopeId).filter((p) => p.in_stock !== false && db.getStoreById(p.store_id)?.live !== false);
        if (max_price != null) items = items.filter((p) => p.price_usd <= max_price);
        if (category) items = items.filter((p) => (p.category || '').toLowerCase().includes(category.toLowerCase()));
        const ranked = items.map((p) => [p, score(p, terms)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, limit);
        const touched = new Set(ranked.map(([p]) => p.store_id));
        for (const sid of touched) db.logEvent(sid, 'search', { query, max_price, channel: ctx.channel, results: ranked.filter(([p]) => p.store_id === sid).length });
        return { query, count: ranked.length, results: ranked.map(([p]) => productView(p, ctx.baseUrl)) };
      },
    },
    {
      name: 'get_product',
      description: 'Get full details for one product by product_id.',
      shape: { product_id: z.string() },
      handler: async ({ product_id }) => {
        const p = db.getProduct(product_id);
        if (!p || (scopeId && p.store_id !== scopeId)) return { error: 'Product not found' };
        db.logEvent(p.store_id, 'view', { product: p.title, channel: ctx.channel });
        return productView(p, ctx.baseUrl);
      },
    },
    {
      name: 'create_order',
      description: 'Create a PayPal checkout for one or more products from the SAME store. Returns a checkout_url the human buyer must open to approve payment with PayPal (the buyer stays in control of their money). After they approve, call get_order_status to confirm payment.',
      shape: {
        items: z.array(z.object({ product_id: z.string(), quantity: z.number().int().min(1).max(20).default(1) })).min(1),
        note: z.string().optional().describe('Optional note to the seller (size, color, delivery request)'),
      },
      handler: async ({ items, note }) => {
        const lines = [];
        for (const it of items) {
          const p = db.getProduct(it.product_id);
          if (!p || (scopeId && p.store_id !== scopeId)) return { error: `Unknown product ${it.product_id}` };
          if (p.in_stock === false) return { error: `${p.title} is out of stock` };
          lines.push({ p, quantity: it.quantity || 1 });
        }
        const storeIds = new Set(lines.map((l) => l.p.store_id));
        if (storeIds.size > 1) return { error: 'All items in one order must come from the same store. Create one order per store.' };
        const store = db.getStoreById([...storeIds][0]);
        const total = round2(lines.reduce((s, l) => s + l.p.price_usd * l.quantity, 0));
        const order = db.addOrder({
          store_id: store.id, channel: ctx.channel, note,
          items: lines.map((l) => ({ product_id: l.p.id, title: l.p.title, unit_price: l.p.price_usd, quantity: l.quantity })),
          total, currency: 'USD',
        });
        const pp = await paypal.createOrder({
          store,
          referenceId: order.id,
          items: lines.map((l) => ({ name: l.p.title, description: l.p.description, unit_amount: l.p.price_usd, quantity: l.quantity, sku: l.p.id })),
          returnUrl: `${ctx.baseUrl}/paypal/return?order=${order.id}`,
          cancelUrl: `${ctx.baseUrl}/paypal/cancel?order=${order.id}`,
        });
        db.updateOrder(order.id, { paypal_order_id: pp.id, status: 'AWAITING_APPROVAL', checkout_url: pp.approveUrl });
        db.logEvent(store.id, 'order_created', { order_id: order.id, total, channel: ctx.channel });
        return {
          order_id: order.id, paypal_order_id: pp.id, status: 'AWAITING_APPROVAL', store: store.name,
          total: { value: total, currency: 'USD' },
          items: order.items,
          checkout_url: pp.approveUrl,
          next_step: 'Give the buyer the checkout_url to approve the payment with PayPal, then call get_order_status.',
        };
      },
    },
    {
      name: 'get_order_status',
      description: 'Check payment status of an order. If the buyer has approved in PayPal, this captures the payment and confirms the order.',
      shape: { order_id: z.string() },
      handler: async ({ order_id }) => syncOrder(order_id).then(orderView),
    },
  ];

  if (!ctx.store) {
    tools.push({
      name: 'list_stores',
      description: 'List the independent sellers on Snapstall with their location and number of products.',
      shape: {},
      handler: async () => ({
        stores: db.listStores().filter((s) => s.live !== false).map((s) => ({
          name: s.name, slug: s.slug, location: s.location, tagline: s.tagline,
          products: db.listProducts(s.id).length, url: `${ctx.baseUrl}/s/${s.slug}`,
        })),
      }),
    });
  }

  return tools.map((t) => ({ ...t, schema: z.toJSONSchema(z.object(t.shape)) }));
}

export function orderView(o) {
  if (!o) return { error: 'Order not found' };
  return {
    order_id: o.id, status: o.status, total: { value: o.total, currency: o.currency },
    items: o.items, paid: o.status === 'PAID', capture_id: o.capture_id,
    checkout_url: o.status === 'AWAITING_APPROVAL' ? o.checkout_url : undefined,
  };
}

/** Reconcile a local order with PayPal; capture if approved. Safe to call repeatedly. */
const inflight = new Map();
export function syncOrder(orderId) {
  if (!inflight.has(orderId)) inflight.set(orderId, doSync(orderId).finally(() => inflight.delete(orderId)));
  return inflight.get(orderId);
}

async function doSync(orderId) {
  const o = db.getOrder(orderId);
  if (!o?.paypal_order_id || ['PAID', 'REFUNDED'].includes(o.status)) return o;
  let pp = await paypal.getOrder(o.paypal_order_id);
  if (pp.status === 'APPROVED') {
    try { pp = await paypal.captureOrder(o.paypal_order_id); }
    catch (e) { if (!/ORDER_ALREADY_CAPTURED/.test(e.message)) throw e; pp = await paypal.getOrder(o.paypal_order_id); }
  }
  if (pp.status === 'COMPLETED') {
    const s = paypal.summarizeCapture(pp);
    const updated = db.updateOrder(o.id, { status: 'PAID', paid_at: new Date().toISOString(), ...s });
    db.logEvent(o.store_id, 'paid', { order_id: o.id, total: o.total, channel: o.channel, payer: s.payer_name });
    return updated;
  }
  return o;
}
