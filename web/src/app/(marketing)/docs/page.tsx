import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs · Kams MCP",
  description: "Connect Claude, ChatGPT, Cursor or any MCP client to Kams stalls and buy with PayPal.",
};

const MCP = "https://www.usekams.xyz/mcp";

const tools = [
  { name: "list_stores", args: "—", does: "Lists every live Kams stall with its name, location, tagline and product count." },
  { name: "search_products", args: "query, max_price?, category?, limit?", does: "Finds products by keywords and budget. Returns titles, USD prices, tags and agent-facing descriptions." },
  { name: "get_product", args: "product_id", does: "Full details for one product, written for AI agents to read." },
  { name: "create_order", args: "items[{product_id, quantity}], note?", does: "Creates an itemized PayPal Orders v2 checkout (sandbox). Returns a checkout_url the human buyer opens to approve in PayPal. Prices always come from the catalogue." },
  { name: "get_order_status", args: "order_id", does: "Checks the order. Once the buyer has approved, Kams captures the payment and returns paid=true with the PayPal capture ID." },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-olive mt-3 overflow-x-auto rounded-2xl p-4 font-mono text-sm leading-relaxed text-white">
      <code>{children}</code>
    </pre>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-line border-t pt-10">
      <h2 className="font-display text-3xl font-bold tracking-tight">{title}</h2>
      <div className="text-body mt-4 space-y-4 leading-relaxed">{children}</div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <span className="bg-lime-soft text-lime-ink rounded-full px-3 py-1 text-sm font-medium">Developer docs</span>
      <h1 className="font-display mt-4 text-5xl font-extrabold tracking-tight">Shop Kams stalls from any AI agent</h1>
      <p className="text-body mt-4 text-lg leading-relaxed">
        Every Kams stall is a live <b>Model Context Protocol</b> server. Connect Claude, ChatGPT, Cursor or your own agent,
        and it can search small sellers&apos; goods and buy them with a real <b>PayPal Orders v2</b> checkout. The buyer
        always approves the payment in PayPal.
      </p>

      <div className="bg-surface border-line mt-8 rounded-3xl border p-6">
        <p className="text-subtle text-sm">MCP endpoint (Streamable HTTP, no auth needed to browse)</p>
        <p className="mt-1 font-mono text-lg break-all">{MCP}</p>
        <p className="text-subtle mt-3 text-sm">
          One stall only: <span className="font-mono">{MCP}/&lt;stall-slug&gt;</span>, e.g.{" "}
          <span className="font-mono">{MCP}/mama-tolu-fabrics-beads</span>
        </p>
      </div>

      <div className="mt-12 space-y-12">
        <Section id="claude-code" title="Claude Code">
          <p>Add Kams as a remote MCP server, then ask Claude to shop.</p>
          <Code>{`claude mcp add --transport http kams ${MCP}`}</Code>
          <p>Then try: <i>&quot;Find me a blue beaded necklace under $15 on Kams and buy it.&quot;</i></p>
        </Section>

        <Section id="claude-desktop" title="Claude Desktop and claude.ai">
          <p>
            Settings → Connectors → <b>Add custom connector</b>. Name it Kams and paste the endpoint URL above. Or, for
            clients that read a JSON config:
          </p>
          <Code>{`{
  "mcpServers": {
    "kams": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${MCP}"]
    }
  }
}`}</Code>
        </Section>

        <Section id="cursor" title="Cursor and other MCP clients">
          <p>Add a remote server in <span className="font-mono">.cursor/mcp.json</span> (or your client&apos;s equivalent):</p>
          <Code>{`{
  "mcpServers": {
    "kams": { "url": "${MCP}" }
  }
}`}</Code>
        </Section>

        <Section id="tools" title="Tools">
          <div className="border-line overflow-hidden rounded-2xl border">
            {tools.map((t) => (
              <div key={t.name} className="border-line border-b p-4 last:border-b-0">
                <p className="font-mono font-medium">{t.name}</p>
                <p className="text-subtle font-mono text-xs">{t.args}</p>
                <p className="mt-1 text-sm">{t.does}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="flow" title="How a purchase works">
          <ol className="list-decimal space-y-2 pl-5">
            <li>The agent calls <span className="font-mono">search_products</span> and picks an item.</li>
            <li>
              It calls <span className="font-mono">create_order</span> with product IDs and quantities only. Kams prices
              the order from the catalogue and creates a PayPal Orders v2 checkout.
            </li>
            <li>The agent gives the human the <span className="font-mono">checkout_url</span>. They log in and approve in PayPal.</li>
            <li>
              The agent calls <span className="font-mono">get_order_status</span>. Kams captures the payment and returns{" "}
              <span className="font-mono">paid: true</span>. Agents should never say an order is paid before this.
            </li>
          </ol>
          <p>
            Everything runs on the <b>PayPal sandbox</b>: no real money moves. Use a PayPal sandbox personal account to
            approve (the judges&apos; test login is in the{" "}
            <a className="underline" href="https://github.com/Pavilion-devs/kams-paypal#try-it-judges">README</a>).
          </p>
        </Section>

        <Section id="raw" title="Raw MCP request">
          <p>The endpoint speaks JSON-RPC over Streamable HTTP. List the tools with curl:</p>
          <Code>{`curl -s ${MCP} \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}</Code>
        </Section>

        <Section id="links" title="Links">
          <ul className="list-disc space-y-1 pl-5">
            <li><a className="underline" href="/shop">Try the built-in AI shopper</a></li>
            <li><a className="underline" href="/new">Open your own stall</a></li>
            <li><a className="underline" href="https://github.com/Pavilion-devs/kams-paypal">Source code (MIT)</a></li>
            <li><a className="underline" href="https://youtu.be/0yZLBGHctXA">Demo video</a></li>
          </ul>
        </Section>
      </div>
    </main>
  );
}
