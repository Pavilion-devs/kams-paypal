"use client";

import { Add01Icon, Camera01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/kams/app-shell";
import { useDashboard } from "@/components/kams/dashboard-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { api, type Product } from "@/lib/api";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";

function PriceCell({ p, onSave }: { p: Product; onSave: (v: number) => Promise<void> }) {
  const [value, setValue] = useState(String(p.price_usd));
  return (
    <Input
      mono
      type="number"
      min={1}
      step={0.5}
      aria-label={`Price for ${p.title}`}
      value={value}
      prefix={<span className="text-subtle">$</span>}
      className="w-[120px]"
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (Number(value) !== p.price_usd) void onSave(Number(value));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

export default function ProductsPage() {
  const { data, slug, sellerKey, refresh } = useDashboard();
  const products = data?.products ?? [];

  async function patch(id: string, body: Partial<Product>, msg: string) {
    try {
      await api(`/api/stores/${slug}/products/${id}`, { method: "PATCH", sellerKey, json: body });
      toast(msg);
      await refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }
  async function remove(p: Product) {
    if (!window.confirm(`Remove “${p.title}” from your stall?`)) return;
    await api(`/api/stores/${slug}/products/${p.id}`, { method: "DELETE", sellerKey });
    toast("Product removed");
    await refresh();
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Listings Claude wrote from your photos. Change a price or hide an item, and AI agents see it instantly."
        actions={
          <Button asChild>
            <Link href={`${routes.start}?store=${slug}`}>
              <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} aria-hidden="true" />
              Snap more products
            </Link>
          </Button>
        }
      />
      <Card padding="none" className="overflow-hidden">
        {products.length === 0 ? (
          <EmptyState
            variant="section"
            icon={Camera01Icon}
            title="No products yet"
            body="Upload a few phone photos and Claude will write the listings."
            actions={
              <Button asChild>
                <Link href={`${routes.start}?store=${slug}`}>Add products</Link>
              </Button>
            }
          />
        ) : (
          <Table caption="Products">
            <THead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>AI confidence</Th>
                <Th>Visible to agents</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {products.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <div className="flex min-w-[260px] items-center gap-3">
                      <span className="bg-soft size-12 shrink-0 rounded-xl bg-cover bg-center" style={{ backgroundImage: p.image_url ? `url(${p.image_url})` : undefined }} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.title}</p>
                        <p className="text-subtle max-w-[360px] truncate text-xs" title={p.price_rationale}>
                          {p.price_rationale}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge>{p.category ?? "—"}</Badge>
                  </Td>
                  <Td>
                    <PriceCell p={p} onSave={(v) => patch(p.id, { price_usd: v }, `Price set to $${v.toFixed(2)}`)} />
                  </Td>
                  <Td>
                    <Badge tone={(p.confidence ?? 1) >= 0.75 ? "lime" : (p.confidence ?? 1) >= 0.6 ? "amber" : "pink"}>
                      {Math.round((p.confidence ?? 1) * 100)}%
                    </Badge>
                  </Td>
                  <Td>
                    <Switch
                      checked={p.in_stock !== false}
                      label={<span className="sr-only">In stock</span>}
                      onCheckedChange={(v) => void patch(p.id, { in_stock: v }, v ? "Back in stock" : "Hidden from agents")}
                    />
                  </Td>
                  <Td>
                    <IconButton icon={Delete02Icon} label={`Remove ${p.title}`} size="sm" onClick={() => void remove(p)} />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
