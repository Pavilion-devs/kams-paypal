import Link from "next/link";
import { routes } from "@/lib/routes";
import { BrandMark } from "./brand-mark";

export function Logo({ priority: _priority }: { priority?: boolean } = {}) {
  return (
    <Link href={routes.home} aria-label="Kams home" className="inline-flex items-center gap-2">
      <BrandMark height={28} />
      <span className="font-display text-[26px] leading-[26px] font-extrabold tracking-[-0.03em]">kams</span>
    </Link>
  );
}
