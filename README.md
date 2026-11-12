# Kams: snap your goods, AI shoppers buy them

> PayPal AI Hackathon 2026 · PayPal Orders v2 + Payments + Claude on Amazon Bedrock + MCP

Hundreds of millions of people sell on WhatsApp, Instagram and market stalls with **no website**. As shopping
moves to AI assistants, these sellers become invisible: an agent can't find, compare or pay for goods
that only exist in a phone gallery.

**Kams turns a few phone photos into a store that AI agents can search and pay for with PayPal, in about 60 seconds.**

1. **Snap**: the seller uploads product photos, optionally with a note ("₦25,000, 35 cm, handmade raffia").
2. **Claude catalogs it**: Claude Sonnet 4.6 (vision, on Amazon Bedrock) writes the title and a fair USD
   price (converting local-currency notes), plus structured attributes, search tags and a
   factual description written for AI agents to read.
3. **Agent-ready instantly**: every stall gets a human storefront **and a live MCP endpoint**
   (`/mcp/<stall>`, plus `/mcp` across all stalls). Claude, ChatGPT, Cursor or any MCP client can connect.
4. **Paid with PayPal**: agents call `create_order`, which creates an itemized **PayPal Orders v2** order. The human
   buyer approves in PayPal (they stay in control of their money). Kams then captures it, and the seller
   sees it live on their dashboard with PayPal fees and net payout, plus one-click **refunds** through the PayPal Payments v2 API.

## Demo

- Live: `<RENDER_URL>` · Video: `<YOUTUBE_URL>`
- Sandbox buyer for judges: `<SANDBOX_BUYER_EMAIL>` / `<SANDBOX_BUYER_PASSWORD>` (PayPal sandbox personal account. No real money moves.)

## How AI and PayPal work together

| Step | AI | PayPal |
|---|---|---|
| Listing | Claude vision → title, price, attributes, agent-oriented description (forced tool-use JSON) | — |
| Discovery | Any agent searches via MCP `search_products` / `get_product` | — |
| Checkout | Agent calls `create_order` | `POST /v2/checkout/orders` (CAPTURE intent, itemized, `payer-action` approval link, optional per-seller `payee`) |
| Confirmation | Agent calls `get_order_status`, never claims "paid" before PayPal says so | `GET /v2/checkout/orders/{id}` → `POST …/capture` (idempotent `PayPal-Request-Id`) |
| After-sale | Seller dashboard | `POST /v2/payments/captures/{id}/refund`; fees and net from `seller_receivable_breakdown`; webhook endpoint re-verifies with PayPal |

The **built-in AI shopper** (`/shop`, `/s/<stall>/shop`) is Claude running a tool-use loop over exactly the
same tool definitions the MCP server exposes. What judges see in the demo is the same path a third-party agent takes.

## Connect your own agent

Claude Code:
```bash
claude mcp add --transport http kams https://<RENDER_URL>/mcp
```
Claude Desktop / any client that supports remote MCP: add `https://<RENDER_URL>/mcp` (all stalls) or
`https://<RENDER_URL>/mcp/<stall-slug>` (one stall). Then ask: *"Find me a handwoven basket under $40 and buy it."*

## Run locally

Requires Node 20+, a [PayPal sandbox app](https://developer.paypal.com/dashboard/applications/sandbox) and an
[Amazon Bedrock API key](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html) with access to Claude Sonnet 4.6.

```bash
npm install                     # API dependencies
cd web && pnpm install && cd .. # web app (Next.js 16, pnpm)
cp .env.example .env            # fill in your keys

# terminal 1: API (PayPal, Bedrock, MCP) on :3000
WEB_ORIGIN=http://localhost:3040 npm run dev:api
# terminal 2: web app on :3040 (proxies /api, /mcp, /paypal, /uploads to the API)
cd web && pnpm dev

# production (what Render runs): one public port, API on an internal port
npm run build && npm start
```

| Variable | Purpose |
|---|---|
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | PayPal REST app (sandbox) |
| `AMAZON_BEDROCK_API_KEY` | Bedrock API key (bearer token) |
| `AWS_REGION` | default `us-east-1` |
| `BEDROCK_MODEL_ID` | default `us.anthropic.claude-sonnet-4-6` |
| `BASE_URL` | public URL for PayPal return links (auto on Render) |

## Architecture

```
seller photos ──► /api/stores/:slug/photos ──► Claude vision (Bedrock Converse, tool-use JSON) ──► catalog
                                                                                                │
AI agents ──► /mcp, /mcp/:slug (MCP Streamable HTTP, stateless) ──┐                             │
built-in shopper ──► /api/shop/chat (Claude tool loop) ───────────┼──► server/tools.js ◄────────┘
human storefront ──► /api/stores/:slug/checkout ──────────────────┘        │
                                                                           ▼
                                        PayPal Orders v2 create ─► buyer approves ─► capture ─► dashboard / refund
```

- `server/tools.js`: the single source of truth for commerce tools (zod schemas → MCP + Bedrock tool specs)
- `server/paypal.js`: Orders v2, capture, refunds, OAuth token cache, idempotency keys
- `server/bedrock.js`: Bedrock Converse via API key
- `server/catalog.js`: photo → listing
- `server/agent.js`: shopper agent loop
- `server/mcp.js`: MCP server
- `web/`: Next.js 16 + Tailwind 4 app with the landing page, onboarding, storefront, AI shopper chat and seller dashboard (AG Grid orders table). The design system is adapted from [Spoke](https://usespoke.xyz), the author's earlier MIT project.
- `scripts/start.js`: production entry that runs the API internally and Next.js on `$PORT`

## AI tools used

- **Claude Sonnet 4.6 on Amazon Bedrock** (Converse API): product photo understanding and cataloguing,
  price suggestion and currency conversion, the shopping agent's reasoning and tool use.
- **Model Context Protocol** (`@modelcontextprotocol/sdk`): exposes each stall to external AI agents.
- **Claude Code** was used as a coding assistant while building the project.

## License

MIT, see [LICENSE](LICENSE).
