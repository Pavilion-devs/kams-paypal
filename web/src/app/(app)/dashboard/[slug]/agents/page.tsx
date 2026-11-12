"use client";

import { CheckmarkBadge01Icon, Invoice01Icon, PlugSocketIcon, Search01Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { StatTile } from "@/components/charts/stat-tile";
import { ActivityFeed } from "@/components/kams/activity-feed";
import { PageHeader } from "@/components/kams/app-shell";
import { useDashboard } from "@/components/kams/dashboard-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-field";
import { routes } from "@/lib/routes";

const tools = [
  { name: "search_products", body: "Find items by keywords, budget and category.", icon: Search01Icon },
  { name: "get_product", body: "Full details, written for AI agents.", icon: ViewIcon },
  { name: "create_order", body: "Creates an itemized PayPal Orders v2 checkout the buyer approves.", icon: Invoice01Icon },
  { name: "get_order_status", body: "Confirms PayPal captured the payment before reporting it paid.", icon: CheckmarkBadge01Icon },
];

export default function AgentsPage() {
  const { data, slug } = useDashboard();
  if (!data) return null;
  const searches = data.events.filter((e) => e.type === "search");
  const zero = searches.filter((e) => Number(e.detail.results) === 0);
  const toolCalls = data.events.filter((e) => e.type === "mcp" && e.detail.method === "tools/call").length;

  return (
    <>
      <PageHeader
        title="AI agents"
        description="Your stall is a live MCP server. Here's what agents searched for, what they looked at and what they bought."
        actions={
          <Button asChild variant="secondary">
            <Link href={routes.stallShop(slug)} target="_blank">
              Try the AI shopper
            </Link>
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Agent searches" value={String(searches.length)} caption="Queries that reached your stall." />
        <StatTile label="Searches with no match" value={String(zero.length)} caption={zero[0] ? `Latest: “${String(zero[0].detail.query)}”. Consider adding it.` : "Agents found what they asked for."} />
        <StatTile label="External MCP tool calls" value={String(toolCalls)} caption="From Claude, ChatGPT and other clients." />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card padding="none" className="overflow-hidden">
          <header className="flex items-center justify-between px-5 pt-5 pb-2">
            <h2 className="font-display text-h4 font-medium">Activity</h2>
            <Badge tone="lime" dot>
              Live
            </Badge>
          </header>
          <ActivityFeed events={data.events} limit={40} filter={(e) => e.type !== "listed"} />
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <p className="flex items-center gap-2 font-medium">
              <HugeiconsIcon icon={PlugSocketIcon} size={18} aria-hidden="true" />
              MCP endpoint
            </p>
            <p className="text-subtle mt-1 mb-3 text-sm">Streamable HTTP, no auth needed to browse. Buyers always approve payment in PayPal.</p>
            <CopyField value={data.store.mcp_url} label="MCP endpoint" copiedMessage="MCP link copied" />
            <p className="text-subtle mt-4 mb-2 text-sm">Claude Code</p>
            <CopyField
              value={`claude mcp add --transport http ${slug} ${data.store.mcp_url}`}
              label="Claude Code command"
              copiedMessage="Command copied"
            />
          </Card>
          <Card>
            <p className="font-medium">Tools agents get</p>
            <ul className="mt-3 flex flex-col gap-3">
              {tools.map((t) => (
                <li key={t.name} className="flex gap-3">
                  <span className="bg-pill flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <HugeiconsIcon icon={t.icon} size={16} aria-hidden="true" />
                  </span>
                  <div className="text-sm">
                    <p className="font-mono font-medium">{t.name}</p>
                    <p className="text-subtle">{t.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
