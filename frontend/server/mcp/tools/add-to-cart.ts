import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";

const inputSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1).default(1),
  categorySlug: z.string().optional(),
  subcategorySlug: z.string().optional(),
});

type Input = z.infer<typeof inputSchema>;

export default defineMcpTool({
  description: "Add product to shopping cart",
  inputSchema: inputSchema.shape,
  handler: async ({ productId, quantity, categorySlug, subcategorySlug }: Input) => {
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