import { Camera01Icon, CheckmarkBadge01Icon, Copy01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppFrame } from "./app-frame";
import { exampleOrders, exampleProducts } from "./example-data";

const chip = "rounded-full px-2 py-0.5 text-[10px] font-semibold";

export function SnapScreen() {
  return (
    <AppFrame
      active="snap"
      title="Snap your goods"
      actions={<span className="bg-lime-soft text-lime-deep rounded-full px-3 py-1 text-[11px] font-semibold">● Live to AI agents</span>}
    >
      <div className="border-line bg-surface flex items-center gap-3 rounded-xl border border-dashed px-5 py-4 text-[12px]">
        <HugeiconsIcon icon={Camera01Icon} size={18} aria-hidden="true" />
        <span className="font-medium">Drop photos here</span>
        <span className="text-subtle">· one product per photo, with an optional note like “₦25,000, 35 cm”</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {exampleProducts.map((p) => (
          <div key={p.title} className="bg-surface border-hairline overflow-hidden rounded-xl border">
            <div className={`${p.tone} h-[92px]`} />
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] leading-tight font-medium">{p.title}</p>
                <span className={`${chip} bg-lime-soft text-lime-deep shrink-0`}>✓ {p.seconds}s</span>
              </div>
              <p className="text-subtle mt-1 text-[10px]">{p.note}</p>
              <p className="mt-2 font-mono text-[13px]">${p.price}</p>
            </div>
          </div>
        ))}
      </div>
    </AppFrame>
  );
}

export function ShopperScreen() {
  return (
    <AppFrame active="shopper" title="AI shopper">
      <div className="flex gap-4">
        <div className="bg-surface border-hairline flex flex-1 flex-col gap-3 rounded-xl border p-4 text-[12px]">
          <p className="bg-ink text-page self-end rounded-2xl rounded-br-md px-3 py-2">Find me a handwoven basket under $40 and buy it</p>
          <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
            <span className="bg-pill rounded-full px-2 py-0.5">⚙ search_products · 1 result</span>
            <span className="bg-pill rounded-full px-2 py-0.5">⚙ create_order · PayPal 90775475FY</span>
          </div>
          <p className="bg-soft self-start rounded-2xl rounded-bl-md px-3 py-2">
            Found a handwoven raffia basket from Ada Weaves in Lagos for $16.50. Approve with PayPal below.
          </p>
          <div className="border-line self-start rounded-xl border p-3">
            <p className="text-subtle text-[10px]">PayPal checkout · Ada Weaves</p>
            <p className="font-medium">Handwoven raffia basket × 1</p>
            <p className="mt-1 font-mono text-[15px]">$16.50</p>
            <span className="mt-2 inline-flex rounded-full bg-[#ffc439] px-4 py-1.5 text-[11px] font-bold text-[#003087] italic">PayPal</span>
          </div>
        </div>
        <div className="bg-surface border-hairline w-[300px] rounded-xl border p-4 text-[11px]">
          <p className="text-[13px] font-medium">What the agent did</p>
          {[
            ["search_products", '{"query":"handwoven basket","max_price":40}'],
            ["create_order", '{"items":[{"product_id":"pr_a0db…"}]}'],
            ["get_order_status", "Paid ✓ captured"],
          ].map(([tool, detail]) => (
            <div key={tool} className="border-hairline mt-3 border-t pt-3">
              <p className="font-mono font-medium">{tool}</p>
              <p className="text-subtle mt-0.5 truncate font-mono text-[10px]">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </AppFrame>
  );
}

export function OrdersScreen() {
  return (
    <AppFrame active="orders" title="Overview">
      <div className="grid grid-cols-4 gap-3">
        {[
          ["Revenue", "$103.50"],
          ["You keep", "$98.12"],
          ["Paid by AI agents", "3 of 3"],
          ["Agent visits", "41"],
        ].map(([k, v]) => (
          <div key={k} className="bg-surface border-hairline rounded-xl border p-3">
            <p className="text-subtle text-[10px]">{k}</p>
            <p className="mt-1 font-mono text-[18px]">{v}</p>
          </div>
        ))}
      </div>
      <div className="bg-surface border-hairline mt-4 rounded-xl border text-[11px]">
        <div className="text-subtle border-line grid grid-cols-[1.4fr_.6fr_1fr_1fr] border-b px-4 py-2">
          <span>Order</span>
          <span>Total</span>
          <span>Channel</span>
          <span>Status</span>
        </div>
        {exampleOrders.map((o) => (
          <div key={o.item} className="border-hairline grid grid-cols-[1.4fr_.6fr_1fr_1fr] items-center border-b px-4 py-2.5 last:border-0">
            <span className="font-medium">{o.item}</span>
            <span className="font-mono">${o.total}</span>
            <span>{o.via}</span>
            <span>
              <span className={`${chip} ${o.tone}`}>{o.status}</span>
            </span>
          </div>
        ))}
      </div>
    </AppFrame>
  );
}

export function AgentsScreen() {
  return (
    <AppFrame active="agents" title="Connect any agent">
      <div className="bg-surface border-hairline rounded-xl border p-4 text-[12px]">
        <p className="text-subtle text-[10px]">MCP endpoint</p>
        <div className="bg-soft mt-1.5 flex items-center justify-between rounded-lg px-3 py-2 font-mono">
          https://kams.app/mcp/ada-weaves
          <HugeiconsIcon icon={Copy01Icon} size={14} aria-hidden="true" />
        </div>
        <p className="text-subtle mt-4 text-[10px]">Tools every agent gets</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            [Search01Icon, "search_products", "Find items by keyword, budget and category"],
            [Search01Icon, "get_product", "Full details, written for AI agents"],
            [CheckmarkBadge01Icon, "create_order", "Itemized PayPal Orders v2 checkout"],
            [CheckmarkBadge01Icon, "get_order_status", "Confirms PayPal capture before saying “paid”"],
          ].map(([icon, name, body]) => (
            <div key={name as string} className="border-line rounded-lg border p-3">
              <p className="flex items-center gap-1.5 font-mono font-medium">
                <HugeiconsIcon icon={icon as typeof Search01Icon} size={13} aria-hidden="true" />
                {name as string}
              </p>
              <p className="text-subtle mt-1 text-[10px]">{body as string}</p>
            </div>
          ))}
        </div>
        <p className="text-subtle mt-4 font-mono text-[10px]">$ claude mcp add --transport http kams https://kams.app/mcp</p>
      </div>
    </AppFrame>
  );
}
