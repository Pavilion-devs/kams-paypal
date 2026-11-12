"use client";

import { LockKeyIcon } from "@hugeicons/core-free-icons";
import { use, type ReactNode } from "react";
import { AppShell } from "@/components/kams/app-shell";
import { DashboardProvider, useDashboard } from "@/components/kams/dashboard-data";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

function Gate({ children }: { children: ReactNode }) {
  const { data, error, slug } = useDashboard();
  if (!data && error) {
    return (
      <AppShell slug={slug} stallName={slug}>
        <EmptyState variant="page" icon={LockKeyIcon} title="Seller link needed" body={error} />
      </AppShell>
    );
  }
  if (!data) {
    return (
      <AppShell slug={slug} stallName="…">
        <Skeleton className="h-9 w-56" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell slug={slug} stallName={data.store.name}>
      {children}
    </AppShell>
  );
}

export default function DashboardLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <DashboardProvider slug={slug}>
      <Gate>{children}</Gate>
    </DashboardProvider>
  );
}
