import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";
import { searchProducts } from "../../utils/product-search";

export default defineMcpTool({
  description: "Search products by name, category, or other criteria",
  inputSchema: z.object({
    query: z.string().optional(),
    category: z.string().optional(),
    limit: z.number().min(1).max(20).default(5),
  }),
  handler: async ({ query, category, limit }: { query?: string; category?: string; limit: number }) => {
    return await searchProducts(query, category, limit);
  },
});