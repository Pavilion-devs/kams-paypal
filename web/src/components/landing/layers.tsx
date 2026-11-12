import {
  AiChat02Icon,
  Camera01Icon,
  CheckListIcon,
  Coins01Icon,
  PlugSocketIcon,
  Search01Icon,
  ShoppingBag01Icon,
  SparklesIcon,
  Tag01Icon,
  ApiIcon,
  ArrowTurnBackwardIcon,
  Analytics01Icon,
} from "@hugeicons/core-free-icons";
import { routes, sections } from "@/lib/routes";
import { FeatureBlock, type Feature } from "./feature-block";
import { StackedCards } from "./stacked-cards";
import { AgentsScreen, OrdersScreen, ShopperScreen, SnapScreen } from "./screens/kams-screens";

const features: Feature[] = [
  {
    id: "snap",
    title: "Photo to storefront",
    body: "Claude Sonnet on Amazon Bedrock reads each photo and writes an honest listing. It converts your local price to USD and writes a factual description for AI agents, plus the search tags that help them find you.",
    chips: [
      { label: "Vision cataloguing", icon: Camera01Icon },
      { label: "Fair USD pricing", icon: Tag01Icon },
      { label: "Agent-ready copy", icon: SparklesIcon },
    ],
    cta: { label: "Open your stall", href: routes.start },
    tone: "lilac",
    screen: <SnapScreen />,
  },
  {
    id: sections.agents,
    title: "Built for AI shoppers",
    body: "Each stall is a live MCP server. Agents search products, create a PayPal checkout and confirm payment, using the same four tools our own shopping agent uses.",
    chips: [
      { label: "MCP endpoint", icon: PlugSocketIcon },
      { label: "Search and compare", icon: Search01Icon },
      { label: "Public tool API", icon: ApiIcon },
    ],
    cta: { label: "Watch an agent shop", href: routes.shop },
    tone: "sky",
    screen: <AgentsScreen />,
  },
  {
    id: "checkout",
    title: "PayPal does the money",
    body: "Agents create real itemized PayPal Orders v2 checkouts. Buyers approve in PayPal, so they stay in control. Kams captures the payment, and the agent never claims an order is paid before PayPal confirms it.",
    chips: [
      { label: "Orders v2 checkout", icon: Coins01Icon },
      { label: "Buyer approval", icon: CheckListIcon },
      { label: "AI shopper chat", icon: AiChat02Icon },
    ],
    cta: { label: "Try the AI shopper", href: routes.shop },
    tone: "lime",
    screen: <ShopperScreen />,
  },
  {
    id: "dashboard",
    title: "A dashboard you can run from a market stall",
    body: "See what agents searched for and what they bought. Track PayPal fees and what you actually keep, and refund a buyer in one click.",
    chips: [
      { label: "Live agent activity", icon: Analytics01Icon },
      { label: "Orders and payouts", icon: ShoppingBag01Icon },
      { label: "One-click refunds", icon: ArrowTurnBackwardIcon },
    ],
    cta: { label: "Open your stall", href: routes.start },
    tone: "pink",
    screen: <OrdersScreen />,
  },
];

export function Layers() {
  return (
    <section data-reveal className="mx-auto mt-24 max-w-[1200px] px-5 lg:mt-[120px] xl:px-0">
      <h2 className="font-display lg:text-h2 max-w-[820px] text-[36px] leading-[1.2] font-medium text-balance">
        Everything a small seller needs to sell to AI
      </h2>
      <div className="mt-10 flex flex-col gap-10">
        <StackedCards anchors={features.map((feature) => feature.id)}>
          {features.map((feature) => (
            <FeatureBlock key={feature.id} feature={feature} />
          ))}
        </StackedCards>
      </div>
    </section>
  );
}
