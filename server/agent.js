// Built-in AI shopper: Claude (Bedrock) running a tool loop over the same tools MCP exposes.
import crypto from 'node:crypto';
import { converse } from './bedrock.js';
import { buildTools } from './tools.js';

const chats = new Map(); // chat_id → { messages, storeSlug }

function system(store) {
  return `You are a friendly personal shopping agent. You buy from small independent sellers ${store ? `— right now only from "${store.name}"${store.location ? ` in ${store.location}` : ''}` : 'listed on Kams'}, using tools.
How to work:
- Understand what the buyer wants (item, budget, style, quantity). Search with several keyword variations if needed.
- Recommend at most 3 options with price and one line on why each fits. Mention the seller's name.
- When the buyer clearly says to buy (or names a choice), call create_order immediately. Do not ask for address or payment details: PayPal collects them.
- After create_order, tell them to tap the PayPal button shown below your message to approve (do not paste the checkout URL; the app shows the button). Never say an order is paid until get_order_status returns paid=true.
- Respect the budget strictly. Never invent products, prices or stock.
Keep replies short and conversational (2–5 sentences). Use plain text, no markdown headings or tables.`;
}

export async function chat({ chatId, message, store, baseUrl }) {
  const id = chatId && chats.has(chatId) ? chatId : crypto.randomUUID();
  const state = chats.get(id) || { messages: [] };
  chats.set(id, state);
  const tools = buildTools({ store, baseUrl, channel: 'ai-shopper' });
  state.messages.push({ role: 'user', content: [{ text: message }] });

  const trace = [];
  let checkout = null;
  let products = [];
  for (let step = 0; step < 8; step++) {
    const res = await converse({ system: system(store), messages: state.messages, tools, maxTokens: 1500 });
    const msg = res.output.message;
    state.messages.push(msg);
    const uses = msg.content.filter((c) => c.toolUse).map((c) => c.toolUse);
    if (res.stopReason !== 'tool_use' || !uses.length) {
      const reply = msg.content.filter((c) => c.text).map((c) => c.text).join('\n').trim();
      return { chat_id: id, reply, trace, checkout, products };
    }
    const results = [];
    for (const u of uses) {
      const tool = tools.find((t) => t.name === u.name);
      let out;
      try { out = tool ? await tool.handler(u.input || {}) : { error: `Unknown tool ${u.name}` }; }
      catch (e) { out = { error: e.message }; }
      trace.push({ tool: u.name, input: u.input, ok: !out?.error, summary: summarize(u.name, out) });
      if (u.name === 'search_products' && out.results) products = mergeProducts(products, out.results);
      if (u.name === 'create_order' && out.checkout_url) checkout = { order_id: out.order_id, url: out.checkout_url, total: out.total, store: out.store, items: out.items };
      results.push({ toolResult: { toolUseId: u.toolUseId, content: [{ json: out }], status: out?.error ? 'error' : 'success' } });
    }
    state.messages.push({ role: 'user', content: results });
  }
  return { chat_id: id, reply: 'Sorry, I got stuck. Could you rephrase that?', trace, checkout, products };
}

function mergeProducts(a, b) {
  const seen = new Set(a.map((p) => p.product_id));
  return [...a, ...b.filter((p) => !seen.has(p.product_id))].slice(0, 12);
}

function summarize(name, out) {
  if (out?.error) return out.error;
  if (name === 'search_products') return `${out.count} result(s) for “${out.query}”`;
  if (name === 'create_order') return `PayPal order ${out.paypal_order_id} · $${out.total.value}`;
  if (name === 'get_order_status') return out.paid ? 'Paid ✓' : out.status;
  if (name === 'get_product') return out.title;
  if (name === 'list_stores') return `${out.stores.length} stores`;
  return 'ok';
}

/** Tell the agent the buyer finished checkout so its next turn knows. */
export function notePaid(chatId, orderView) {
  const s = chats.get(chatId);
  if (!s) return;
  s.messages.push({ role: 'user', content: [{ text: `[system] PayPal payment confirmed for order ${orderView.order_id}: ${JSON.stringify(orderView)}` }] });
  s.messages.push({ role: 'assistant', content: [{ text: 'Noted — the payment is confirmed.' }] });
}
