"use client";

import { Camera01Icon, CheckmarkCircle02Icon, Clock01Icon, Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { Piece } from "@/components/art/piece";
import { PanelBackdrop } from "@/components/landing/panel-backdrop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-field";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/ui/status-chip";
import { api, money, rememberKey, type Product, type Store } from "@/lib/api";
import { routes } from "@/lib/routes";
import { shrinkImage } from "@/lib/shrink-image";
import { toast } from "@/lib/toast";

type Job = { id: number; file: File; preview: string; note: string; state: "queued" | "working" | "done" | "error"; product?: Product; error?: string };

export default function NewStallPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", location: "", tagline: "", paypal_email: "" });
  const [creating, setCreating] = useState(false);
  const [note, setNote] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [over, setOver] = useState(false);
  const [origin, setOrigin] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);
  const active = useRef(0);
  const queue = useRef<Job[]>([]);

  // Returning seller adding more products: /new?store=slug
  useEffect(() => {
    setOrigin(window.location.origin);
    const slug = new URLSearchParams(window.location.search).get("store");
    if (!slug) return;
    let k: string | null = null;
    try {
      k = window.localStorage.getItem(`kams:key:${slug}`);
    } catch {}
    if (!k) return;
    setKey(k);
    api<{ store: Store }>(`/api/stores/${slug}`).then((r) => setStore(r.store)).catch(() => {});
  }, []);

  const update = (id: number, patch: Partial<Job>) => setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  const pump = useCallback(() => {
    if (!store || !key) return;
    while (active.current < 3 && queue.current.length) {
      const job = queue.current.shift()!;
      active.current++;
      update(job.id, { state: "working" });
      shrinkImage(job.file)
        .then((file) => {
          const fd = new FormData();
          fd.append("photo", file);
          fd.append("note", job.note);
          return api<{ product: Product }>(`/api/stores/${store.slug}/photos`, { method: "POST", body: fd, sellerKey: key });
        })
        .then((r) => update(job.id, { state: "done", product: r.product }))
        .catch((e: Error) => update(job.id, { state: "error", error: e.message }))
        .finally(() => {
          active.current--;
          pump();
        });
    }
  }, [store, key]);

  function add(files: File[]) {
    const fresh = files
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ id: ++seq.current, file, preview: URL.createObjectURL(file), note, state: "queued" as const }));
    setJobs((js) => [...fresh.reverse(), ...js]);
    queue.current.push(...fresh);
    pump();
  }

  async function create() {
    if (!form.name.trim()) return toast("Give your stall a name", "error");
    setCreating(true);
    try {
      const r = await api<{ store: Store; admin_key: string }>("/api/stores", { method: "POST", json: form });
      rememberKey(r.store.slug, r.admin_key);
      setKey(r.admin_key);
      setStore(r.store);
    } catch (e) {
      toast((e as Error).message, "error");
    }
    setCreating(false);
  }

  async function setPrice(p: Product, v: number) {
    try {
      await api(`/api/stores/${store!.slug}/products/${p.id}`, { method: "PATCH", sellerKey: key, json: { price_usd: v } });
      toast(`Price set to ${money(v)}`);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  const done = jobs.filter((j) => j.state === "done").length;

  if (!store) {
    return (
      <div className="mx-auto grid max-w-[1040px] gap-6 pt-6 lg:grid-cols-[1fr_420px]">
        <Card padding="lg">
          <Badge tone="lime">Step 1 of 2</Badge>
          <h1 className="font-display text-title mt-4 font-medium">Tell us about your stall</h1>
          <p className="text-muted mt-2">You don&apos;t need a website, a catalog or any tech skills.</p>
          <form
            className="mt-8 flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Stall name">
                <Input required maxLength={60} placeholder="Ada Weaves" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Where you sell from">
                <Input maxLength={80} placeholder="Lagos, Nigeria" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </Field>
            </div>
            <Field label="One line about what you sell">
              <Input maxLength={140} placeholder="Handwoven raffia baskets and bags, made by my family" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            </Field>
            <Field label="PayPal email to get paid" optional helper="Use a PayPal sandbox business account. Leave it blank to use the Kams demo merchant.">
              <Input type="email" placeholder="you@business.example.com" value={form.paypal_email} onChange={(e) => setForm({ ...form, paypal_email: e.target.value })} />
            </Field>
            <div>
              <Button type="submit" size="lg" loading={creating} loadingLabel="Opening your stall…">
                Continue
              </Button>
            </div>
          </form>
        </Card>
        <div className="relative hidden min-h-[460px] overflow-hidden rounded-3xl lg:block">
          <PanelBackdrop tone="lilac" />
          <div className="relative flex h-full flex-col justify-end gap-3 p-8">
            <Piece id="new-lime" shape="lime" className="animate-rock absolute top-10 right-10 w-24" />
            {["Snap a photo of each product", "Claude writes the listing and price", "AI agents can buy it with PayPal"].map((t, i) => (
              <div key={t} className="bg-surface/90 flex items-center gap-3 rounded-2xl p-4 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)]">
                <span className="bg-ink text-page flex size-8 items-center justify-center rounded-full text-sm font-medium">{i + 1}</span>
                <span className="font-medium">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dash = `${origin}${routes.dashboard(store.slug)}?key=${key}`;

  return (
    <div className="pt-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="lime">Step 2 of 2</Badge>
          <h1 className="font-display text-title mt-4 font-medium">Snap what you sell</h1>
          <p className="text-muted mt-2 max-w-[620px]">
            One product per photo. Claude writes each listing for <b className="text-ink font-medium">{store.name}</b> and suggests a fair price, and you can change anything.
          </p>
        </div>
        {done ? (
          <Badge tone="lime" dot>
            Live to AI agents · {done} listed
          </Badge>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <Field label="Notes for the AI" optional helper="Applies to the photos you add next. Prices in naira, cedis or shillings are fine.">
            <Input placeholder="Big basket ₦25,000, small ₦12,000. All handmade raffia." value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e: DragEvent) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              setOver(false);
              add([...e.dataTransfer.files]);
            }}
            className={`ease-spring flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-[423ms] ${over ? "border-ink bg-lime-soft" : "border-line bg-surface hover:border-ink"}`}
          >
            <span className="bg-pill flex size-14 items-center justify-center rounded-full">
              <HugeiconsIcon icon={Camera01Icon} size={26} aria-hidden="true" />
            </span>
            <span className="font-medium">Drop photos here or tap to choose</span>
            <span className="text-subtle text-sm">JPEG, PNG or WebP, up to 8 MB each</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => {
            add([...(e.target.files ?? [])]);
            e.target.value = "";
          }} />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((j) => (
              <Card key={j.id} padding="none" className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${j.preview})` }}>
                  <span className="absolute top-3 left-3">
                    {j.state === "done" ? (
                      <StatusChip tone="lime" icon={CheckmarkCircle02Icon} label={`Listed in ${((j.product?.ai_ms ?? 0) / 1000).toFixed(1)}s`} />
                    ) : j.state === "error" ? (
                      <StatusChip tone="pink" icon={Alert02Icon} label="Failed" />
                    ) : (
                      <StatusChip tone="amber" icon={Clock01Icon} label={j.state === "working" ? "Claude is looking…" : "Queued"} />
                    )}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  {j.state === "done" && j.product ? (
                    <>
                      <p className="leading-snug font-medium">{j.product.title}</p>
                      <p className="text-muted text-sm">{j.product.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[j.product.category, j.product.attributes?.material, j.product.attributes?.condition].filter(Boolean).map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          mono
                          type="number"
                          min={1}
                          step={0.5}
                          defaultValue={j.product.price_usd}
                          aria-label="Price in USD"
                          prefix={<span className="text-subtle">$</span>}
                          className="w-[130px]"
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (j.product && v !== j.product.price_usd) void setPrice(j.product, v);
                          }}
                        />
                        <span className="text-subtle text-xs">USD</span>
                      </div>
                      <p className="text-subtle text-xs">{j.product.price_rationale}</p>
                    </>
                  ) : j.state === "error" ? (
                    <p className="text-pink-ink text-sm">{j.error}</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <span className="bg-pill h-3 w-4/5 animate-pulse rounded" />
                      <span className="bg-pill h-3 w-3/5 animate-pulse rounded" />
                      <span className="bg-pill h-3 w-2/5 animate-pulse rounded" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="flex flex-col gap-4 self-start">
          <p className="font-display text-h4 font-medium">{done ? "Your stall is live" : "Your stall's links"}</p>
          <p className="text-subtle -mt-2 text-sm">People can shop your storefront, and AI agents can find and buy through your MCP endpoint.</p>
          <div>
            <p className="mb-1.5 text-sm font-medium">Storefront</p>
            <CopyField value={`${origin}${routes.stall(store.slug)}`} label="Storefront link" copiedMessage="Storefront link copied" />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">MCP endpoint</p>
            <CopyField value={store.mcp_url} label="MCP endpoint" copiedMessage="MCP link copied" />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Private seller dashboard</p>
            <CopyField value={dash} label="Dashboard link" copiedMessage="Dashboard link copied" />
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild>
              <Link href={routes.dashboard(store.slug)}>Open dashboard</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={routes.stallShop(store.slug)} target="_blank">
                Watch an AI agent shop your stall
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
