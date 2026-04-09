import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";

export default defineMcpTool({
  description: "Remove product from shopping cart",
  inputSchema: z.object({
    productId: z.string(),
    removeAll: z.boolean().default(false),
  }),
  handler: async ({ productId, removeAll }: { productId: string; removeAll: boolean }) => {
    return {
      success: true,
      instruction: {
        type: 'remove_from_cart',
        data: {
          productId,
          removeAll,
        }
      },
      message: `Инструкция для удаления товара ${productId} из корзины создана`
    };
  },
});