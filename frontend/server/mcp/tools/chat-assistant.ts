import { z } from "zod";

export default defineMcpTool({
  name: "chat_assistant",
  description:
    "Инструменты для AI-ассистента чата. Предоставляет доступ к информации о продуктах, корзине и другим функциям проекта.",
  inputSchema: {
    action: z
      .enum([
        "get_product_info",
        "search_products",
        "get_cart_status",
        "get_delivery_info",
        "get_payment_methods",
        "get_faq",
        "clear_chat_history",
      ])
      .describe("Действие для выполнения"),
    query: z
      .string()
      .optional()
      .describe("Поисковый запрос для поиска продуктов"),
    productId: z
      .string()
      .optional()
      .describe("ID продукта для получения информации"),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe("Лимит результатов поиска"),
  },
  handler: async ({ action, query, productId, limit }) => {
    try {
      switch (action) {
        case "get_product_info": {
          if (!productId) {
            return {
              content: [
                {
                  type: "text",
                  text: "Необходимо указать productId",
                },
              ],
              isError: true,
            };
          }

          // Здесь можно интегрировать с Strapi API
          // Для примера возвращаем mock данные
          const product = {
            id: productId,
            name: "Пример продукта",
            description: "Высококачественный сельскохозяйственный продукт",
            price: 1500,
            currency: "RUB",
            category: "Овощи",
            inStock: true,
            stockQuantity: 100,
            imageUrl: "/images/products/example.jpg",
          };

          return {
            content: [
              {
                type: "text",
                text: `Информация о продукте ${productId}: ${JSON.stringify(product, null, 2)}`,
              },
            ],
          };
        }

        case "search_products": {
          if (!query) {
            return {
              content: [
                {
                  type: "text",
                  text: "Необходимо указать поисковый запрос",
                },
              ],
              isError: true,
            };
          }

          // Здесь можно интегрировать с Strapi API для поиска
          // Для примера возвращаем mock данные
          const mockProducts = Array.from({ length: limit || 5 }, (_, i) => ({
            id: `prod_${i + 1}`,
            name: `${query} продукт ${i + 1}`,
            description: `Описание продукта по запросу "${query}"`,
            price: 500 + i * 200,
            currency: "RUB",
            category: i % 2 === 0 ? "Овощи" : "Фрукты",
            inStock: true,
          }));

          return {
            content: [
              {
                type: "text",
                text: `Найдено ${mockProducts.length} продуктов по запросу "${query}": ${JSON.stringify(mockProducts, null, 2)}`,
              },
            ],
          };
        }

        case "get_cart_status": {
          // Здесь можно интегрировать с корзиной пользователя
          const cartData = {
            cartId: "cart_123",
            items: [
              { id: "item_1", name: "Яблоки", quantity: 2, price: 300 },
              { id: "item_2", name: "Картофель", quantity: 5, price: 150 },
            ],
            totalItems: 2,
            totalPrice: 1350,
            currency: "RUB",
          };

          return {
            content: [
              {
                type: "text",
                text: `В вашей корзине 2 товара на сумму 1350 RUB: ${JSON.stringify(cartData, null, 2)}`,
              },
            ],
          };
        }

        case "get_delivery_info": {
          const deliveryMethods = [
            {
              type: "courier",
              name: "Курьерская доставка",
              description: "Доставка курьером по Москве и области",
              price: 300,
              minDeliveryTime: "1-2 дня",
              maxDeliveryTime: "3-5 дней",
            },
            {
              type: "pickup",
              name: "Самовывоз",
              description: "Самовывоз из нашего склада",
              price: 0,
              minDeliveryTime: "Сегодня",
              maxDeliveryTime: "Завтра",
            },
            {
              type: "post",
              name: "Почта России",
              description: "Доставка почтой по всей России",
              price: 500,
              minDeliveryTime: "5-7 дней",
              maxDeliveryTime: "10-14 дней",
            },
          ];

          return {
            content: [
              {
                type: "text",
                text: `Доступные способы доставки: ${JSON.stringify(deliveryMethods, null, 2)}`,
              },
            ],
          };
        }

        case "get_payment_methods": {
          const paymentMethods = [
            {
              type: "card",
              name: "Банковская карта",
              description: "Оплата картой Visa/Mastercard/МИР",
              available: true,
            },
            {
              type: "cash",
              name: "Наличные",
              description: "Оплата наличными при получении",
              available: true,
            },
            {
              type: "online",
              name: "Онлайн-платежи",
              description: "СБП, ЮMoney, WebMoney",
              available: true,
            },
            {
              type: "invoice",
              name: "Безналичный расчет",
              description: "Для юридических лиц",
              available: true,
            },
          ];

          return {
            content: [
              {
                type: "text",
                text: `Доступные способы оплаты: ${JSON.stringify(paymentMethods, null, 2)}`,
              },
            ],
          };
        }

        case "get_faq": {
          const faqData = {
            categories: [
              {
                category: "Доставка",
                questions: [
                  {
                    question: "Как долго идет доставка?",
                    answer:
                      "Доставка по Москве занимает 1-2 рабочих дня, по России - 5-14 дней в зависимости от региона.",
                  },
                  {
                    question: "Есть ли бесплатная доставка?",
                    answer:
                      "Бесплатная доставка доступна при заказе от 5000 RUB по Москве.",
                  },
                ],
              },
              {
                category: "Оплата",
                questions: [
                  {
                    question: "Какие способы оплаты принимаются?",
                    answer:
                      "Мы принимаем банковские карты, наличные, онлайн-платежи и безналичный расчет для юрлиц.",
                  },
                ],
              },
              {
                category: "Продукты",
                questions: [
                  {
                    question: "Откуда продукты?",
                    answer:
                      "Продукты поставляются напрямую от проверенных фермерских хозяйств и производителей.",
                  },
                  {
                    question: "Есть ли сертификаты качества?",
                    answer:
                      "Да, все продукты имеют необходимые сертификаты качества и безопасности.",
                  },
                ],
              },
            ],
          };

          return {
            content: [
              {
                type: "text",
                text: `Часто задаваемые вопросы: ${JSON.stringify(faqData, null, 2)}`,
              },
            ],
          };
        }

        case "clear_chat_history": {
          // Здесь можно очистить историю чата в сессии
          return {
            content: [
              {
                type: "text",
                text: "История чата очищена",
              },
            ],
          };
        }

        default: {
          return {
            content: [
              {
                type: "text",
                text: `Неизвестное действие: ${action}`,
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
