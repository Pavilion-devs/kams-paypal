"use client";

import { use } from "react";
import { ShopperChat } from "@/components/kams/shopper-chat";

export default function StallShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <ShopperChat slug={slug} />;
}
