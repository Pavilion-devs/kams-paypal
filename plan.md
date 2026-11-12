# Snapstall — any seller, buyable by AI shoppers in 60 seconds

PayPal AI Hackathon 2026 entry. Submissions close **Thu 12 Nov 2026, 12:00 PM PT (9:00 PM WAT)**.

## The pitch
Millions of informal sellers (Instagram, WhatsApp, market stalls) have no website, so AI shopping
agents can never find or buy from them. Snapstall turns a handful of product photos into a priced
catalog, a public storefront, and a live **MCP storefront** with **PayPal checkout** built in.
From that moment any AI assistant (Claude, ChatGPT, our built-in shopper) can discover and buy
their goods, and the seller watches sales arrive on a dashboard.

## What judges must see (video under 3 min)
1. Problem (15s): seller with goods, no website, invisible to AI shoppers.
2. Photo → store (45s): upload photos, Claude (Bedrock) extracts title, price, attributes,
   agent-friendly descriptions. Store goes live with an MCP endpoint.
3. Agent buys (60s): "buy me a handwoven basket under $40" → agent searches the MCP store →
   creates a PayPal Orders v2 order → buyer approves in sandbox → capture.
4. Seller dashboard (30s): order appears (captured), one-click refund through PayPal.
5. Impact (30s).

## Architecture
- **Server**: Node 20 + Express, single process. JSON file store (`data/db.json`).
- **AI**: Amazon Bedrock Converse API with bearer API key, model `us.anthropic.claude-sonnet-4-6`
  (configurable via `BEDROCK_MODEL_ID`).
  - Vision: photo → structured product (tool-use forced JSON).
  - Shopper agent: Converse tool-use loop over the same tools the MCP server exposes.
- **PayPal (sandbox)**: Orders v2 create / capture, Payments v2 refund, order lookup.
  Return URL captures the order and marks it paid. Webhook endpoint as a second path.
- **MCP**: `@modelcontextprotocol/sdk` Streamable HTTP at `/mcp/:storeSlug` with tools
  `search_products`, `get_product`, `create_order`, `get_order_status`.
  Any MCP client (Claude Desktop/Code) can connect to a store by URL.
- **UI** (static HTML + vanilla JS):
  - `/` landing + "create your store" (upload photos).
  - `/s/:slug` public storefront (human buyers, PayPal button via checkout link).
  - `/s/:slug/shop` AI shopper chat (the agent buys for you).
  - `/dashboard/:slug` seller dashboard (orders, revenue, refunds).
- **Deploy**: Render (live URL for judges).

## Build order (never cut the core: photo → store → agent purchase)
1. [x] Scaffold, env, PayPal client: create + capture one sandbox order end to end.
2. [x] Photo → catalog via Bedrock vision; store + storefront page.
3. [x] Shared tools module + MCP server per store.
4. [x] AI shopper chat (Bedrock tool loop) that returns the PayPal approve link.
5. [x] Seller dashboard + refunds.
6. [~] README, MIT license, AI-tools statement done · seed demo store with real photos pending
7. [ ] Deploy to Render, GitHub public repo, record video, submit on Devpost.

Cut list if we slip: refunds → dashboard polish → webhook. Never cut the core flow.

## Submission checklist
- [ ] Public GitHub repo, MIT license visible in About
- [ ] YouTube video < 3 min, public
- [ ] Description + AI tools statement (Claude Sonnet 4.6 on Amazon Bedrock; Claude Code for dev)
- [ ] Live URL + sandbox buyer login in README; keep sandbox alive until 15 Dec 2026
