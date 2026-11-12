// Typed client for the Kams Express API (proxied by Next rewrites).
export type Product = {
  id: string; store_id: string; title: string; description: string; agent_description?: string;
  category?: string; tags?: string[]; attributes?: Record<string, string>; price_usd: number;
  price_rationale?: string; confidence?: number; in_stock?: boolean; image_url: string | null; ai_ms?: number;
  created_at: string;
};
export type Store = { name: string; slug: string; location?: string; tagline?: string; url: string; mcp_url: string; created_at: string; products?: number };
export type OrderItem = { product_id: string; title: string; unit_price: number; quantity: number };
export type OrderStatus = "CREATED" | "AWAITING_APPROVAL" | "PAID" | "REFUNDED" | "CANCELLED";
export type Channel = "ai-shopper" | "mcp" | "storefront";
export type Order = {
  id: string; store_id: string; status: OrderStatus; channel: Channel; items: OrderItem[]; total: number;
  currency: string; created_at: string; paypal_order_id?: string; capture_id?: string; payer_name?: string;
  payer_email?: string; ship_to?: string; net_amount?: string; paypal_fee?: string; refund_id?: string;
  checkout_url?: string; note?: string;
};
export type KamsEvent = { id: string; type: string; detail: Record<string, unknown>; at: string };
export type Dashboard = {
  store: Store & { paypal_email?: string }; products: Product[]; orders: Order[]; events: KamsEvent[];
  stats: { revenue: number; net: number; paid_orders: number; agent_orders: number; agent_visits: number };
};
export type OrderView = { order_id: string; status: OrderStatus; total: { value: number; currency: string }; items: OrderItem[]; paid: boolean; capture_id?: string };
export type TraceStep = { tool: string; input: unknown; ok: boolean; summary: string };
export type AgentProduct = { product_id: string; title: string; price: { value: number }; image_url?: string; product_url?: string; store?: { name: string } };
export type ChatReply = {
  chat_id: string; reply: string; trace: TraceStep[]; products: AgentProduct[];
  checkout: { order_id: string; url: string; total: { value: number }; store: string; items: OrderItem[] } | null;
};

export async function api<T>(path: string, init: RequestInit & { json?: unknown; sellerKey?: string | null } = {}): Promise<T> {
  const { json, sellerKey: key, headers, body, ...rest } = init;
  const h = new Headers(headers);
  if (json !== undefined) h.set("content-type", "application/json");
  if (key) h.set("x-seller-key", key);
  const r = await fetch(path, { ...rest, headers: h, body: json !== undefined ? JSON.stringify(json) : (body ?? null) });
  const data = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
  return data as T;
}

export const money = (v: number | string | undefined) => `$${Number(v ?? 0).toFixed(2)}`;

export function timeAgo(iso: string) {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function readSellerKey(slug: string): string | null {
  if (typeof window === "undefined") return null;
  const fromUrl = new URLSearchParams(window.location.search).get("key");
  try {
    if (fromUrl) window.localStorage.setItem(`kams:key:${slug}`, fromUrl);
    return fromUrl || window.localStorage.getItem(`kams:key:${slug}`);
  } catch {
    return fromUrl;
  }
}

export function rememberKey(slug: string, key: string) {
  try {
    window.localStorage.setItem(`kams:key:${slug}`, key);
  } catch {
    /* private mode */
  }
}
