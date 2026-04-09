import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";

export default defineMcpTool({
  description: "Add product to shopping cart",
  inputSchema: z.object({
    productId: z.string(),
    quantity: z.number().min(1).default(1),
    categorySlug: z.string().optional(),
    subcategorySlug: z.string().optional(),
  }),
  handler: async ({ productId, quantity, categorySlug, subcategorySlug }: { productId: string; quantity: number; categorySlug?: string; subcategorySlug?: string }) => {
    // Этот инструмент просто возвращает инструкцию для клиента
    // Реальное добавление в корзину происходит на клиенте
    return {
      success: true,
      instruction: {
        type: 'add_to_cart',
        data: {
          productId,
          quantity,
          categorySlug,
          subcategorySlug,
        }
      },
      message: `Инструкция для добавления товара ${productId} в корзину создана`
    };
  },
});