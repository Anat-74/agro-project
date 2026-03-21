import { z } from "zod";

export default defineMcpTool({
  name: "cart_operations",
  description:
    "Операции с корзиной покупок. Добавление, удаление, просмотр товаров в корзине.",
  inputSchema: {
    operation: z
      .enum(["add", "remove", "update", "get", "clear"])
      .describe("Тип операции с корзиной"),
    productId: z
      .string()
      .optional()
      .describe("ID продукта (для add/remove/update)"),
    quantity: z
      .number()
      .min(1)
      .max(99)
      .optional()
      .default(1)
      .describe("Количество товара (для add/update)"),
  },
  handler: async ({ operation, productId, quantity }) => {
    try {
      // Mock данные корзины (в реальном приложении здесь была бы работа с базой данных)
      const mockCart = {
        id: "cart_123",
        items: [
          { id: "item_1", name: "Яблоки", price: 300, quantity: 2, total: 600 },
          {
            id: "item_2",
            name: "Картофель",
            price: 150,
            quantity: 5,
            total: 750,
          },
          {
            id: "item_3",
            name: "Морковь",
            price: 200,
            quantity: 3,
            total: 600,
          },
        ],
        currency: "RUB",
      };

      switch (operation) {
        case "get": {
          const totalItems = mockCart.items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          const totalPrice = mockCart.items.reduce(
            (sum, item) => sum + item.total,
            0,
          );

          return {
            content: [
              {
                type: "text",
                text: `В корзине ${totalItems} товаров на сумму ${totalPrice} ${mockCart.currency}`,
              },
              {
                type: "text",
                text: JSON.stringify(
                  {
                    cartId: mockCart.id,
                    items: mockCart.items,
                    totalItems,
                    totalPrice,
                    currency: mockCart.currency,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        case "add": {
          if (!productId) {
            return {
              content: [
                {
                  type: "text",
                  text: "Для добавления товара укажите productId",
                },
              ],
              isError: true,
            };
          }

          // В реальном приложении здесь был бы запрос к Strapi для получения информации о товаре
          const newItem = {
            id: productId,
            name: `Товар ${productId}`,
            price: 1000, // Примерная цена
            quantity: quantity || 1,
            total: 1000 * (quantity || 1),
          };

          // Добавляем товар в mock корзину
          mockCart.items.push(newItem);
          const newTotalItems = mockCart.items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          const newTotalPrice = mockCart.items.reduce(
            (sum, item) => sum + item.total,
            0,
          );

          return {
            content: [
              {
                type: "text",
                text: `Товар ${productId} добавлен в корзину (количество: ${quantity || 1})`,
              },
              {
                type: "text",
                text: `Текущее количество товаров в корзине: ${newTotalItems}, общая сумма: ${newTotalPrice} ${mockCart.currency}`,
              },
            ],
          };
        }

        case "remove": {
          if (!productId) {
            return {
              content: [
                {
                  type: "text",
                  text: "Для удаления товара укажите productId",
                },
              ],
              isError: true,
            };
          }

          // Удаляем товар из mock корзины
          const initialLength = mockCart.items.length;
          mockCart.items = mockCart.items.filter(
            (item) => item.id !== productId,
          );
          const removed = initialLength > mockCart.items.length;

          return {
            content: [
              {
                type: "text",
                text: removed
                  ? `Товар ${productId} удален из корзины`
                  : `Товар ${productId} не найден в корзине`,
              },
            ],
          };
        }

        case "update": {
          if (!productId || !quantity) {
            return {
              content: [
                {
                  type: "text",
                  text: "Для обновления товара укажите productId и quantity",
                },
              ],
              isError: true,
            };
          }

          // Обновляем количество товара в mock корзине
          const item = mockCart.items.find((item) => item.id === productId);
          if (!item) {
            return {
              content: [
                {
                  type: "text",
                  text: `Товар ${productId} не найден в корзине`,
                },
              ],
              isError: true,
            };
          }

          item.quantity = quantity;
          item.total = item.price * quantity;

          return {
            content: [
              {
                type: "text",
                text: `Количество товара ${productId} обновлено до ${quantity}`,
              },
            ],
          };
        }

        case "clear": {
          const clearedCount = mockCart.items.length;
          mockCart.items = [];

          return {
            content: [
              {
                type: "text",
                text: `Корзина очищена. Удалено ${clearedCount} товаров.`,
              },
            ],
          };
        }

        default: {
          return {
            content: [
              {
                type: "text",
                text: `Неизвестная операция: ${operation}`,
              },
            ],
            isError: true,
          };
        }
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Ошибка: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
});
