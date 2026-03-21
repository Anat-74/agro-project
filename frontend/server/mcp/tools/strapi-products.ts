import { z } from "zod";

export default defineMcpTool({
  name: "strapi_products",
  description:
    "Операции с продуктами в Strapi. Поиск, фильтрация, получение информации о продуктах.",
  inputSchema: {
    operation: z
      .enum(["search", "get_by_id", "get_by_category", "get_featured"])
      .describe("Тип операции"),
    query: z.string().optional().describe("Поисковый запрос"),
    category: z.string().optional().describe("Категория продукта"),
    productId: z.string().optional().describe("ID продукта"),
    limit: z.number().optional().default(10).describe("Лимит результатов"),
  },
  handler: async ({ operation, query, category, productId, limit }) => {
    try {
      // Mock данные продуктов (в реальном приложении здесь был бы запрос к Strapi)
      const mockProducts = [
        {
          id: "prod_1",
          name: "Свежие яблоки",
          description: "Свежие яблоки из местного сада",
          price: 300,
          discountPrice: 250,
          currency: "RUB",
          category: "Фрукты",
          subcategory: "Яблоки",
          inStock: true,
          stockQuantity: 150,
          imageUrl: "/images/products/apples.jpg",
          rating: 4.5,
        },
        {
          id: "prod_2",
          name: "Картофель молодой",
          description: "Молодой картофель нового урожая",
          price: 150,
          discountPrice: null,
          currency: "RUB",
          category: "Овощи",
          subcategory: "Картофель",
          inStock: true,
          stockQuantity: 500,
          imageUrl: "/images/products/potatoes.jpg",
          rating: 4.2,
        },
        {
          id: "prod_3",
          name: "Морковь свежая",
          description: "Свежая морковь с фермы",
          price: 200,
          discountPrice: 180,
          currency: "RUB",
          category: "Овощи",
          subcategory: "Морковь",
          inStock: true,
          stockQuantity: 300,
          imageUrl: "/images/products/carrots.jpg",
          rating: 4.7,
        },
        {
          id: "prod_4",
          name: "Помидоры черри",
          description: "Сладкие помидоры черри",
          price: 400,
          discountPrice: 350,
          currency: "RUB",
          category: "Овощи",
          subcategory: "Помидоры",
          inStock: false,
          stockQuantity: 0,
          imageUrl: "/images/products/tomatoes.jpg",
          rating: 4.8,
        },
        {
          id: "prod_5",
          name: "Бананы",
          description: "Спелые бананы из Эквадора",
          price: 250,
          discountPrice: null,
          currency: "RUB",
          category: "Фрукты",
          subcategory: "Бананы",
          inStock: true,
          stockQuantity: 200,
          imageUrl: "/images/products/bananas.jpg",
          rating: 4.3,
        },
      ];

      switch (operation) {
        case "search": {
          if (!query) {
            return {
              content: [
                {
                  type: "text",
                  text: "Для поиска укажите query",
                },
              ],
              isError: true,
            };
          }

          const searchResults = mockProducts
            .filter(
              (product) =>
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.description
                  .toLowerCase()
                  .includes(query.toLowerCase()) ||
                product.category.toLowerCase().includes(query.toLowerCase()),
            )
            .slice(0, limit || 10);

          return {
            content: [
              {
                type: "text",
                text: `Найдено ${searchResults.length} продуктов по запросу "${query}":`,
              },
              {
                type: "text",
                text: JSON.stringify(searchResults, null, 2),
              },
            ],
          };
        }

        case "get_by_id": {
          if (!productId) {
            return {
              content: [
                {
                  type: "text",
                  text: "Для получения продукта укажите productId",
                },
              ],
              isError: true,
            };
          }

          const product = mockProducts.find((p) => p.id === productId);

          if (!product) {
            return {
              content: [
                {
                  type: "text",
                  text: `Продукт с ID ${productId} не найден`,
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `Информация о продукте "${product.name}":`,
              },
              {
                type: "text",
                text: JSON.stringify(product, null, 2),
              },
            ],
          };
        }

        case "get_by_category": {
          if (!category) {
            return {
              content: [
                {
                  type: "text",
                  text: "Для фильтрации по категории укажите category",
                },
              ],
              isError: true,
            };
          }

          const categoryResults = mockProducts
            .filter(
              (product) =>
                product.category.toLowerCase() === category.toLowerCase(),
            )
            .slice(0, limit || 10);

          return {
            content: [
              {
                type: "text",
                text: `Найдено ${categoryResults.length} продуктов в категории "${category}":`,
              },
              {
                type: "text",
                text: JSON.stringify(categoryResults, null, 2),
              },
            ],
          };
        }

        case "get_featured": {
          const featuredProducts = mockProducts
            .filter(
              (product) =>
                product.discountPrice !== null || product.rating >= 4.5,
            )
            .slice(0, limit || 10);

          return {
            content: [
              {
                type: "text",
                text: `Найдено ${featuredProducts.length} рекомендуемых продуктов:`,
              },
              {
                type: "text",
                text: JSON.stringify(featuredProducts, null, 2),
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
