"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api, readSellerKey, type Dashboard } from "@/lib/api";
import { toast } from "@/lib/toast";

type Ctx = {
  slug: string;
  sellerKey: string | null;
  data: Dashboard | null;
  error: string | null;
  refresh: () => Promise<void>;
};

const DashboardContext = createContext<Ctx | null>(null);

export function DashboardProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [sellerKey, setSellerKey] = useState<string | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seenPaid = useRef<Set<string> | null>(null);

  useEffect(() => {
    const key = readSellerKey(slug);
    setSellerKey(key);
    if (key && new URLSearchParams(window.location.search).has("key")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (!key) setError("This dashboard needs the private seller link you got when you opened the stall.");
  }, [slug]);

  const refresh = useCallback(async () => {
    if (!sellerKey) return;
    try {
      const d = await api<Dashboard>(`/api/stores/${slug}/dashboard`, { sellerKey });
      const paid = new Set(d.orders.filter((o) => o.status === "PAID").map((o) => o.id));
      if (seenPaid.current) {
        for (const id of paid) {
          if (!seenPaid.current.has(id)) {
            const o = d.orders.find((x) => x.id === id);
            toast(`New PayPal payment: $${o?.total.toFixed(2)}`, "success", 5000);
          }
        }
      }
      seenPaid.current = paid;
      setData(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [slug, sellerKey]);

  useEffect(() => {
    if (!sellerKey) return;
    void refresh();
    const t = setInterval(() => void refresh(), 4000);
    return () => clearInterval(t);
  }, [sellerKey, refresh]);

  return <DashboardContext.Provider value={{ slug, sellerKey, data, error, refresh }}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard outside provider");
  return ctx;
}
