import Link from "next/link";
import { Blob } from "@/components/art/blob";
import { Cloud } from "@/components/art/cloud";
import { Piece } from "@/components/art/piece";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Logo } from "@/components/ui/logo";
import { anchor, routes, sections } from "@/lib/routes";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: anchor(sections.howItWorks) },
      { label: "For AI agents", href: anchor(sections.agents) },
      { label: "FAQ", href: anchor(sections.faq) },
    ],
  },
  {
    title: "Try it",
    links: [
      { label: "AI shopper", href: routes.shop },
      { label: "Live stall", href: routes.stall("ada-weaves") },
    ],
  },
  {
    title: "Sellers",
    links: [
      { label: "Open a stall", href: routes.start },
      { label: "MCP endpoint", href: anchor(sections.agents) },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-section relative overflow-hidden px-5 pb-[60px] xl:px-5">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Cloud className="text-pill/60 absolute top-6 -right-6 hidden w-[484px] lg:block" />
        <Cloud className="text-pill/70 absolute bottom-0 -left-4 w-[480px]" />
        <div className="absolute top-[59px] left-1/2 w-[100px] -translate-x-1/2">
          <Piece
            id="cta-lime"
            shape="lime"
            className="animate-rock w-full drop-shadow-[0_16px_20px_rgba(140,190,20,0.25)] will-change-transform"
          />
        </div>
        <Blob
          tone="pink"
          shape="diamond"
          className="top-[140px] left-[18%] hidden size-12 lg:block"
        />
        <Blob tone="lime" shape="dot" className="top-[174px] left-[64%] hidden size-8 lg:block" />
        <Piece
          id="cta-pink"
          shape="pink"
          className="absolute top-[432px] left-[16%] hidden w-[110px] -rotate-[10deg] drop-shadow-[0_20px_24px_rgba(240,120,210,0.3)] lg:block"
        />
        <Piece
          id="cta-lilac"
          shape="block"
          tone="lilac"
          className="absolute top-[370px] right-[8%] hidden w-[160px] rotate-[12deg] drop-shadow-[0_20px_24px_rgba(150,120,240,0.25)] lg:block"
        />
      </div>
      <div className="relative mx-auto flex max-w-[780px] flex-col items-center pt-[200px] text-center lg:pt-[256px]">
        <h2 className="font-display text-[40px] leading-[1.2] font-medium lg:text-h1">
          Your stall, open to every AI shopper.
        </h2>
        <p className="text-body mt-1 text-lg lg:text-lead">
          Snap a few photos. Kams does the listing, the agents and the PayPal checkout.
        </p>
        <div className="mt-8">
          <ArrowLink href={routes.start}>Open your stall</ArrowLink>
        </div>
      </div>
      <div className="bg-surface/80 border-hairline relative mx-auto mt-20 flex max-w-[1200px] flex-col gap-10 rounded-3xl border px-8 py-10 backdrop-blur-sm lg:flex-row lg:justify-between lg:px-[60px]">
        <div className="flex flex-col justify-between gap-10">
          <Logo />
          <p className="text-sm font-medium">
            © 2026 Kams. PayPal sandbox demo: no real money moves.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-[52px]">
          {columns.map((column) => (
            <div key={column.title} className="lg:min-w-[150px]">
              <p className="text-body font-medium">{column.title}</p>
              <ul className="mt-4 flex flex-col gap-4">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-body font-medium whitespace-nowrap"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
