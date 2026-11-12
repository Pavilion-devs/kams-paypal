// Illustrative sample data for the landing-page product previews (clearly labelled "Preview").
export const exampleProducts = [
  { title: "Handwoven raffia basket, 35 cm", price: "16.50", note: "₦25,000 → $16.50", tone: "bg-amber-soft", seconds: "6.4" },
  { title: "Adire indigo throw, cotton", price: "42.00", note: "Hand-dyed, 2 × 1.4 m", tone: "bg-sky-soft", seconds: "5.9" },
  { title: "Beaded statement necklace", price: "18.00", note: "Glass beads, handmade", tone: "bg-pink-soft", seconds: "7.1" },
  { title: "Leather sandals, size 42", price: "28.00", note: "Cowhide, hand-stitched", tone: "bg-lime-soft", seconds: "6.2" },
  { title: "Shea butter, 250 g jar", price: "9.00", note: "Unrefined, Grade A", tone: "bg-lilac-soft", seconds: "5.4" },
  { title: "Ankara tote bag", price: "22.00", note: "Lined, inner pocket", tone: "bg-amber-soft", seconds: "6.8" },
] as const;

export const exampleOrders = [
  { item: "Raffia basket", total: "16.50", via: "Claude (MCP)", status: "Paid", tone: "bg-lime-soft text-lime-ink" },
  { item: "Adire throw", total: "42.00", via: "Kams shopper", status: "Paid", tone: "bg-lime-soft text-lime-ink" },
  { item: "Beaded necklace × 2", total: "36.00", via: "ChatGPT (MCP)", status: "Awaiting approval", tone: "bg-amber-soft text-amber-ink" },
  { item: "Shea butter", total: "9.00", via: "Storefront", status: "Refunded", tone: "bg-pink-soft text-pink-ink" },
] as const;
