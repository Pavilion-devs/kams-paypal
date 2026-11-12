import {
  AiBrain01Icon,
  CloudServerIcon,
  Coins01Icon,
  CreditCardIcon,
  DashboardSquare01Icon,
  PlugSocketIcon,
  SourceCodeIcon,
  CodeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const stack = [
  { name: "PayPal", icon: CreditCardIcon },
  { name: "Orders v2", icon: Coins01Icon },
  { name: "Claude", icon: AiBrain01Icon },
  { name: "Bedrock", icon: CloudServerIcon },
  { name: "MCP", icon: PlugSocketIcon },
  { name: "AG Grid", icon: DashboardSquare01Icon },
  { name: "Next.js", icon: SourceCodeIcon },
  { name: "TypeScript", icon: CodeIcon },
] as const;

export function BuiltWith() {
  return (
    <section data-reveal className="mx-auto mt-24 max-w-[980px] px-5 lg:mt-[120px] xl:px-0">
      <p className="text-body lg:text-lead text-center text-lg">Built on PayPal and Claude</p>
      <ul className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {stack.map((item) => (
          <li key={item.name} className="text-muted flex h-[74px] items-center justify-center gap-2.5">
            <HugeiconsIcon icon={item.icon} size={26} strokeWidth={1.8} aria-hidden="true" />
            <span className="font-display text-[22px] font-bold tracking-[-0.02em] lg:text-[26px]">{item.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
