// Minimal PayPal REST client (sandbox by default): Orders v2 + Payments v2 refunds.
const BASE = process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

let cached = { token: null, exp: 0 };

async function token() {
  if (cached.token && Date.now() < cached.exp - 60_000) return cached.token;
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw new Error(`PayPal auth failed: ${r.status}`);
  const j = await r.json();
  cached = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return cached.token;
}

async function call(method, path, body, extraHeaders = {}) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await token()}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  const json = text ? JSON.parse(text) : {};
  if (!r.ok) {
    const detail = json.details?.map((d) => `${d.issue}: ${d.description}`).join('; ') || json.message || text;
    const err = new Error(`PayPal ${method} ${path} → ${r.status} ${detail}`);
    err.status = r.status; err.paypal = json;
    throw err;
  }
  return json;
}

const money = (v) => Number(v).toFixed(2);

/**
 * Create a CAPTURE-intent order with itemized line items.
 * items: [{ name, description, unit_amount, quantity, sku }]
 */
export async function createOrder({ store, items, currency = 'USD', returnUrl, cancelUrl, referenceId }) {
  const total = items.reduce((s, i) => s + Number(i.unit_amount) * i.quantity, 0);
  const purchaseUnit = {
    reference_id: referenceId,
    description: `Order from ${store.name} via Snapstall`.slice(0, 127),
    custom_id: referenceId,
    soft_descriptor: 'SNAPSTALL',
    amount: {
      currency_code: currency,
      value: money(total),
      breakdown: { item_total: { currency_code: currency, value: money(total) } },
    },
    items: items.map((i) => ({
      name: i.name.slice(0, 127),
      description: (i.description || '').slice(0, 127),
      sku: i.sku,
      quantity: String(i.quantity),
      unit_amount: { currency_code: currency, value: money(i.unit_amount) },
      category: 'PHYSICAL_GOODS',
    })),
  };
  if (store.paypal_email) purchaseUnit.payee = { email_address: store.paypal_email };

  const order = await call('POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [purchaseUnit],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: store.name.slice(0, 127),
          user_action: 'PAY_NOW',
          shipping_preference: 'GET_FROM_FILE',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      },
    },
  }, { 'PayPal-Request-Id': referenceId });
  const approve = order.links.find((l) => l.rel === 'payer-action' || l.rel === 'approve');
  return { id: order.id, status: order.status, approveUrl: approve?.href, raw: order };
}

export const getOrder = (orderId) => call('GET', `/v2/checkout/orders/${orderId}`);

export const captureOrder = (orderId) =>
  call('POST', `/v2/checkout/orders/${orderId}/capture`, undefined, { 'PayPal-Request-Id': `cap-${orderId}` });

export const refundCapture = (captureId, note) =>
  call('POST', `/v2/payments/captures/${captureId}/refund`, { note_to_payer: note?.slice(0, 255) || 'Refund from seller' },
    { 'PayPal-Request-Id': `ref-${captureId}` });

/** Pull a compact summary from a captured order payload. */
export function summarizeCapture(order) {
  const cap = order.purchase_units?.[0]?.payments?.captures?.[0];
  const ship = order.purchase_units?.[0]?.shipping;
  return {
    paypal_status: order.status,
    capture_id: cap?.id,
    capture_status: cap?.status,
    payer_name: [order.payer?.name?.given_name, order.payer?.name?.surname].filter(Boolean).join(' ') || undefined,
    payer_email: order.payer?.email_address,
    ship_to: ship?.address ? [ship.name?.full_name, ship.address.address_line_1, ship.address.admin_area_2, ship.address.country_code].filter(Boolean).join(', ') : undefined,
    net_amount: cap?.seller_receivable_breakdown?.net_amount?.value,
    paypal_fee: cap?.seller_receivable_breakdown?.paypal_fee?.value,
  };
}
