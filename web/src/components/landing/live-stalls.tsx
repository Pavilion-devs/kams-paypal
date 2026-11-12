"use client";

import { ArrowRight01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-field";
import { api, type Store } from "@/lib/api";
import { routes } from "@/lib/routes";

export function LiveStalls() {
  const [stores, setStores] = useState<Store[] | null>(null);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
    api<{ stores: Store[] }>("/api/stores").then((r) => setStores(r.stores)).catch(() => setStores([]));
  }, []);

  return (
    <section className="mx-auto mt-24 max-w-[1200px] px-5 lg:mt-[120px] xl:px-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display lg:text-h3 text-[32px] leading-[1.2] font-medium">Live stalls</h2>
          <p className="text-muted mt-2">Real sellers, live to AI agents right now.</p>
        </div>
        {origin ? (
          <div className="bg-pill flex items-center gap-2 rounded-3xl py-1 pr-1 pl-4 text-sm">
            <span className="text-subtle">All stalls via MCP</span>
            <code className="font-mono">{origin}/mcp</code>
            <CopyButton value={`${origin}/mcp`} label="Copy MCP link" copiedMessage="MCP link copied" />
          </div>
        ) : null}
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(stores ?? []).map((s) => (
          <Link
            key={s.slug}
            href={routes.stall(s.slug)}
            className="group bg-surface border-hairline hover:border-ink ease-spring flex flex-col gap-4 rounded-3xl border p-5 transition-colors duration-[423ms]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-h4 font-medium">{s.name}</p>
                {s.location ? (
                  <p className="text-subtle mt-1 flex items-center gap-1 text-sm">
                    <HugeiconsIcon icon={Location01Icon} size={14} aria-hidden="true" />
                    {s.location}
                  </p>
                ) : null}
              </div>
              <Badge tone="lime" dot>
                Live
              </Badge>
            </div>
            {s.tagline ? <p className="text-muted text-sm">{s.tagline}</p> : null}
            <div className="mt-auto flex items-center justify-between text-sm">
              <span className="text-subtle">{s.products ?? 0} products</span>
              <span className="inline-flex items-center gap-1 font-medium">
                Visit stall <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
        {stores && stores.length === 0 ? (
          <div className="bg-pill text-muted rounded-3xl p-8 text-center sm:col-span-2 lg:col-span-3">
            No stalls yet. <Link href={routes.start} className="text-ink font-medium underline">Open the first one</Link>.
          </div>
        ) : null}
      </div>
    </section>
  );
}
