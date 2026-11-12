"use client";

import { AiChat02Icon, Camera01Icon, Clock01Icon, PlugSocketIcon, Tag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { StatTile } from "@/components/charts/stat-tile";
import { ActivityFeed } from "@/components/kams/activity-feed";
import { PageHeader } from "@/components/kams/app-shell";
import { useDashboard } from "@/components/kams/dashboard-data";
import { channelLabel, OrderStatusChip } from "@/components/kams/order-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-field";
import { EmptyState } from "@/components/ui/empty-state";
import { money, timeAgo } from "@/lib/api";
import { routes } from "@/lib/routes";

export default function OverviewPage() {
  const { data, slug } = useDashboard();
  if (!data) return null;
  const { stats, orders, products, events, store } = data;
  const awaiting = orders.filter((o) => o.status === "AWAITING_APPROVAL");
  const outOfStock = products.filter((p) => p.in_stock === false);
  const lowConfidence = products.filter((p) => (p.confidence ?? 1) < 0.6);
  const paid = orders.filter((o) => o.status === "PAID");
  const fees = paid.reduce((s, o) => s + Number(o.paypal_fee ?? 0), 0);

  const alerts = [
    products.length === 0 && {
      key: "empty",
      icon: Camera01Icon,
      tone: "text-amber-ink",
      text: "Your stall has no products yet. Snap a few photos to go live to AI agents.",
      action: { label: "Add products", href: `${routes.start}?store=${slug}` },
    },
    awaiting.length > 0 && {
      key: "awaiting",
      icon: Clock01Icon,
      tone: "text-amber-ink",
      text: `${awaiting.length} buyer${awaiting.length === 1 ? " is" : "s are"} approving a PayPal checkout (${money(awaiting.reduce((s, o) => s + o.total, 0))}).`,
      action: { label: "See orders", href: routes.dashboardOrders(slug) },
    },
    lowConfidence.length > 0 && {
      key: "confidence",
      icon: Tag01Icon,
      tone: "text-sky-ink",
      text: `Claude wasn't sure about ${lowConfidence.length} listing${lowConfidence.length === 1 ? "" : "s"}. Check the title and price.`,
      action: { label: "Review", href: routes.dashboardProducts(slug) },
    },
    outOfStock.length > 0 && {
      key: "stock",
      icon: Tag01Icon,
      tone: "text-pink-ink",
      text: `${outOfStock.length} product${outOfStock.length === 1 ? " is" : "s are"} hidden from agents because ${outOfStock.length === 1 ? "it's" : "they're"} out of stock.`,
      action: { label: "Restock", href: routes.dashboardProducts(slug) },
    },
  ].filter(Boolean) as { key: string; icon: typeof Clock01Icon; tone: string; text: string; action: { label: string; href: string } }[];

  return (
    <>
      <PageHeader
        title="Overview"
        description={
          <>
            {store.name}
            {store.location ? ` · ${store.location}` : ""} · amounts in USD, paid through PayPal sandbox
          </>
        }
        actions={
          <Button asChild variant="secondary">
            <Link href={routes.stall(slug)} target="_blank">
              View storefront
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        {alerts.length ? (
          <Card padding="none" className="overflow-hidden">
            <h2 className="text-ink px-5 pt-4 pb-2 font-medium">Needs your attention</h2>
            <ul className="divide-hairline divide-y">
              {alerts.map((a) => (
                <li key={a.key} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-body flex items-start gap-3 text-sm">
                    <HugeiconsIcon icon={a.icon} size={18} strokeWidth={1.8} aria-hidden="true" className={`mt-px shrink-0 ${a.tone}`} />
                    {a.text}
                  </p>
                  <Button asChild size="sm" variant="secondary" className="shrink-0 self-start sm:self-auto">
                    <Link href={a.action.href}>{a.action.label}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Revenue" value={money(stats.revenue)} caption="Gross PayPal captures, before refunds." badge={<Badge tone="lilac">Sandbox</Badge>} />
          <StatTile label="You keep" value={money(stats.net)} caption={`After ${money(fees)} in PayPal fees.`} />
          <StatTile label="Paid orders" value={String(stats.paid_orders)} caption={`${stats.agent_orders} bought by AI agents.`} />
          <StatTile label="AI agent visits" value={String(stats.agent_visits)} caption="Searches, views and MCP tool calls." />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card padding="none" className="overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-2">
              <h2 className="font-display text-h4 text-ink font-medium">Recent orders</h2>
              <Link href={routes.dashboardOrders(slug)} className="text-ink text-sm underline-offset-2 hover:underline">
                See all orders
              </Link>
            </header>
            {orders.length === 0 ? (
              <EmptyState variant="compact" icon={AiChat02Icon} title="No orders yet" body="Try the AI shopper on your own stall to see an order land here." />
            ) : (
              <ul className="divide-hairline divide-y">
                {orders.slice(0, 7).map((o) => (
                  <li key={o.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_6rem_11rem]">
                    <div className="min-w-0">
                      <p className="text-ink truncate text-sm font-medium">{o.items.map((i) => (i.quantity > 1 ? `${i.title} ×${i.quantity}` : i.title)).join(", ")}</p>
                      <p className="text-subtle text-xs">
                        {timeAgo(o.created_at)} · {channelLabel(o.channel)}
                        {o.payer_name ? ` · ${o.payer_name}` : ""}
                      </p>
                    </div>
                    <span className="text-ink text-right font-mono text-sm tabular-nums">{money(o.total)}</span>
                    <span className="col-span-2 sm:col-span-1 sm:justify-self-end">
                      <OrderStatusChip status={o.status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="flex flex-col gap-4">
            <Card padding="none" className="overflow-hidden">
              <header className="flex items-center justify-between px-5 pt-5 pb-2">
                <h2 className="font-display text-h4 font-medium">Live agent activity</h2>
                <Badge tone="lime" dot>
                  Live
                </Badge>
              </header>
              <ActivityFeed events={events} limit={7} />
            </Card>
            <Card>
              <p className="flex items-center gap-2 font-medium">
                <HugeiconsIcon icon={PlugSocketIcon} size={18} aria-hidden="true" />
                Your agent endpoint
              </p>
              <p className="text-subtle mt-1 mb-3 text-sm">Paste this into Claude, ChatGPT or any MCP client.</p>
              <CopyField value={store.mcp_url} label="MCP endpoint" copiedMessage="MCP link copied" />
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
