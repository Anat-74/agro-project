import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";

export default defineMcpTool({
  description: "Add product to shopping cart",
  inputSchema: z.object({
    productId: z.string(),
    quantity: z.number().min(1).default(1),
    userId: z.string().optional(),
  }),
  handler: async ({ productId, quantity, userId }) => {
    // TODO: Implement actual cart logic
    return { success: true, productId, quantity };
  },
});