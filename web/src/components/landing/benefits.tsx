import type { ReactNode } from "react";
import { Piece, type PieceShape } from "@/components/art/piece";
import { sections } from "@/lib/routes";
import { AgentArt, PaidArt, SnapArt } from "./benefit-art";

const benefits: { title: string; body: string; shape: PieceShape; art: ReactNode }[] = [
  {
    title: "Snap, don't build",
    body: "Upload phone photos. Claude writes the title, a fair USD price and the details AI agents need. You don't need a website or a catalog.",
    shape: "lime",
    art: <SnapArt />,
  },
  {
    title: "Found by AI shoppers",
    body: "Every stall gets an MCP endpoint, so Claude, ChatGPT and other agents can search it and check out the moment it goes live.",
    shape: "pink",
    art: <AgentArt />,
  },
  {
    title: "Paid with PayPal",
    body: "Agents create real PayPal orders. Buyers approve them in PayPal, you get paid, and refunds take one click.",
    shape: "block",
    art: <PaidArt />,
  },
];

export function Benefits() {
  return (
    <section id={sections.howItWorks} data-reveal className="mx-auto mt-14 max-w-[1200px] scroll-mt-24 px-5 lg:mt-5 xl:px-0">
      <div className="benefits bg-pill flex flex-col gap-2 rounded-[32px] p-2 lg:h-[436px] lg:flex-row">
        {benefits.map((benefit, index) => (
          <article
            key={benefit.title}
            data-default={index === 0 ? "" : undefined}
            className="benefit-card relative flex flex-col gap-2 overflow-hidden rounded-3xl p-2 lg:flex-row lg:gap-0 lg:max-xl:flex-1"
          >
            <div className="benefit-text flex min-w-0 shrink-0 flex-col justify-between gap-10 px-6 pt-6 pb-6 lg:flex-1 lg:pb-[17px] xl:flex-none">
              <span className="bg-pill flex size-16 items-center justify-center rounded-full">
                <Piece id={`benefit-${benefit.shape}`} shape={benefit.shape} className="w-9" />
              </span>
              <div>
                <h3 className="font-display text-h4 font-medium">{benefit.title}</h3>
                <p className="text-muted mt-1.5">{benefit.body}</p>
              </div>
            </div>
            <div className="benefit-art h-[300px] lg:hidden xl:absolute xl:top-2 xl:bottom-2 xl:left-[262px] xl:block xl:h-auto xl:w-[267px]">
              {benefit.art}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
