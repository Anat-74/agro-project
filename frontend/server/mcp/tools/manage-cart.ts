import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";

export default defineMcpTool({
  description: "Manage shopping cart (clear, update quantities, etc.)",
  inputSchema: z.object({
    action: z.enum(["clear", "update_quantity", "apply_coupon", "calculate_totals"]),
    productId: z.string().optional(),
    quantity: z.number().min(0).optional(),
    couponCode: z.string().optional(),
  }),
  handler: async ({ action, productId, quantity, couponCode: _couponCode }: { action: "clear" | "update_quantity" | "apply_coupon" | "calculate_totals"; productId?: string; quantity?: number; couponCode?: string }) => {
    switch (action) {
      case "clear":
        return {
          success: true,
          instruction: {
            type: 'clear_cart'
          },
          message: "Инструкция для очистки корзины создана"
        };
        
      case "update_quantity":
        if (!productId || quantity === undefined) {
          return { 
            success: false, 
            error: "productId and quantity are required for update_quantity action" 
          };
        }
        
        return {
          success: true,
          instruction: {
            type: 'update_cart_quantity',
            data: { productId, quantity }
          },
          message: `Инструкция для обновления количества товара ${productId} создана`
        };
        
      default:
        return {
          success: true,
          message: `Действие ${action} обработано (заглушка)`
        };
    }
  },
});