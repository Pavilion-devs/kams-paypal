import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = process.env.DATA_DIR || path.resolve('data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

let state = { stores: [], products: [], orders: [], events: [] };
if (fs.existsSync(DB_FILE)) state = { ...state, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(state, null, 2));
    fs.renameSync(DB_FILE + '.tmp', DB_FILE);
  }, 50);
}

export const id = (prefix) => `${prefix}_${crypto.randomBytes(5).toString('hex')}`;

export function slugify(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'store';
  let slug = base, n = 2;
  while (state.stores.some((s) => s.slug === slug)) slug = `${base}-${n++}`;
  return slug;
}

export const db = {
  // stores
  createStore(data) {
    const store = { id: id('st'), slug: slugify(data.name), created_at: new Date().toISOString(), ...data };
    state.stores.push(store); save(); return store;
  },
  getStore: (slug) => state.stores.find((s) => s.slug === slug),
  getStoreById: (sid) => state.stores.find((s) => s.id === sid),
  listStores: () => state.stores,
  updateStore(slug, patch) {
    const s = db.getStore(slug); if (!s) return null;
    Object.assign(s, patch); save(); return s;
  },

  // products
  addProduct(storeId, data) {
    const p = { id: id('pr'), store_id: storeId, created_at: new Date().toISOString(), in_stock: true, ...data };
    state.products.push(p); save(); return p;
  },
  getProduct: (pid) => state.products.find((p) => p.id === pid),
  listProducts: (storeId) => state.products.filter((p) => !storeId || p.store_id === storeId),
  updateProduct(pid, patch) {
    const p = db.getProduct(pid); if (!p) return null;
    Object.assign(p, patch); save(); return p;
  },
  deleteProduct(pid) { state.products = state.products.filter((p) => p.id !== pid); save(); },

  // orders
  addOrder(data) {
    const o = { id: id('or'), created_at: new Date().toISOString(), status: 'CREATED', ...data };
    state.orders.push(o); save(); return o;
  },
  getOrder: (oid) => state.orders.find((o) => o.id === oid),
  getOrderByPaypalId: (ppid) => state.orders.find((o) => o.paypal_order_id === ppid),
  listOrders: (storeId) => state.orders.filter((o) => o.store_id === storeId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  updateOrder(oid, patch) {
    const o = db.getOrder(oid); if (!o) return null;
    Object.assign(o, patch, { updated_at: new Date().toISOString() }); save(); return o;
  },

  // activity feed (agent visits, searches, purchases) for the seller dashboard
  logEvent(storeId, type, detail) {
    state.events.push({ id: id('ev'), store_id: storeId, type, detail, at: new Date().toISOString() });
    if (state.events.length > 2000) state.events.splice(0, state.events.length - 2000);
    save();
  },
  listEvents: (storeId, limit = 50) => state.events.filter((e) => e.store_id === storeId).slice(-limit).reverse(),
};
