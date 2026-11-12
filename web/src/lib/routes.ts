export const sections = {
  product: "product",
  howItWorks: "how-it-works",
  agents: "agents",
  faq: "faq",
} as const;

export const anchor = (id: string) => `/#${id}`;

export const routes = {
  home: "/",
  start: "/new",
  shop: "/shop",
  stall: (slug: string) => `/s/${slug}`,
  stallShop: (slug: string) => `/s/${slug}/shop`,
  dashboard: (slug: string) => `/dashboard/${slug}`,
  dashboardOrders: (slug: string) => `/dashboard/${slug}/orders`,
  dashboardProducts: (slug: string) => `/dashboard/${slug}/products`,
  dashboardAgents: (slug: string) => `/dashboard/${slug}/agents`,
} as const;
