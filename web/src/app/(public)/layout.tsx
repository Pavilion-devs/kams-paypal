import type { ReactNode } from "react";
import { SiteHeader } from "@/components/landing/site-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="font-ui mx-auto w-full max-w-[1200px] px-5 pt-6 pb-20 xl:px-0">{children}</main>
    </>
  );
}
