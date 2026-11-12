"use client";

import { AiChat02Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PayPalButton } from "@/components/kams/paypal-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-field";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api, money, type Product, type Store } from "@/lib/api";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";

export default function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<{ store: Store; products: Product[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    api<{ store: Store; products: Product[] }>(`/api/stores/${slug}`).then(setData).catch((e: Error) => setError(e.message));
    const onMsg = (e: MessageEvent) => {
      if ((e.data as { type?: string })?.type === "kams-paid") toast("Payment complete. Thank you!");
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [slug]);

  async function buy(p: Product) {
    setBuying(p.id);
    const win = window.open("about:blank", "paypal", "width=480,height=720");
    try {
      const o = await api<{ checkout_url: string }>(`/api/stores/${slug}/checkout`, { method: "POST", json: { product_id: p.id } });
      if (win) win.location.href = o.checkout_url;
      else window.location.href = o.checkout_url;
    } catch (e) {
      win?.close();
      toast((e as Error).message, "error");
    }
    setBuying(null);
  }

  if (error) return <EmptyState variant="page" title="Stall not found" body={error} />;
  if (!data) return <Skeleton className="mt-6 h-40 rounded-3xl" />;
  const { store, products } = data;

  return (
    <>
      <section className="bg-pill mt-2 flex flex-col gap-6 rounded-[32px] p-6 lg:flex-row lg:items-end lg:justify-between lg:p-10">
        <div>
          <Badge tone="lime" dot>
            Agent-ready stall
          </Badge>
          <h1 className="font-display lg:text-h2 mt-4 text-[40px] leading-[1.15] font-medium">{store.name}</h1>
          <p className="text-muted mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {store.location ? (
              <span className="inline-flex items-center gap-1">
                <HugeiconsIcon icon={Location01Icon} size={16} aria-hidden="true" />
                {store.location}
              </span>
            ) : null}
            {store.tagline ? <span>{store.tagline}</span> : null}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-[420px]">
          <Button asChild size="lg">
            <Link href={routes.stallShop(slug)}>
              <HugeiconsIcon icon={AiChat02Icon} size={18} aria-hidden="true" />
              Let an AI shop this stall
            </Link>
          </Button>
          <CopyField value={store.mcp_url} label="MCP endpoint" copiedMessage="MCP link copied" className="bg-surface" />
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <Card key={p.id} padding="none" className={`flex flex-col overflow-hidden ${p.in_stock === false ? "opacity-55" : ""}`}>
            <div id={p.id} className="bg-soft aspect-square bg-cover bg-center" style={{ backgroundImage: p.image_url ? `url(${p.image_url})` : undefined }} />
            <div className="flex flex-1 flex-col gap-2 p-4">
              <p className="leading-snug font-medium">{p.title}</p>
              <p className="text-muted line-clamp-2 text-sm">{p.description}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                <span className="font-mono text-lg">{money(p.price_usd)}</span>
                {p.in_stock === false ? <Badge>Sold out</Badge> : <PayPalButton size="sm" label="Buy with" loading={buying === p.id} onClick={() => void buy(p)} />}
              </div>
            </div>
          </Card>
        ))}
      </div>
      {products.length === 0 ? <EmptyState variant="section" title="No products yet" /> : null}
    </>
  );
}
