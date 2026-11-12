// Photo → structured, agent-ready product listing using Claude vision on Bedrock.
import { converse, imageBlock } from './bedrock.js';

const PRODUCT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Short, specific product title a buyer would search for (max 70 chars).' },
    description: { type: 'string', description: 'Warm 1–2 sentence description for human shoppers.' },
    agent_description: {
      type: 'string',
      description: 'Dense, factual description for AI shopping agents: what it is, materials, construction, approximate dimensions, colors, condition, typical uses, who it suits. No marketing fluff. 3–5 sentences.',
    },
    category: { type: 'string', description: 'One broad category, e.g. Home & Living, Fashion, Accessories, Beauty, Food, Art & Crafts, Electronics.' },
    tags: { type: 'array', items: { type: 'string' }, description: '5–10 lowercase search keywords and synonyms.' },
    attributes: {
      type: 'object',
      properties: {
        color: { type: 'string' }, material: { type: 'string' }, size: { type: 'string' },
        condition: { type: 'string', enum: ['new', 'handmade', 'used - like new', 'used - good', 'vintage'] },
      },
    },
    price_usd: { type: 'number', description: 'Suggested fair retail price in USD for an international online buyer.' },
    price_rationale: { type: 'string', description: 'One sentence explaining the suggested price.' },
    confidence: { type: 'number', description: '0–1 confidence that the photo shows a sellable product you identified correctly.' },
  },
  required: ['title', 'description', 'agent_description', 'category', 'tags', 'attributes', 'price_usd', 'price_rationale', 'confidence'],
};

const SYSTEM = `You are Snapstall's cataloguer. Small, informal sellers (market stalls, Instagram and WhatsApp shops) send you a phone photo of one product.
Turn it into an accurate, honest listing that both humans and AI shopping agents can understand.
Only describe what you can see or reasonably infer. Never invent brands. If the seller gave notes (prices, sizes, materials, location), they override your guesses.
If the seller stated a price in a local currency, convert it to USD at a sensible current rate and say so in the rationale.`;

export async function extractProduct({ buffer, mime, sellerNote, storeName }) {
  const res = await converse({
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: [
        imageBlock(buffer, mime),
        { text: `Store: ${storeName}\nSeller notes: ${sellerNote || '(none)'}\n\nCatalog this product by calling record_product.` },
      ],
    }],
    tools: [{ name: 'record_product', description: 'Record the structured product listing.', schema: PRODUCT_SCHEMA }],
    toolChoice: 'record_product',
    maxTokens: 1200,
    temperature: 0.2,
  });
  const use = res.output.message.content.find((c) => c.toolUse)?.toolUse;
  if (!use) throw new Error('Model did not return a product');
  const p = use.input;
  p.price_usd = Math.max(1, Math.round(Number(p.price_usd) * 100) / 100);
  return p;
}
