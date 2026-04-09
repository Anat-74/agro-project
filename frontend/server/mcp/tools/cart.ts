import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";

export default defineMcpTool({
  description: "Get items from the shopping cart",
  inputSchema: z.object({
    includeDetails: z.boolean().default(false),
  }),
  handler: async ({ includeDetails: _includeDetails }: { includeDetails: boolean }) => {
    try {
      // В серверном контексте мы не можем получить корзину напрямую
      // Возвращаем инструкцию для клиента или пустой результат
      // В реальном приложении здесь была бы работа с базой данных или сессией
      
      return {
        success: true,
        instruction: {
          type: 'show_cart'
        },
        message: "Для просмотра корзины требуется клиентский контекст"
      };
    } catch (error) {
      console.error("Error getting cart items via MCP", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});