import { AiChat02Icon, Camera01Icon, PlugSocketIcon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { AgentsScreen, OrdersScreen, ShopperScreen, SnapScreen } from "./screens/kams-screens";

export const showcaseTabs = [
  { key: "snap", label: "Snap to store", icon: Camera01Icon, Screen: SnapScreen },
  { key: "shopper", label: "AI shopper", icon: AiChat02Icon, Screen: ShopperScreen },
  { key: "orders", label: "Seller dashboard", icon: ShoppingBag01Icon, Screen: OrdersScreen },
  { key: "agents", label: "Agent endpoint", icon: PlugSocketIcon, Screen: AgentsScreen },
] as const;
