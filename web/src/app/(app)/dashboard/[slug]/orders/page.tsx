"use client";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ArrowTurnBackwardIcon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/kams/app-shell";
import { useDashboard } from "@/components/kams/dashboard-data";
import { channelLabel, OrderStatusChip } from "@/components/kams/order-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { KeyValue } from "@/components/ui/key-value";
import { api, money, timeAgo, type Order } from "@/lib/api";
import { toast } from "@/lib/toast";

const tabs = [
  { key: "all", label: "All" },
  { key: "PAID", label: "Paid" },
  { key: "AWAITING_APPROVAL", label: "Awaiting approval" },
  { key: "REFUNDED", label: "Refunded" },
] as const;

export default function OrdersPage() {
  const { data, slug, sellerKey, refresh } = useDashboard();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refunding, setRefunding] = useState(false);
  const orders = data?.orders ?? [];
  const rows = tab === "all" ? orders : orders.filter((o) => o.status === tab);
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const columns = useMemo<ColDef<Order>[]>(
    () => [
      { headerName: "When", field: "created_at", width: 110, sort: "desc", valueFormatter: (p) => timeAgo(p.value as string) },
      {
        headerName: "Items",
        flex: 2,
        minWidth: 200,
        valueGetter: (p) => p.data?.items.map((i) => (i.quantity > 1 ? `${i.title} ×${i.quantity}` : i.title)).join(", "),
        tooltipValueGetter: (p) => p.value as string,
      },
      { headerName: "Total", field: "total", width: 100, type: "rightAligned", valueFormatter: (p) => money(p.value as number), cellClass: "font-mono" },
      { headerName: "Channel", field: "channel", width: 190, valueFormatter: (p) => channelLabel(p.value as Order["channel"]) },
      { headerName: "Buyer", flex: 1, minWidth: 140, valueGetter: (p) => p.data?.payer_name || p.data?.payer_email || "—" },
      {
        headerName: "Status",
        field: "status",
        width: 180,
        cellRenderer: (p: ICellRendererParams<Order>) => (p.data ? <OrderStatusChip status={p.data.status} /> : null),
      },
    ],
    [],
  );

  async function refund(o: Order) {
    if (!window.confirm(`Refund ${money(o.total)} to the buyer through PayPal?`)) return;
    setRefunding(true);
    try {
      await api(`/api/stores/${slug}/orders/${o.id}/refund`, { method: "POST", sellerKey, json: { reason: "Refund from seller" } });
      toast("Refunded through PayPal");
      await refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    }
    setRefunding(false);
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order is a real PayPal Orders v2 checkout. Buyers approve in PayPal, and Kams captures the payment. Refunds go straight back to the buyer."
      />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter orders">
        {tabs.map((t) => {
          const count = t.key === "all" ? orders.length : orders.filter((o) => o.status === t.key).length;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`h-9 rounded-3xl px-4 text-sm font-medium transition-colors duration-[423ms] ${tab === t.key ? "bg-ink text-page" : "bg-pill text-ink hover:bg-pill-edge"}`}
            >
              {t.label} <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card padding="none" className="overflow-hidden">
          {orders.length === 0 ? (
            <EmptyState variant="section" icon={ShoppingBag01Icon} title="No orders yet" body="Orders from AI agents, the Kams shopper and your storefront show up here." />
          ) : (
            <div className="kams-grid ag-theme-quartz h-[520px] w-full">
              <AgGridReact<Order>
                rowData={rows}
                columnDefs={columns}
                getRowId={(p) => p.data.id}
                rowHeight={56}
                headerHeight={44}
                animateRows
                rowSelection="single"
                autoSizeStrategy={{ type: "fitGridWidth", defaultMinWidth: 90 }}
                onRowClicked={(e) => setSelectedId(e.data?.id ?? null)}
                defaultColDef={{ sortable: true, resizable: true }}
                overlayNoRowsTemplate="<span>No orders in this view.</span>"
              />
            </div>
          )}
        </Card>

        <Card className="self-start">
          {selected ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-subtle text-xs">Order {selected.id}</p>
                  <p className="font-display text-h4 mt-1 font-medium">{money(selected.total)}</p>
                </div>
                <OrderStatusChip status={selected.status} />
              </div>
              <ul className="flex flex-col gap-1 text-sm">
                {selected.items.map((i) => (
                  <li key={i.product_id} className="flex justify-between gap-3">
                    <span className="truncate">
                      {i.title} × {i.quantity}
                    </span>
                    <span className="font-mono">{money(i.unit_price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <KeyValue
                className="border-hairline border-t"
                items={[
                  { key: "channel", label: "Channel", value: channelLabel(selected.channel) },
                  { key: "pp", label: "PayPal order", value: selected.paypal_order_id ?? "—", mono: true },
                  { key: "cap", label: "Capture", value: selected.capture_id ?? "—", mono: true },
                  ...(selected.payer_name || selected.payer_email ? [{ key: "buyer", label: "Buyer", value: selected.payer_name || selected.payer_email }] : []),
                  ...(selected.ship_to ? [{ key: "ship", label: "Ship to", value: selected.ship_to }] : []),
                  ...(selected.paypal_fee ? [{ key: "fee", label: "PayPal fee", value: money(selected.paypal_fee), mono: true }] : []),
                  ...(selected.net_amount ? [{ key: "net", label: "You keep", value: money(selected.net_amount), mono: true }] : []),
                  ...(selected.note ? [{ key: "note", label: "Buyer note", value: selected.note }] : []),
                  ...(selected.refund_id ? [{ key: "refund", label: "Refund", value: selected.refund_id, mono: true }] : []),
                ]}
              />
              {selected.status === "PAID" ? (
                <Button variant="danger" icon={ArrowTurnBackwardIcon} loading={refunding} loadingLabel="Refunding…" onClick={() => void refund(selected)}>
                  Refund through PayPal
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-subtle py-10 text-center text-sm">Select an order to see its PayPal details.</p>
          )}
        </Card>
      </div>
    </>
  );
}
