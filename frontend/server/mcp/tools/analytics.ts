import { z } from "zod";

export default defineMcpTool({
  name: "analytics",
  description: "Аналитика и метрики проекта",
  inputSchema: {
    metric: z
      .enum(["overview", "products", "categories", "sales", "users"])
      .default("overview")
      .describe("Тип метрики"),
    period: z
      .enum(["today", "week", "month", "year", "all"])
      .default("month")
      .describe("Период анализа"),
    limit: z.number().min(1).max(50).default(10).describe("Лимит записей"),
  },
  handler: async ({ metric, period, limit }) => {
    try {
      // В реальном приложении здесь был бы запрос к базе данных или аналитическому сервису
      // Для демонстрации возвращаем примерные данные

      const now = new Date();
      const getDateRange = () => {
        switch (period) {
          case "today":
            return { start: new Date(now.setHours(0, 0, 0, 0)), end: now };
          case "week":
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - 7);
            return { start: weekStart, end: now };
          case "month":
            const monthStart = new Date(now);
            monthStart.setMonth(now.getMonth() - 1);
            return { start: monthStart, end: now };
          case "year":
            const yearStart = new Date(now);
            yearStart.setFullYear(now.getFullYear() - 1);
            return { start: yearStart, end: now };
          default:
            return { start: new Date(0), end: now };
        }
      };

      const dateRange = getDateRange();

      switch (metric) {
        case "overview":
          return {
            content: [
              {
                type: "text",
                text: `Обзор аналитики за период: ${period}`,
              },
              {
                type: "text",
                text: JSON.stringify(
                  {
                    period: {
                      start: dateRange.start.toISOString(),
                      end: dateRange.end.toISOString(),
                    },
                    metrics: {
                      totalProducts: 156,
                      totalCategories: 12,
                      totalSales: 2345,
                      totalRevenue: 1256700,
                      activeUsers: 456,
                      conversionRate: 2.3,
                      averageOrderValue: 5400,
                    },
                    trends: {
                      salesGrowth: 15.2,
                      revenueGrowth: 18.7,
                      userGrowth: 8.3,
                    },
                  },
                  null,
                  2,
                ),
              },
            ],
          };

        case "products":
          return {
            content: [
              {
                type: "text",
                text: `Топ ${limit} товаров за ${period}`,
              },
              {
                type: "text",
                text: JSON.stringify(
                  {
                    topProducts: Array.from({ length: limit }, (_, i) => ({
                      id: i + 1,
                      name: `Товар ${i + 1}`,
                      sales: Math.floor(Math.random() * 1000),
                      revenue: Math.floor(Math.random() * 50000),
                      views: Math.floor(Math.random() * 5000),
                      conversion: (Math.random() * 5).toFixed(1),
                    })),
                  },
                  null,
                  2,
                ),
              },
            ],
          };

        case "categories":
          return {
            content: [
              {
                type: "text",
                text: `Аналитика по категориям за ${period}`,
              },
              {
                type: "text",
                text: JSON.stringify(
                  {
                    categories: [
                      {
                        name: "Семена",
                        sales: 450,
                        revenue: 225000,
                        growth: 12.5,
                      },
                      {
                        name: "Удобрения",
                        sales: 320,
                        revenue: 192000,
                        growth: 8.3,
                      },
                      {
                        name: "Техника",
                        sales: 89,
                        revenue: 2670000,
                        growth: 15.7,
                      },
                      {
                        name: "Запчасти",
                        sales: 210,
                        revenue: 1050000,
                        growth: 5.2,
                      },
                      {
                        name: "Средства защиты",
                        sales: 180,
                        revenue: 900000,
                        growth: 9.8,
                      },
                    ],
                  },
                  null,
                  2,
                ),
              },
            ],
          };

        case "sales":
          return {
            content: [
              {
                type: "text",
                text: `Аналитика продаж за ${period}`,
              },
              {
                type: "text",
                text: JSON.stringify(
                  {
                    salesData: {
                      totalOrders: 2345,
                      completedOrders: 2210,
                      pendingOrders: 135,
                      totalRevenue: 12567000,
                      averageOrderValue: 5400,
                      refundRate: 1.2,
                    },
                    dailySales: Array.from({ length: 30 }, (_, i) => ({
                      date: new Date(
                        Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
                      )
                        .toISOString()
                        .split("T")[0],
                      sales: Math.floor(Math.random() * 100) + 50,
                      revenue: Math.floor(Math.random() * 500000) + 250000,
                    })),
                  },
                  null,
                  2,
                ),
              },
            ],
          };

        case "users":
          return {
            content: [
              {
                type: "text",
                text: `Аналитика пользователей за ${period}`,
              },
              {
                type: "text",
                text: JSON.stringify(
                  {
                    userMetrics: {
                      totalUsers: 4567,
                      activeUsers: 1234,
                      newUsers: 234,
                      returningUsers: 1000,
                      averageSessionDuration: "4:32",
                      bounceRate: 32.5,
                    },
                    userSegments: [
                      { segment: "Новые", count: 234, growth: 15.2 },
                      { segment: "Постоянные", count: 1000, growth: 8.7 },
                      { segment: "VIP", count: 56, growth: 25.3 },
                      { segment: "Неактивные", count: 3277, growth: -2.1 },
                    ],
                  },
                  null,
                  2,
                ),
              },
            ],
          };

        default:
          return {
            content: [
              {
                type: "text",
                text: `Неизвестный тип метрики: ${metric}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Ошибка при получении аналитики: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
});
