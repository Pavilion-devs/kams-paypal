import { anchor, sections } from "@/lib/routes";

export const navLinks = [
  { label: "Product", href: anchor(sections.product) },
  { label: "How it works", href: anchor(sections.howItWorks) },
  { label: "For agents", href: anchor(sections.agents) },
  { label: "FAQ", href: anchor(sections.faq) },
] as const;
