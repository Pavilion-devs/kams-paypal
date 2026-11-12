"use client";

import {
  AiChat02Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  Invoice01Icon,
  PlugSocketIcon,
  Search01Icon,
  SentIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-field";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
import { StatusChip } from "@/components/ui/status-chip";
import { api, money, type AgentProduct, type ChatReply, type OrderView, type Store, type TraceStep } from "@/lib/api";
import { toast } from "@/lib/toast";
import { PayPalButton } from "./paypal-button";

type Checkout = NonNullable<ChatReply["checkout"]>;
type Msg =
  | { kind: "user"; text: string }
  | { kind: "bot"; text: string }
  | { kind: "trace"; steps: TraceStep[] }
  | { kind: "products"; items: AgentProduct[] }
  | { kind: "checkout"; checkout: Checkout; image?: string | undefined };

const toolIcon: Record<string, typeof Search01Icon> = {
  search_products: Search01Icon,
  get_product: ViewIcon,
  create_order: Invoice01Icon,
  get_order_status: CheckmarkBadge01Icon,
  list_stores: AiChat02Icon,
};

function md(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") ? <b key={i} className="font-medium">{part.slice(2, -2)}</b> : part));
}

function CheckoutCard({ c, image, chatId, onPaid }: { c: Checkout; image?: string | undefined; chatId: string | null; onPaid: (o: OrderView) => void }) {
  const [state, setState] = useState<"idle" | "waiting" | "paid" | "cancelled">("idle");
  const [capture, setCapture] = useState<string | undefined>();
  const polling = useRef(false);

  async function poll() {
    if (polling.current) return;
    polling.current = true;
    setState("waiting");
    for (let i = 0; i < 180; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const o = await api<OrderView>(`/api/orders/${c.order_id}${chatId ? `?chat=${chatId}` : ""}`);
        if (o.paid) {
          setState("paid");
          setCapture(o.capture_id);
          onPaid(o);
          return;
        }
        if (o.status === "CANCELLED") {
          setState("cancelled");
          return;
        }
      } catch {
        /* keep polling */
      }
    }
  }

  return (
    <div className={`w-full max-w-[420px] self-start rounded-2xl border p-4 ${state === "paid" ? "border-lime-deep bg-lime-soft" : "border-line bg-surface"}`}>
      <div className="flex items-start gap-3">
        {image ? <span className="bg-soft size-14 shrink-0 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} /> : null}
        <div className="min-w-0 flex-1">
          <p className="text-subtle text-xs">PayPal checkout · {c.store}</p>
          {c.items.map((i) => (
            <p key={i.product_id} className="truncate text-sm font-medium">
              {i.title} × {i.quantity}
            </p>
          ))}
          <p className="mt-1 font-mono text-xl">{money(c.total.value)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {state === "paid" ? (
          <StatusChip tone="lime" icon={CheckmarkCircle02Icon} label="Paid with PayPal" />
        ) : (
          <PayPalButton
            label="Approve with"
            onClick={() => {
              const w = window.open(c.url, "paypal", "width=480,height=720");
              if (!w) window.location.href = c.url;
              void poll();
            }}
          />
        )}
        <span className="text-subtle text-xs">
          {state === "idle" && "Waiting for your approval"}
          {state === "waiting" && "Waiting for PayPal…"}
          {state === "cancelled" && "Checkout cancelled"}
          {state === "paid" && capture ? <span className="font-mono">capture {capture}</span> : null}
        </span>
      </div>
    </div>
  );
}

export function ShopperChat({ slug }: { slug?: string }) {
  const [store, setStore] = useState<Store | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [calls, setCalls] = useState<TraceStep[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    if (slug) api<{ store: Store }>(`/api/stores/${slug}`).then((r) => setStore(r.store)).catch(() => {});
    const onMsg = (e: MessageEvent) => {
      if ((e.data as { type?: string })?.type === "kams-paid") toast("PayPal approved, confirming…", "info");
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [slug]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const greeting = slug
    ? `Hi! I can shop ${store?.name ?? "this stall"} for you. Tell me what you need and your budget, and I'll find it and set up PayPal checkout.`
    : "Hi! I shop small independent sellers who don't have a website. Tell me what you're after and your budget.";
  const suggestions = slug
    ? ["What do you have under $30?", "Find me a gift for my mum", "Buy your best item"]
    : ["Find me a handwoven basket under $40 and buy it", "Which stalls can you shop?", "A unique gift under $25"];

  async function send(text: string) {
    text = text.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput("");
    setMsgs((m) => [...m, { kind: "user", text }]);
    try {
      const r = await api<ChatReply>("/api/shop/chat", { method: "POST", json: { message: text, chat_id: chatId, store_slug: slug } });
      setChatId(r.chat_id);
      const next: Msg[] = [];
      if (r.trace.length) {
        next.push({ kind: "trace", steps: r.trace });
        setCalls((c) => [...r.trace.slice().reverse(), ...c]);
      }
      if (r.reply) next.push({ kind: "bot", text: r.reply });
      const inCheckout = r.checkout ? r.checkout.items.map((i) => i.product_id) : null;
      const prods = inCheckout ? r.products.filter((p) => inCheckout.includes(p.product_id)) : r.products;
      if (!r.checkout && prods.length && r.trace.some((t) => t.tool === "search_products")) next.push({ kind: "products", items: prods.slice(0, 6) });
      if (r.checkout) next.push({ kind: "checkout", checkout: r.checkout, image: prods[0]?.image_url });
      setMsgs((m) => [...m, ...next]);
    } catch (e) {
      setMsgs((m) => [...m, { kind: "bot", text: `Something went wrong: ${(e as Error).message}` }]);
    }
    setBusy(false);
  }

  function onPaid(o: OrderView) {
    setCalls((c) => [{ tool: "get_order_status", input: { order_id: o.order_id }, ok: true, summary: "Paid ✓ captured" }, ...c]);
    setMsgs((m) => [
      ...m,
      { kind: "bot", text: `Payment confirmed: ${money(o.total.value)} captured by PayPal. The seller has your order and will ship it to your PayPal address. Anything else?` },
    ]);
  }

  const mcpUrl = `${origin}/mcp${slug ? `/${slug}` : ""}`;

  return (
    <div className="grid gap-4 pt-2 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card padding="none" className="flex h-[calc(100dvh-140px)] min-h-[560px] flex-col overflow-hidden">
        <header className="border-hairline flex items-center gap-3 border-b px-5 py-4">
          <span className="bg-lime-soft text-olive flex size-10 items-center justify-center rounded-full">
            <HugeiconsIcon icon={AiChat02Icon} size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{slug ? `Shopping ${store?.name ?? "…"}` : "Kams AI shopper"}</p>
            <p className="text-subtle truncate text-sm">The agent finds it and sets up checkout. You approve the payment in PayPal.</p>
          </div>
          <Badge tone="lilac" className="hidden sm:inline-flex">
            Claude Sonnet 4.6 · Bedrock
          </Badge>
        </header>
        <div ref={scroller} data-lenis-prevent className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
          <p className="bg-soft max-w-[82%] self-start rounded-2xl rounded-bl-md px-4 py-2.5 text-sm">{greeting}</p>
          {msgs.map((m, i) => {
            if (m.kind === "user")
              return (
                <p key={i} className="bg-ink text-page max-w-[82%] self-end rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap">
                  {m.text}
                </p>
              );
            if (m.kind === "bot")
              return (
                <p key={i} className="bg-soft max-w-[82%] self-start rounded-2xl rounded-bl-md px-4 py-2.5 text-sm whitespace-pre-wrap">
                  {md(m.text)}
                </p>
              );
            if (m.kind === "trace")
              return (
                <div key={i} className="flex flex-wrap gap-1.5 self-start">
                  {m.steps.map((s, j) => (
                    <span key={j} className={`inline-flex h-6 items-center gap-1 rounded-full px-2 font-mono text-xs ${s.ok ? "bg-pill text-muted" : "bg-pink-soft text-pink-ink"}`}>
                      <HugeiconsIcon icon={toolIcon[s.tool] ?? Search01Icon} size={12} aria-hidden="true" />
                      {s.tool} · {s.summary}
                    </span>
                  ))}
                </div>
              );
            if (m.kind === "products")
              return (
                <div key={i} className="grid grid-cols-2 gap-2 self-stretch sm:grid-cols-3">
                  {m.items.map((p) => (
                    <a key={p.product_id} href={p.product_url} target="_blank" rel="noreferrer" className="bg-surface border-hairline hover:border-ink overflow-hidden rounded-xl border transition-colors">
                      <span className="bg-soft block aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: p.image_url ? `url(${p.image_url})` : undefined }} />
                      <span className="block px-3 pt-2 text-sm leading-tight font-medium">{p.title}</span>
                      <span className="text-subtle block px-3 pb-3 text-xs">
                        {money(p.price.value)} · {p.store?.name}
                      </span>
                    </a>
                  ))}
                </div>
              );
            return <CheckoutCard key={i} c={m.checkout} image={m.image} chatId={chatId} onPaid={onPaid} />;
          })}
          {busy ? (
            <p className="text-subtle flex items-center gap-2 self-start text-sm">
              <Spinner /> Agent is working…
            </p>
          ) : null}
        </div>
        {msgs.length === 0 ? (
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => void send(s)} className="bg-pill border-pill-edge hover:border-ink h-9 rounded-3xl border px-4 text-sm transition-colors duration-[423ms]">
                {s}
              </button>
            ))}
          </div>
        ) : null}
        <form
          className="border-hairline flex items-center gap-2 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What are you looking for?"
            aria-label="Message"
            className="bg-pill placeholder:text-faint h-11 flex-1 rounded-3xl px-5 text-base outline-none focus-visible:outline-2 focus-visible:outline-ink"
          />
          <IconButton icon={SentIcon} label="Send" variant="ink" type="submit" disabled={busy} />
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        <Card padding="none" className="overflow-hidden">
          <header className="px-5 pt-5 pb-2">
            <p className="font-display text-h4 font-medium">What the agent did</p>
            <p className="text-subtle mt-1 text-sm">The same MCP tools any AI assistant gets. Orders are real PayPal Orders v2 objects in the sandbox.</p>
          </header>
          {calls.length === 0 ? (
            <p className="text-faint px-5 pb-5 text-sm">No tool calls yet.</p>
          ) : (
            <ul data-lenis-prevent className="divide-hairline max-h-[340px] divide-y overflow-y-auto">
              {calls.map((c, i) => (
                <li key={i} className="flex gap-3 px-5 py-3">
                  <span className="bg-pill flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <HugeiconsIcon icon={toolIcon[c.tool] ?? Search01Icon} size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-mono font-medium">{c.tool}</p>
                    <p className="text-subtle truncate font-mono text-xs">{JSON.stringify(c.input)}</p>
                    <p className="text-body">{c.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <p className="flex items-center gap-2 font-medium">
            <HugeiconsIcon icon={PlugSocketIcon} size={18} aria-hidden="true" />
            Bring your own agent
          </p>
          <p className="text-subtle mt-1 mb-3 text-sm">Add this MCP server to Claude, ChatGPT or Cursor and it can shop here too.</p>
          {origin ? <CopyField value={mcpUrl} label="MCP endpoint" copiedMessage="MCP link copied" /> : null}
        </Card>
        <p className="text-subtle px-1 text-xs">Sandbox only: approve with a PayPal sandbox personal account. No real money moves.</p>
      </div>
    </div>
  );
}
