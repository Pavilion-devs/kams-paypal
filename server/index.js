import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { db } from './db.js';
import * as paypal from './paypal.js';
import { extractProduct } from './catalog.js';
import { mountMcp } from './mcp.js';
import { chat, notePaid } from './agent.js';
import { syncOrder, orderView, buildTools } from './tools.js';
import { MODEL_ID } from './bedrock.js';

const PORT = process.env.PORT || 3000;
const UPLOADS = process.env.UPLOADS_DIR || path.resolve('uploads');
fs.mkdirSync(UPLOADS, { recursive: true });
const PUBLIC = path.resolve('public');

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '2mb' }));

const baseUrl = (req) => process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get('host')}`;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const page = (file) => (req, res) => res.sendFile(path.join(PUBLIC, file));

function requireSeller(req, res) {
  const store = db.getStore(req.params.slug);
  if (!store) { res.status(404).json({ error: 'Store not found' }); return null; }
  const key = req.get('x-seller-key') || req.query.key;
  if (key !== store.admin_key) { res.status(401).json({ error: 'Seller key required' }); return null; }
  return store;
}

const publicStore = (s, req) => ({
  name: s.name, slug: s.slug, location: s.location, tagline: s.tagline, created_at: s.created_at,
  url: `${baseUrl(req)}/s/${s.slug}`, mcp_url: `${baseUrl(req)}/mcp/${s.slug}`,
});
const publicProduct = (p) => ({ ...p, image_url: p.image ? `/uploads/${p.image}` : null });

// ---------- pages ----------
app.get('/', page('index.html'));
app.get('/new', page('new.html'));
app.get('/shop', page('shop.html'));
app.get('/s/:slug', page('store.html'));
app.get('/s/:slug/shop', page('shop.html'));
app.get('/dashboard/:slug', page('dashboard.html'));
app.use('/uploads', express.static(UPLOADS, { maxAge: '7d' }));
app.use(express.static(PUBLIC));

// ---------- store + catalog ----------
app.post('/api/stores', wrap(async (req, res) => {
  const { name, location, tagline, paypal_email } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Store name is required' });
  const store = db.createStore({
    name: name.trim().slice(0, 60), location: location?.trim().slice(0, 80), tagline: tagline?.trim().slice(0, 140),
    paypal_email: paypal_email?.trim() || undefined, admin_key: crypto.randomBytes(12).toString('hex'), live: true,
  });
  res.json({ store: publicStore(store, req), admin_key: store.admin_key });
}));

app.post('/api/stores/:slug/photos', upload.single('photo'), wrap(async (req, res) => {
  const store = requireSeller(req, res); if (!store) return;
  if (!req.file || !/^image\/(jpeg|png|webp|gif)$/.test(req.file.mimetype)) return res.status(400).json({ error: 'Upload a JPEG, PNG, WebP or GIF photo' });
  const ext = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
  const filename = `${crypto.randomBytes(8).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS, filename), req.file.buffer);
  const t0 = Date.now();
  const info = await extractProduct({ buffer: req.file.buffer, mime: req.file.mimetype, sellerNote: req.body.note, storeName: store.name });
  const product = db.addProduct(store.id, { ...info, image: filename, ai_ms: Date.now() - t0 });
  db.logEvent(store.id, 'listed', { product: product.title, price: product.price_usd });
  res.json({ product: publicProduct(product) });
}));

app.get('/api/stores', (req, res) => res.json({ stores: db.listStores().filter((s) => s.live !== false).map((s) => ({ ...publicStore(s, req), products: db.listProducts(s.id).length })) }));

app.get('/api/stores/:slug', (req, res) => {
  const s = db.getStore(req.params.slug);
  if (!s) return res.status(404).json({ error: 'Store not found' });
  res.json({ store: publicStore(s, req), products: db.listProducts(s.id).map(publicProduct) });
});

app.patch('/api/stores/:slug/products/:id', wrap(async (req, res) => {
  const store = requireSeller(req, res); if (!store) return;
  const p = db.getProduct(req.params.id);
  if (!p || p.store_id !== store.id) return res.status(404).json({ error: 'Product not found' });
  const patch = {};
  for (const k of ['title', 'description', 'agent_description', 'category']) if (typeof req.body[k] === 'string') patch[k] = req.body[k].slice(0, 1000);
  if (req.body.price_usd != null) { const v = Number(req.body.price_usd); if (!(v >= 1 && v <= 10000)) return res.status(400).json({ error: 'Price must be between $1 and $10,000' }); patch.price_usd = Math.round(v * 100) / 100; }
  if (typeof req.body.in_stock === 'boolean') patch.in_stock = req.body.in_stock;
  res.json({ product: publicProduct(db.updateProduct(p.id, patch)) });
}));

app.delete('/api/stores/:slug/products/:id', (req, res) => {
  const store = requireSeller(req, res); if (!store) return;
  const p = db.getProduct(req.params.id);
  if (!p || p.store_id !== store.id) return res.status(404).json({ error: 'Product not found' });
  db.deleteProduct(p.id); res.json({ ok: true });
});

// ---------- seller dashboard ----------
app.get('/api/stores/:slug/dashboard', wrap(async (req, res) => {
  const store = requireSeller(req, res); if (!store) return;
  const orders = db.listOrders(store.id);
  // Reconcile anything still waiting on buyer approval (cheap at demo scale).
  await Promise.all(orders.filter((o) => o.status === 'AWAITING_APPROVAL' && Date.now() - Date.parse(o.created_at) < 3 * 3600e3).map((o) => syncOrder(o.id).catch(() => {})));
  const paid = orders.filter((o) => o.status === 'PAID');
  const events = db.listEvents(store.id, 60);
  res.json({
    store: { ...publicStore(store, req), paypal_email: store.paypal_email },
    products: db.listProducts(store.id).map(publicProduct),
    orders,
    events,
    stats: {
      revenue: Math.round(paid.reduce((s, o) => s + o.total, 0) * 100) / 100,
      net: Math.round(paid.reduce((s, o) => s + Number(o.net_amount || o.total), 0) * 100) / 100,
      paid_orders: paid.length,
      agent_orders: paid.filter((o) => o.channel !== 'storefront').length,
      agent_visits: db.listEvents(store.id, 2000).filter((e) => ['search', 'view', 'mcp'].includes(e.type) && e.detail?.channel !== 'storefront').length,
    },
  });
}));

app.post('/api/stores/:slug/orders/:id/refund', wrap(async (req, res) => {
  const store = requireSeller(req, res); if (!store) return;
  const o = db.getOrder(req.params.id);
  if (!o || o.store_id !== store.id) return res.status(404).json({ error: 'Order not found' });
  if (o.status !== 'PAID' || !o.capture_id) return res.status(400).json({ error: 'Only paid orders can be refunded' });
  const r = await paypal.refundCapture(o.capture_id, req.body?.reason);
  const updated = db.updateOrder(o.id, { status: 'REFUNDED', refund_id: r.id, refund_status: r.status, refunded_at: new Date().toISOString() });
  db.logEvent(store.id, 'refunded', { order_id: o.id, total: o.total });
  res.json({ order: updated });
}));

// ---------- buying ----------
// Direct "Buy with PayPal" from the human storefront uses the same tool path as agents.
app.post('/api/stores/:slug/checkout', wrap(async (req, res) => {
  const store = db.getStore(req.params.slug);
  if (!store) return res.status(404).json({ error: 'Store not found' });
  const create = buildTools({ store, baseUrl: baseUrl(req), channel: 'storefront' }).find((t) => t.name === 'create_order');
  const out = await create.handler({ items: [{ product_id: req.body.product_id, quantity: req.body.quantity || 1 }] });
  if (out.error) return res.status(400).json(out);
  res.json(out);
}));

app.get('/api/orders/:id', wrap(async (req, res) => {
  const o = await syncOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  if (o.status === 'PAID' && req.query.chat) notePaid(req.query.chat, orderView(o));
  res.json(orderView(o));
}));

app.post('/api/shop/chat', wrap(async (req, res) => {
  const { message, chat_id, store_slug } = req.body || {};
  if (!message?.trim()) return res.status(400).json({ error: 'Say something' });
  const store = store_slug ? db.getStore(store_slug) : null;
  if (store_slug && !store) return res.status(404).json({ error: 'Store not found' });
  res.json(await chat({ chatId: chat_id, message: message.slice(0, 2000), store, baseUrl: baseUrl(req) }));
}));

// ---------- PayPal redirects + webhook ----------
app.get('/paypal/return', wrap(async (req, res) => {
  const o = await syncOrder(String(req.query.order));
  const ok = o?.status === 'PAID';
  res.type('html').send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${ok ? 'Payment complete' : 'Payment pending'}</title>
<link rel="stylesheet" href="/styles.css"><body class="center-page"><div class="card done-card"><div class="done-icon">${ok ? '✓' : '…'}</div>
<h1>${ok ? 'Payment complete' : 'Payment pending'}</h1><p>${ok ? `Paid $${o.total.toFixed(2)} with PayPal. The seller has been notified.` : 'We could not confirm the payment yet.'}</p>
<p class="muted">You can close this tab and return to your shopping assistant.</p></div>
<script>try{window.opener&&window.opener.postMessage({type:'snapstall-paid',order:${JSON.stringify(o?.id || '')}},'*')}catch(e){};setTimeout(()=>{try{window.close()}catch(e){}},2500)</script></body>`);
}));

app.get('/paypal/cancel', (req, res) => {
  const o = db.getOrder(String(req.query.order));
  if (o && o.status === 'AWAITING_APPROVAL') db.updateOrder(o.id, { status: 'CANCELLED' });
  res.type('html').send(`<!doctype html><meta charset="utf-8"><title>Checkout cancelled</title><link rel="stylesheet" href="/styles.css"><body class="center-page"><div class="card done-card"><h1>Checkout cancelled</h1><p>No money moved. You can close this tab.</p></div></body>`);
});

app.post('/paypal/webhook', wrap(async (req, res) => {
  // Treat the webhook as a hint only: we re-read the order from PayPal before trusting anything.
  const r = req.body?.resource || {};
  const ppId = r.supplementary_data?.related_ids?.order_id || (req.body?.event_type?.startsWith('CHECKOUT.ORDER') ? r.id : null);
  const o = ppId && db.getOrderByPaypalId(ppId);
  if (o) await syncOrder(o.id).catch(() => {});
  res.json({ ok: true });
}));

app.get('/api/health', (req, res) => res.json({ ok: true, model: MODEL_ID, paypal: process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox' }));

mountMcp(app, baseUrl);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status && err.status < 500 ? err.status : 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`Snapstall on http://localhost:${PORT} · model ${MODEL_ID}`));
