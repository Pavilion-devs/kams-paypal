# Kams: snap your goods, AI agents buy them with PayPal

> PayPal AI Hackathon 2026 · PayPal Orders v2 + Payments v2 · Claude Sonnet 4.6 on Amazon Bedrock · Model Context Protocol

**Live:** https://www.usekams.xyz · **Demo video:** https://youtu.be/0yZLBGHctXA · **Example stall:** https://www.usekams.xyz/s/mama-tolu-fabrics-beads

Hundreds of millions of people sell on WhatsApp, Instagram and market stalls with no website. As shopping moves to AI
assistants, these sellers become invisible: an agent can't find, compare or pay for goods that only exist in a phone gallery.

**Kams turns a few phone photos into a store that AI agents can search and pay for with PayPal, in about a minute.**

1. **Snap.** The seller uploads product photos, optionally with a note like "₦18,000 per 6 yards, 100% cotton".
2. **Claude catalogs it.** Claude Sonnet 4.6 (vision, on Amazon Bedrock) writes the title, a fair USD price (converting
   local-currency notes), attributes, search tags and a factual description written for AI agents to read.
3. **Agent-ready instantly.** Every stall gets a storefront and a live **MCP endpoint**. Claude, ChatGPT, Cursor or any
   MCP client can connect and shop.
4. **Paid with PayPal.** An agent calls `create_order`, which creates an itemized **PayPal Orders v2** order. The buyer
   approves in PayPal, so a human stays in control of the money. Kams captures it, and the seller sees the order live
   with PayPal's fee and their net payout, and can refund it in one click through **Payments v2**.

## Try it (judges)

All payments use the **PayPal sandbox**: no real money moves.

1. Open the AI shopper at https://www.usekams.xyz/shop and ask, for example, *"I need a blue beaded necklace as a gift, under $15."*
2. Ask it to buy. Click the PayPal button it returns and log in with the sandbox buyer:
   - email: `sb-88lss53882238@personal.example.com`
   - password: `W!7i]j@=`
3. Approve. The chat confirms the payment once PayPal reports it captured.
4. Want the seller side? Create your own stall at https://www.usekams.xyz/new with any product photo. You'll land on your
   dashboard (orders, refunds, the agents that visited) and can buy from your own stall the same way.

Payments go to the US sandbox business account `sb-ex5yx50636695@business.example.com`, the owner of the PayPal REST app.
Each seller can set their own PayPal email in settings, and their orders are routed to it with the Orders v2 `payee` field.

### Connect your own agent over MCP

```bash
claude mcp add --transport http kams https://www.usekams.xyz/mcp
```

Any client that supports remote MCP (Streamable HTTP) can use `https://www.usekams.xyz/mcp` for every stall or
`https://www.usekams.xyz/mcp/<stall-slug>` for one stall. Tools: `list_stores`, `search_products`, `get_product`,
`create_order`, `get_order_status`.

## How AI and PayPal work together

| Step | AI | PayPal |
|---|---|---|
| Listing | Claude vision → title, price, attributes, agent-facing description (forced tool-use JSON) | — |
| Discovery | Agents call `search_products` / `get_product` over MCP | — |
| Checkout | Agent calls `create_order` | `POST /v2/checkout/orders`: CAPTURE intent, itemized, `payer-action` approval link, per-seller `payee` |
| Confirmation | Agent calls `get_order_status` and never claims "paid" before PayPal does | `GET /v2/checkout/orders/{id}` → `POST …/capture` with an idempotent `PayPal-Request-Id` |
| After the sale | Seller dashboard | `POST /v2/payments/captures/{id}/refund`; fee and net from `seller_receivable_breakdown`; webhooks are re-verified against PayPal |

The **built-in AI shopper** (`/shop`, `/s/<stall>/shop`) is Claude running a tool-use loop over exactly the same tool
definitions the MCP server exposes, so the demo follows the same path a third-party agent takes.

## Architecture

```
seller photos ──► /api/stores/:slug/photos ──► Claude vision (Bedrock Converse, tool-use JSON) ──► catalog
                                                                                                │
AI agents ──► /mcp, /mcp/:slug (MCP Streamable HTTP, stateless) ──┐                             │
built-in shopper ──► /api/shop/chat (Claude tool loop) ───────────┼──► server/tools.js ◄────────┘
storefront ──► /api/stores/:slug/checkout ────────────────────────┘        │
                                                                           ▼
                                  PayPal Orders v2 create ─► buyer approves ─► capture ─► dashboard / refund
```

| Path | What it is |
|---|---|
| `server/tools.js` | Single source of truth for commerce tools (zod schemas → MCP and Bedrock tool specs) |
| `server/paypal.js` | Orders v2, capture, refunds, OAuth token cache, idempotency keys |
| `server/bedrock.js` | Bedrock Converse with an API key |
| `server/catalog.js` | Photo → listing |
| `server/agent.js` | Shopper agent loop |
| `server/mcp.js` | MCP server |
| `web/` | Next.js 16 + Tailwind 4: landing page, onboarding, storefront, AI shopper chat, seller dashboard (AG Grid orders table) |

**Hosting:** the web app runs on Vercel (www.usekams.xyz) and proxies `/api`, `/mcp`, `/paypal` and `/uploads` to the
API, which runs in Docker on a VPS behind HTTPS (api.usekams.xyz). See `Dockerfile` and `scripts/deploy-api.sh`.

## Run locally

Requires Node 20.9+, pnpm, a [PayPal sandbox app](https://developer.paypal.com/dashboard/applications/sandbox) and an
[Amazon Bedrock API key](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html) with access to Claude Sonnet 4.6.

```bash
npm install                      # API dependencies
cd web && pnpm install && cd ..  # web app
cp .env.example .env             # fill in your keys
```

```bash
# terminal 1: API (PayPal, Bedrock, MCP) on :3000
WEB_ORIGIN=http://localhost:3040 npm run dev:api
```

```bash
# terminal 2: web app on :3040, proxying to the API
cd web && pnpm dev
```

| Variable | Purpose |
|---|---|
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | PayPal REST app (sandbox) |
| `AMAZON_BEDROCK_API_KEY` | Bedrock API key (bearer token) |
| `AWS_REGION` | Default `us-east-1` |
| `BEDROCK_MODEL_ID` | Default `us.anthropic.claude-sonnet-4-6` |
| `BASE_URL`, `WEB_ORIGIN` | Public web origin for links and PayPal return URLs |
| `API_ORIGIN` (web) | Where the Next.js app proxies API calls. Default `http://localhost:3000` |

## AI tools used

- **Claude Sonnet 4.6 on Amazon Bedrock** (Converse API): reading product photos, writing listings, suggesting prices and
  converting currency, and the shopping agent's reasoning and tool use.
- **Model Context Protocol** (`@modelcontextprotocol/sdk`): exposes each stall to external AI agents.
- **Claude Code** was used as a coding assistant while building the project.

## Credits

- The design system is adapted from [Spoke](https://usespoke.xyz), the author's earlier MIT-licensed project.
- Product photos on the example stall come from Wikimedia Commons:
  - [Ankara fabrics](https://commons.wikimedia.org/wiki/File:Ankara_fabrics.jpg) by Lyndadelz, CC BY-SA 4.0
  - [Stack of Adire](https://commons.wikimedia.org/wiki/File:Stack_of_Adire_,_a_local_Fabric_from_Abeoukuta.JPG) by Olaniyan Olushola, CC BY-SA 4.0
  - [Naturally Processed Shea Butter 2](https://commons.wikimedia.org/wiki/File:Naturally_Processed_Shea_Butter_2.jpg) by Dhee jah, CC BY-SA 4.0
  - [Necklace 2 2](https://commons.wikimedia.org/wiki/File:Necklace_2_2.jpg) and [Necklace 3](https://commons.wikimedia.org/wiki/File:Necklace_3.jpg) by Jeremyida002, CC0

## License

MIT, see [LICENSE](LICENSE).
