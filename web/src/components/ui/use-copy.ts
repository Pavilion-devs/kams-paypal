"use client";

import { toast } from "@/lib/toast";

export const useCopy = () => {
  return async (text: string, copiedMessage: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast("Couldn't copy. Select the text and copy it manually.", "error");
      return false;
    }
    toast(copiedMessage, "success", 1800);
    return true;
  };
};
