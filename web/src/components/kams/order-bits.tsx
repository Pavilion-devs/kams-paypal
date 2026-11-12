import {
  AiChat02Icon,
  Alert02Icon,
  ArrowTurnBackwardIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  PlugSocketIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { StatusChip } from "@/components/ui/status-chip";
import type { Channel, OrderStatus } from "@/lib/api";

const statusMap: Record<OrderStatus, { label: string; tone: "lime" | "amber" | "pink" | "faint"; icon: typeof Clock01Icon }> = {
  PAID: { label: "Paid", tone: "lime", icon: CheckmarkCircle02Icon },
  AWAITING_APPROVAL: { label: "Awaiting approval", tone: "amber", icon: Clock01Icon },
  CREATED: { label: "Created", tone: "amber", icon: Clock01Icon },
  REFUNDED: { label: "Refunded", tone: "pink", icon: ArrowTurnBackwardIcon },
  CANCELLED: { label: "Cancelled", tone: "faint", icon: Cancel01Icon },
};

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const s = statusMap[status] ?? { label: status, tone: "faint", icon: Alert02Icon };
  return <StatusChip label={s.label} tone={s.tone} icon={s.icon} />;
}

export const channelMeta: Record<Channel, { label: string; icon: typeof Store01Icon }> = {
  "ai-shopper": { label: "Kams AI shopper", icon: AiChat02Icon },
  mcp: { label: "External agent (MCP)", icon: PlugSocketIcon },
  storefront: { label: "Storefront", icon: Store01Icon },
};

export const channelLabel = (c: Channel) => channelMeta[c]?.label ?? c;
