import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";

export default defineMcpTool({
  description: "Remove product from shopping cart",
  inputSchema: z.object({
    productId: z.string(),
    userId: z.string().optional(),
  }),
  handler: async ({ productId, userId }) => {
    // TODO: Implement actual cart logic
    return { success: true, productId };
  },
});