import type { NextConfig } from "next";

// The Express API (PayPal, Bedrock, MCP) runs alongside Next. In dev and prod Next proxies to it.
const api = process.env.API_ORIGIN || "http://localhost:3000";

const config: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return ["/api/:path*", "/mcp", "/mcp/:path*", "/paypal/:path*", "/uploads/:path*"].map((source) => ({
      source,
      destination: `${api}${source}`,
    }));
  },
};

export default config;
