"use client";

import {
  Add01Icon,
  AiChat02Icon,
  Analytics01Icon,
  DashboardSquare01Icon,
  Menu01Icon,
  Package01Icon,
  PlugSocketIcon,
  ShoppingBag01Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { cx } from "@/components/ui/cx";
import { IconButton } from "@/components/ui/icon-button";
import { routes } from "@/lib/routes";

type NavItem = { id: string; label: string; href: string; icon: IconSvgElement; external?: boolean; exact?: boolean };

const groups = (slug: string): { id: string; label: string; items: NavItem[] }[] => [
  {
    id: "stall",
    label: "Your stall",
    items: [
      { id: "overview", label: "Overview", href: routes.dashboard(slug), icon: DashboardSquare01Icon, exact: true },
      { id: "orders", label: "Orders", href: routes.dashboardOrders(slug), icon: ShoppingBag01Icon },
      { id: "products", label: "Products", href: routes.dashboardProducts(slug), icon: Package01Icon },
      { id: "agents", label: "AI agents", href: routes.dashboardAgents(slug), icon: Analytics01Icon },
    ],
  },
  {
    id: "share",
    label: "Share",
    items: [
      { id: "storefront", label: "Storefront", href: routes.stall(slug), icon: Store01Icon, external: true },
      { id: "shopper", label: "AI shopper", href: routes.stallShop(slug), icon: AiChat02Icon, external: true },
      { id: "mcp", label: "Agent endpoint", href: routes.dashboardAgents(slug), icon: PlugSocketIcon },
    ],
  },
];

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      {...(item.external ? { target: "_blank" } : {})}
      {...(active && item.id !== "mcp" ? { "aria-current": "page" as const } : {})}
      onClick={onNavigate}
      className={cx(
        "font-ui flex min-h-10 w-full min-w-0 items-center gap-3 rounded-xl px-3 text-sm font-medium",
        "[transition-duration:423ms] [transition-property:background-color,color] [transition-timing-function:var(--ease-spring)]",
        active && item.id !== "mcp" ? "bg-ink text-page" : "text-ink hover:bg-pill",
      )}
    >
      <HugeiconsIcon icon={item.icon} size={20} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </Link>
  );
}

function Nav({ slug, onNavigate }: { slug: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-4">
      {groups(slug).map((g) => (
        <div key={g.id}>
          <p className="text-subtle mb-1 flex h-8 items-center px-3 text-xs font-medium">{g.label}</p>
          <ul className="flex flex-col gap-1">
            {g.items.map((item) => (
              <li key={item.id}>
                <NavLink item={item} {...(onNavigate ? { onNavigate } : {})} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ slug, stallName, children }: { slug: string; stallName: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-page flex min-h-dvh">
      <aside className="border-hairline bg-section sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <Link href={routes.home} className="inline-flex items-center gap-2">
            <BrandMark height={24} />
            <span className="font-display text-[22px] leading-none font-extrabold tracking-[-0.03em]">kams</span>
          </Link>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-5">
          <Nav slug={slug} />
        </div>
        <div className="border-hairline flex items-center gap-3 border-t px-4 py-4">
          <span className="bg-lime-soft text-olive font-display flex size-9 items-center justify-center rounded-full text-sm font-bold">
            {stallName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{stallName}</p>
            <p className="text-subtle text-xs">Seller</p>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-hairline bg-page/85 sticky top-0 z-30 border-b backdrop-blur-[30px]">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <IconButton icon={Menu01Icon} label="Menu" onClick={() => setOpen(true)} />
              <BrandMark height={24} />
            </div>
            <div className="bg-pill hidden h-10 items-center gap-2 rounded-3xl px-4 text-sm lg:flex">
              <HugeiconsIcon icon={Store01Icon} size={16} aria-hidden="true" />
              <span className="font-medium">{stallName}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge tone="lime" dot className="hidden sm:inline-flex">
                Live to AI agents
              </Badge>
              <Badge tone="lilac" className="hidden sm:inline-flex">
                PayPal sandbox
              </Badge>
              <Button asChild size="md">
                <Link href={`${routes.start}?store=${slug}`}>
                  <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} aria-hidden="true" />
                  Add products
                </Link>
              </Button>
            </div>
          </div>
        </header>
        <main className="font-ui mx-auto w-full max-w-[1200px] flex-1 px-4 pt-6 pb-24 lg:px-8 lg:pb-12">{children}</main>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="bg-ink/30 absolute inset-0" onClick={() => setOpen(false)} />
          <div className="bg-section animate-drawer-in absolute inset-y-0 left-0 w-[280px] overflow-y-auto p-4">
            <Nav slug={slug} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-title font-medium tracking-[-0.01em]">{title}</h1>
        {description ? <p className="text-subtle mt-1 max-w-[620px] text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
