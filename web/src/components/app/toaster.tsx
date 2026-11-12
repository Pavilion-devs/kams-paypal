"use client";

import { Toast } from "@/components/ui/toast";
import { dismissToast, useToasts } from "@/lib/toast";

export function Toaster() {
  const toasts = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 lg:right-6 lg:left-auto lg:items-end">
      {toasts.map((t) => (
        <Toast key={t.id} tone={t.tone} message={t.message} onDismiss={() => dismissToast(t.id)} className="max-w-[380px]" />
      ))}
    </div>
  );
}
