import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";

const inputSchema = z.object({
  productId: z.string(),
  removeAll: z.boolean().default(false),
});

type Input = z.infer<typeof inputSchema>;

export default defineMcpTool({
  description: "Remove product from shopping cart",
  inputSchema: inputSchema.shape,
  handler: async ({ productId, removeAll }: Input) => {
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