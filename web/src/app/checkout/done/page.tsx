"use client";

import { Cancel01Icon, CheckmarkCircle02Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { Piece } from "@/components/art/piece";
import { PanelBackdrop } from "@/components/landing/panel-backdrop";
import { Logo } from "@/components/ui/logo";
import { api, money, type OrderView } from "@/lib/api";

export default function CheckoutDone() {
  const [status, setStatus] = useState<"paid" | "pending" | "cancelled">("pending");
  const [order, setOrder] = useState<OrderView | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const id = q.get("order") ?? "";
    setStatus((q.get("status") as typeof status) ?? "pending");
    api<OrderView>(`/api/orders/${id}`)
      .then((o) => {
        setOrder(o);
        if (o.paid) setStatus("paid");
        if (o.paid) {
          try {
            window.opener?.postMessage({ type: "kams-paid", order: id }, "*");
          } catch {}
          setTimeout(() => {
            try {
              if (window.opener) window.close();
            } catch {}
          }, 3000);
        }
      })
      .catch(() => {});
  }, []);

  const view = {
    paid: { icon: CheckmarkCircle02Icon, tile: "bg-lime-soft text-lime-ink", title: "Payment complete", body: order ? `You paid ${money(order.total.value)} with PayPal. The seller has your order.` : "Paid with PayPal." },
    pending: { icon: Clock01Icon, tile: "bg-amber-soft text-amber-ink", title: "Confirming with PayPal…", body: "We're waiting for PayPal to confirm the payment." },
    cancelled: { icon: Cancel01Icon, tile: "bg-pink-soft text-pink-ink", title: "Checkout cancelled", body: "No money moved. You can go back to your shopping assistant." },
  }[status];

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5">
      <PanelBackdrop tone={status === "paid" ? "lime" : status === "cancelled" ? "pink" : "sky"} />
      <Piece id="done-lime" shape="lime" className="animate-rock absolute top-[12%] left-[12%] hidden w-24 md:block" />
      <div className="bg-surface shadow-frame font-ui relative w-full max-w-[420px] rounded-3xl p-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <span className={`mx-auto mt-8 flex size-16 items-center justify-center rounded-full ${view.tile}`}>
          <HugeiconsIcon icon={view.icon} size={30} aria-hidden="true" />
        </span>
        <h1 className="font-display text-h4 mt-5 font-medium">{view.title}</h1>
        <p className="text-muted mt-2">{view.body}</p>
        {order?.capture_id ? <p className="text-subtle mt-4 font-mono text-xs">PayPal capture {order.capture_id}</p> : null}
        <p className="text-subtle mt-6 text-sm">You can close this tab and go back to your shopping assistant.</p>
      </div>
    </div>
  );
}
