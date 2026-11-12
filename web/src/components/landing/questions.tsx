import {
  AiChat02Icon,
  Coins01Icon,
  Globe02Icon,
  HelpCircleIcon,
  PlugSocketIcon,
  Shield01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PillLink } from "@/components/ui/pill-link";
import { routes, sections } from "@/lib/routes";

const questions = [
  {
    q: "Do I need a website?",
    a: "No. Your photos become a storefront page and an MCP endpoint. Share the link on WhatsApp or Instagram, or let AI agents find you.",
    audience: "Sellers",
    topic: "Getting started",
    icon: Globe02Icon,
    tile: "bg-lime text-olive",
  },
  {
    q: "Can an AI spend my buyers' money?",
    a: "No. Agents only create a PayPal checkout. The buyer approves every payment in PayPal, and nothing is marked paid until PayPal captures it.",
    audience: "Buyers",
    topic: "Safety",
    icon: Shield01Icon,
    tile: "bg-pink text-ink",
  },
  {
    q: "How does Kams price my goods?",
    a: "Claude suggests a fair USD price from the photo and your notes, converting local currency, and shows its reasoning. You can change any price, and agents see the new one instantly.",
    audience: "Sellers",
    topic: "Pricing",
    icon: Tag01Icon,
    tile: "bg-lilac text-ink",
  },
  {
    q: "Which agents can shop my stall?",
    a: "Any client that speaks the Model Context Protocol, including Claude, ChatGPT connectors, Cursor and custom agents. Kams also has its own shopper.",
    audience: "Developers",
    topic: "Agents",
    icon: PlugSocketIcon,
    tile: "bg-olive text-lime",
  },
  {
    q: "How do I get paid?",
    a: "Through PayPal. Orders are captured to your PayPal business account. Kams shows the PayPal fee and your net on every order.",
    audience: "Sellers",
    topic: "Payouts",
    icon: Coins01Icon,
    tile: "bg-sky text-ink",
  },
  {
    q: "What does the AI actually do?",
    a: "It catalogs your photos, understands what buyers ask for, compares options within their budget and runs checkout through PayPal tools. It never invents products or prices.",
    audience: "Everyone",
    topic: "AI",
    icon: AiChat02Icon,
    tile: "bg-lime-soft text-olive",
  },
] as const;

const columns = [questions.slice(0, 2), questions.slice(2, 4), questions.slice(4, 6)];

export function Questions() {
  return (
    <section id={sections.faq} className="mx-auto mt-24 max-w-[1000px] scroll-mt-24 px-5 lg:mt-[120px] xl:px-0">
      <h2 className="font-display lg:text-h2 mx-auto max-w-[780px] text-center text-[36px] leading-[1.2] font-medium text-balance">
        Straight answers for sellers and buyers
      </h2>
      <div className="mt-10 grid gap-3 md:grid-cols-3 lg:mt-[49px]">
        {columns.map((column, index) => (
          <div key={column[0]?.q} className={`flex flex-col gap-3 lg:gap-6 ${index === 1 ? "md:-translate-y-6" : ""}`}>
            {column.map((item) => (
              <article key={item.q} className="reveal bg-surface relative flex flex-col justify-between gap-8 rounded-3xl px-5 pt-12 pb-5 md:min-h-[300px]">
                <HugeiconsIcon icon={HelpCircleIcon} size={36} className="text-pill absolute top-4 right-5" aria-hidden="true" />
                <div>
                  <h3 className="pr-10 font-medium">{item.q}</h3>
                  <p className="text-muted mt-2 text-sm">{item.a}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    <span className="block font-medium">{item.audience}</span>
                    <span className="text-subtle">{item.topic}</span>
                  </p>
                  <span aria-hidden="true" className={`flex size-10 items-center justify-center rounded-lg ${item.tile}`}>
                    <HugeiconsIcon icon={item.icon} size={20} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <PillLink href={routes.start}>Open your stall</PillLink>
      </div>
    </section>
  );
}
