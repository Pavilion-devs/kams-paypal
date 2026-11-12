// Shared helpers for all Snapstall pages.
export const $ = (s, el = document) => el.querySelector(s);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (v) => `$${Number(v).toFixed(2)}`;

export async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (opts.json !== undefined) { headers['content-type'] = 'application/json'; opts.body = JSON.stringify(opts.json); }
  const r = await fetch(path, { ...opts, headers });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j;
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

export async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); } catch { prompt('Copy this:', text); }
}

export function sellerKey(slug) {
  const fromUrl = new URLSearchParams(location.search).get('key');
  try {
    if (fromUrl) localStorage.setItem(`snapstall:key:${slug}`, fromUrl);
    return fromUrl || localStorage.getItem(`snapstall:key:${slug}`);
  } catch { return fromUrl; }
}

export function timeAgo(iso) {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export const paypalButton = (label = 'Pay with') => `<span>${label}</span><b>Pay<i>Pal</i></b>`;

export function nav(active = '') {
  return `<nav class="nav"><div class="wrap">
    <a class="brand" href="/"><span class="brand-mark">◧</span>Snapstall</a>
    <span class="spacer"></span>
    <a class="link" href="/shop" ${active === 'shop' ? 'style="color:var(--text)"' : ''}>AI shopper</a>
    <a class="btn primary sm" href="/new">Open a stall</a>
  </div></nav>`;
}
