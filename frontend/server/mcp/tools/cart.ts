import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";

export default defineMcpTool({
  description: "Get items from the shopping cart",
  inputSchema: z.object({
    userId: z.string().optional(),
  }),
  handler: async ({ userId }) => {
    // TODO: Implement actual cart logic
    return { items: [] };
  },
});