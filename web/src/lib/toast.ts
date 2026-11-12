"use client";

import { useSyncExternalStore } from "react";
import type { ToastTone } from "@/components/ui/toast";

export type ToastItem = { id: number; tone: ToastTone; message: string };

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(message: string, tone: ToastTone = "success", durationMs = 3200) {
  const id = ++seq;
  items = [...items.slice(-2), { id, tone, message }];
  emit();
  setTimeout(() => dismissToast(id), durationMs);
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useToasts = () => useSyncExternalStore(subscribe, () => items, () => items);
