import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";
import { searchProducts } from "../../utils/product-search";

const inputSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(20).default(5),
});

type Input = z.infer<typeof inputSchema>;

export default defineMcpTool({
  description: "Search products by name, category, or other criteria",
  inputSchema: inputSchema.shape,
  handler: async ({ query, category, limit }: Input) => {
    return await searchProducts(query, category, limit);
  },
});