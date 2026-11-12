"use client";

import {
  ArrowTurnBackwardIcon,
  Camera01Icon,
  Coins01Icon,
  Invoice01Icon,
  PlugSocketIcon,
  Search01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { money, timeAgo, type Channel, type KamsEvent } from "@/lib/api";
import { channelLabel } from "./order-bits";

const meta: Record<string, { icon: typeof Search01Icon; tile: string }> = {
  search: { icon: Search01Icon, tile: "bg-sky-soft text-sky-ink" },
  view: { icon: ViewIcon, tile: "bg-lilac-soft text-lilac-deep" },
  mcp: { icon: PlugSocketIcon, tile: "bg-pill text-ink" },
  order_created: { icon: Invoice01Icon, tile: "bg-amber-soft text-amber-ink" },
  paid: { icon: Coins01Icon, tile: "bg-lime-soft text-lime-ink" },
  refunded: { icon: ArrowTurnBackwardIcon, tile: "bg-pink-soft text-pink-ink" },
  listed: { icon: Camera01Icon, tile: "bg-soft text-muted" },
};

function describe(e: KamsEvent): ReactNode {
  const d = e.detail as Record<string, string | number | undefined>;
  const via = d.channel ? <span className="text-subtle"> · {channelLabel(d.channel as Channel)}</span> : null;
  switch (e.type) {
    case "search":
      return (
        <>
          An agent searched <b className="font-medium">“{d.query}”</b>
          {d.max_price ? ` under ${money(d.max_price)}` : ""} ({d.results} match){via}
        </>
      );
    case "view":
      return (
        <>
          Agent viewed <b className="font-medium">{d.product}</b>
          {via}
        </>
      );
    case "mcp":
      return (
        <>
          MCP client called <code className="font-mono text-xs">{d.method}</code>
        </>
      );
    case "order_created":
      return (
        <>
          PayPal checkout created for <b className="font-medium">{money(d.total)}</b>
          {via}
        </>
      );
    case "paid":
      return (
        <>
          <b className="font-medium">{money(d.total)} paid</b> with PayPal{d.payer ? ` by ${d.payer}` : ""}
          {via}
        </>
      );
    case "refunded":
      return <>Refunded {money(d.total)} through PayPal</>;
    case "listed":
      return (
        <>
          Listed <b className="font-medium">{d.product}</b> at {money(d.price)}
        </>
      );
    default:
      return e.type;
  }
}

export function ActivityFeed({ events, limit = 12, filter }: { events: KamsEvent[]; limit?: number; filter?: (e: KamsEvent) => boolean }) {
  const list = (filter ? events.filter(filter) : events).filter((e) => e.type !== "mcp" || e.detail.method === "tools/call").slice(0, limit);
  if (!list.length) return <p className="text-subtle px-5 py-8 text-center text-sm">No activity yet. Share your MCP link to get agents shopping.</p>;
  return (
    <ul className="divide-hairline divide-y">
      {list.map((e) => {
        const m = meta[e.type] ?? meta.mcp!;
        return (
          <li key={e.id} className="flex items-start gap-3 px-5 py-3">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${m.tile}`}>
              <HugeiconsIcon icon={m.icon} size={16} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="min-w-0 text-sm">
              <p className="text-body leading-snug">{describe(e)}</p>
              <p className="text-faint mt-0.5 text-xs">{timeAgo(e.at)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
