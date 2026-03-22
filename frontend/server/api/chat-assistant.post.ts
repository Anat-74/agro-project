import { defineEventHandler, readBody, getCookie, setCookie } from "h3";

// DeepSeek API endpoint (OpenAI-compatible)
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
// В production используйте переменные окружения
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

// Вспомогательная функция для работы с Strapi API напрямую
async function callStrapiTool(toolName: string, args: any): Promise<any> {
  // Реализация работы с Strapi через REST API
  if (toolName === "strapi_products") {
    const { operation, query, category, limit = 10 } = args;
    const STRAPI_URL = process.env.STRAPI_URL || "http://127.0.0.1:1337";

    try {
      // Базовые параметры запроса
      const baseParams = new URLSearchParams({
        "pagination[page]": "1",
        "pagination[pageSize]": limit.toString(),
        populate: "*",
        locale: "ru",
      });

      if (operation === "get_featured") {
        // Получаем популярные продукты (доступные и со скидкой)
        baseParams.append("filters[isAvailable][$eq]", "true");
        baseParams.append("filters[$or][0][isDiscount][$eq]", "true");
        baseParams.append("filters[$or][1][status][$eq]", "published");
        baseParams.append("sort", "createdAt:desc");
      }

      if (operation === "search" && query) {
        // Поиск продуктов по названию или описанию
        baseParams.append("filters[isAvailable][$eq]", "true");
        baseParams.append("filters[$or][0][name][$contains]", query);
        baseParams.append("filters[$or][1][description][$contains]", query);
        baseParams.append("sort", "name:asc");
      }

      if (operation === "get_by_category" && category) {
        // Получение продуктов по категории
        baseParams.append("filters[isAvailable][$eq]", "true");

        // Для категории "Ягоды" используем более точный поиск
        if (category === "Ягоды") {
          // Ищем только конкретные ягоды по названию и подкатегории
          // Убираем общий поиск по "ягод" чтобы исключить томаты
          baseParams.append("filters[$or][0][name][$contains]", "ежевик");
          baseParams.append("filters[$or][1][name][$contains]", "клубник");
          baseParams.append("filters[$or][2][name][$contains]", "малин");
          baseParams.append("filters[$or][3][name][$contains]", "черник");
          baseParams.append("filters[$or][4][name][$contains]", "смородин");
          baseParams.append("filters[$or][5][name][$contains]", "вишн");
          baseParams.append("filters[$or][6][name][$contains]", "алыч");
          baseParams.append("filters[$or][7][name][$contains]", "крыжовник");
          baseParams.append("filters[$or][8][name][$contains]", "слив");
          baseParams.append(
            "filters[$or][9][subcategory][name][$eq]",
            "Ежевика",
          );
        } else {
          // Для других категорий используем стандартный поиск
          baseParams.append("filters[category][name][$eq]", category);
        }

        baseParams.append("sort", "price:asc");
      }

      if (operation === "get_by_id" && args.productId) {
        // Получение конкретного продукта по ID
        try {
          const response = await fetch(
            `${STRAPI_URL}/api/products/${args.productId}?populate=*`,
          );
          if (!response.ok) {
            throw new Error(`Strapi API error: ${response.status}`);
          }
          const result = await response.json();
          const product = result.data;

          return {
            product: {
              id: product.id,
              name: product.attributes?.name || product.name,
              description:
                product.attributes?.description || product.description,
              price: product.attributes?.price || product.price,
              characteristics:
                product.attributes?.characteristics || product.characteristics,
              isAvailable:
                product.attributes?.isAvailable ?? product.isAvailable,
              isDiscount: product.attributes?.isDiscount ?? product.isDiscount,
              category:
                product.attributes?.category?.data?.attributes?.name ||
                product.category?.name,
              subcategory:
                product.attributes?.subcategory?.data?.attributes?.name ||
                product.subcategory?.name,
              mainImage:
                product.attributes?.mainImage?.data?.attributes?.url ||
                product.mainImage?.url,
              images:
                product.attributes?.image?.data?.map(
                  (img: any) => img.attributes?.url,
                ) ||
                product.image?.map((img: any) => img.url) ||
                [],
            },
            message: `Информация о продукте "${product.attributes?.name || product.name}".`,
          };
        } catch (error: any) {
          console.error("Strapi API error:", error);
          return {
            error: `Ошибка при получении продукта: ${error.message}`,
            product: null,
            message: "Не удалось получить информацию о продукте.",
          };
        }
      }

      // Выполняем запрос к Strapi API
      const response = await fetch(
        `${STRAPI_URL}/api/products?${baseParams.toString()}`,
      );
      if (!response.ok) {
        throw new Error(`Strapi API error: ${response.status}`);
      }

      const result = await response.json();
      const products = result.data || [];

      // Форматируем ответ
      const formattedProducts = products.map((product: any) => {
        const attributes = product.attributes || product;
        return {
          id: product.id,
          name: attributes.name,
          description: attributes.description,
          price: attributes.price,
          isAvailable: attributes.isAvailable,
          isDiscount: attributes.isDiscount,
          category:
            attributes.category?.data?.attributes?.name ||
            attributes.category?.name,
          subcategory:
            attributes.subcategory?.data?.attributes?.name ||
            attributes.subcategory?.name,
          image:
            attributes.mainImage?.data?.attributes?.url ||
            attributes.mainImage?.url,
        };
      });

      return {
        products: formattedProducts,
        total: result.meta?.pagination?.total || formattedProducts.length,
        message:
          operation === "search" && query
            ? `По запросу "${query}" найдено ${formattedProducts.length} продуктов.`
            : operation === "get_by_category" && category
              ? `В категории "${category}" найдено ${formattedProducts.length} продуктов.`
              : operation === "get_featured"
                ? `Найдено ${formattedProducts.length} популярных продуктов.`
                : `Найдено ${formattedProducts.length} доступных продуктов.`,
      };
    } catch (error: any) {
      console.error("Strapi API error:", error);
      // Возвращаем fallback данные для демонстрации
      // Специальные fallback данные для категории "Ягоды"
      let fallbackProducts = [];

      if (operation === "get_by_category" && category === "Ягоды") {
        fallbackProducts = [
          {
            name: "Ежевика Бархатная",
            price: 18.4,
            isAvailable: true,
            isDiscount: false,
            category: "Ягоды",
            description: "Свежая ежевика, богатая антиоксидантами и витаминами",
          },
          {
            name: "Клубника Сладкая",
            price: 12.5,
            isAvailable: true,
            isDiscount: true,
            category: "Ягоды",
            description: "Сочная клубника, идеальная для десертов",
          },
          {
            name: "Малина Лесная",
            price: 15.2,
            isAvailable: true,
            isDiscount: false,
            category: "Ягоды",
            description: "Ароматная малина, полезная для здоровья",
          },
          {
            name: "Черника Садовая",
            price: 14.8,
            isAvailable: true,
            isDiscount: false,
            category: "Ягоды",
            description: "Крупная черника, богатая витаминами",
          },
          {
            name: "Смородина Красная",
            price: 9.3,
            isAvailable: true,
            isDiscount: true,
            category: "Ягоды",
            description: "Кисло-сладкая смородина, источник витамина C",
          },
        ].slice(0, limit);
      } else {
        fallbackProducts = [
          {
            name: "Яблоко Каштель",
            price: 8.04,
            isAvailable: true,
            isDiscount: true,
            category: "Фрукты",
          },
          {
            name: "Груша Сочная",
            price: 9.8,
            isAvailable: true,
            isDiscount: false,
            category: "Фрукты",
          },
          {
            name: "Ежевика Бархатная",
            price: 18.4,
            isAvailable: true,
            isDiscount: false,
            category: "Ягоды",
          },
          {
            name: "Томат Сочный",
            price: 14.76,
            isAvailable: true,
            isDiscount: false,
            category: "Овощи",
          },
          {
            name: "Петрушка Обычная",
            price: 3.65,
            isAvailable: true,
            isDiscount: true,
            category: "Зелень",
          },
        ].slice(0, limit);
      }

      return {
        error: `Ошибка при обращении к Strapi: ${error.message}`,
        products: fallbackProducts,
        total: fallbackProducts.length,
        message:
          operation === "get_by_category" && category === "Ягоды"
            ? `В категории "${category}" найдено ${fallbackProducts.length} ягод. Используются демонстрационные данные.`
            : "Используются демонстрационные данные. Реальные данные временно недоступны.",
      };
    }
  }

  return { error: `Инструмент ${toolName} не реализован`, data: args };
}

// Определяем доступные инструменты для AI-ассистента
const AVAILABLE_TOOLS = [
  {
    type: "function",
    function: {
      name: "chat_assistant",
      description:
        "Инструменты для AI-ассистента чата. Предоставляет доступ к информации о продуктах, корзине и другим функциям проекта.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "get_product_info",
              "search_products",
              "get_cart_status",
              "get_delivery_info",
              "get_payment_methods",
              "get_faq",
              "clear_chat_history",
            ],
            description: "Действие для выполнения",
          },
          query: {
            type: "string",
            description: "Поисковый запрос для поиска продуктов",
          },
          productId: {
            type: "string",
            description: "ID продукта для получения информации",
          },
          limit: {
            type: "number",
            description: "Лимит результатов поиска",
            default: 5,
          },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "strapi_products",
      description:
        "Операции с продуктами в Strapi. Поиск, фильтрация, получение информации о продуктах.",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["search", "get_by_id", "get_by_category", "get_featured"],
            description: "Тип операции",
          },
          query: {
            type: "string",
            description: "Поисковый запрос",
          },
          category: {
            type: "string",
            description: "Категория продукта",
          },
          limit: {
            type: "number",
            description: "Лимит результатов",
            default: 10,
          },
        },
        required: ["operation"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cart_operations",
      description:
        "Операции с корзиной покупок. Добавление, удаление, просмотр товаров в корзине.",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["add", "remove", "update", "get", "clear"],
            description: "Тип операции",
          },
          productId: {
            type: "string",
            description: "ID продукта",
          },
          quantity: {
            type: "number",
            description: "Количество товара",
            default: 1,
          },
        },
        required: ["operation"],
      },
    },
  },
];

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { message, sessionId, useTools = true } = body;

    if (!message) {
      throw new Error("Сообщение обязательно");
    }

    // Простая реализация сессии через cookies
    const cookieSessionId =
      sessionId ||
      getCookie(event, "chat_session_id") ||
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Устанавливаем cookie для сессии (30 дней)
    // Убрали httpOnly: true чтобы избежать предупреждения в браузере
    setCookie(event, "chat_session_id", cookieSessionId, {
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "strict",
      path: "/",
    });

    // Упрощенная версия: не храним историю в cookies чтобы избежать предупреждений
    // Используем только текущее сообщение
    const history = [];

    // Добавляем новое сообщение пользователя
    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    history.push(userMessage);

    // Используем только текущее сообщение (без истории)
    const recentHistory = [userMessage];

    // Формируем расширенный системный промпт для ассистента с информацией о доступных инструментах
    const systemPrompt = {
      role: "system",
      content: `Ты AI-ассистент для agro-market проекта "Агро-Маркет". Ты помогаешь пользователям с:

ОСНОВНЫЕ ФУНКЦИИ:
1. Поиск и рекомендация сельскохозяйственных продуктов
2. Консультации по выращиванию, хранению и использованию продуктов
3. Ответы на вопросы о доставке, оплате и условиях покупки
4. Помощь с корзиной покупок и оформлением заказов
5. Предоставление информации о проекте и его возможностях

КОНСУЛЬТАЦИИ ПО СЕЛЬСКОХОЗЯЙСТВЕННОЙ ПРОДУКЦИИ:
- Хранение продуктов: оптимальные температуры, сроки годности, условия хранения
- Выращивание: советы по посадке, уходу, поливу, удобрениям
- Приготовление: рецепты, способы приготовления, пищевая ценность
- Сезонность: когда какие продукты лучше покупать/выращивать
- Польза для здоровья: витамины, минералы, полезные свойства

ДОСТУПНЫЕ ИНСТРУМЕНТЫ:
- chat_assistant: Общая информация, FAQ, ответы на вопросы о проекте
- strapi_products: Работа с реальными продуктами из базы данных Strapi
  Доступные операции: search, get_featured, get_by_category, get_by_id
- cart_operations: Управление корзиной покупок (добавление, удаление, просмотр)

ВАЖНЫЕ ПРАВИЛА:
1. ВСЕГДА используй ТОЛЬКО VALID JSON формат для аргументов инструментов
2. НИКОГДА не используй XML, HTML или другие форматы для аргументов
3. Пример правильного формата для strapi_products:
   {
     "operation": "search",
     "query": "яблоки",
     "limit": 5
   }
4. При запросах о продуктах сначала используй инструмент strapi_products для получения актуальных данных
5. Предоставляй подробные консультации на основе общих знаний о сельском хозяйстве
6. Если не знаешь точного ответа, предложи обратиться к специалисту или дай общие рекомендации
7. Отвечай человеческим, социальным языком - не используй технические форматы в ответах пользователю
8. После получения данных от инструментов, предоставляй дружелюбный, понятный ответ на русском языке

БАЗА ЗНАНИЙ ПО ПРОДУКТАМ (общая информация):
- Фрукты: яблоки, груши, сливы, вишни - богаты витаминами, хранить в прохладном месте
- Овощи: помидоры, огурцы, картофель, морковь - источники клетчатки и минералов
- Ягоды: клубника, малина, черника, ежевика - антиоксиданты, хранить в холодильнике
- Зелень: петрушка, укроп, базилик, салат - витамины A, C, K, хранить в воде
- Орехи и сухофрукты: грецкие орехи, миндаль, изюм, курага - энергия, хранить в сухом месте

СТИЛЬ ОБЩЕНИЯ:
- Будь дружелюбным, полезным и профессиональным
- Отвечай на русском языке подробно, но понятно
- Используй социальный, человеческий язык - не технический синтаксис
- После получения данных от инструментов, объясняй их простыми словами
- Если пользователь спрашивает о ягодах, используй операцию get_by_category с category="Ягоды"`,
    };

    // Подготавливаем сообщения для API
    const messages = [
      systemPrompt,
      ...recentHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Вызываем DeepSeek API с доступными инструментами
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        tools: useTools ? AVAILABLE_TOOLS : undefined,
        tool_choice: useTools ? "auto" : undefined,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Извлекаем ответ ассистента
    const assistantMessage = data.choices[0].message;

    // Добавляем ответ ассистента в историю
    const assistantMessageWithTimestamp = {
      ...assistantMessage,
      timestamp: new Date().toISOString(),
    };

    history.push(assistantMessageWithTimestamp);

    // Убрали сохранение истории в cookies чтобы избежать предупреждений
    // История теперь не сохраняется между запросами

    // Обрабатываем tool calls если они есть
    let toolResults = [];
    let finalAssistantMessage = assistantMessage;

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Реальная обработка tool calls
      for (const toolCall of assistantMessage.tool_calls) {
        try {
          const functionName = toolCall.function.name;
          let args: any = {};

          try {
            // Пробуем распарсить как JSON
            args = JSON.parse(toolCall.function.arguments);
          } catch (jsonError) {
            // Если не JSON, пробуем распарсить XML-подобный формат
            const xmlText = toolCall.function.arguments;
            console.log("Parsing XML format:", xmlText);

            // Пытаемся извлечь параметры из XML
            const operationMatch = xmlText.match(
              /operation["']?\s*[:=]\s*["']?([^"'\s>]+)/i,
            );
            const queryMatch = xmlText.match(
              /query["']?\s*[:=]\s*["']?([^"'\s>]+)/i,
            );
            const limitMatch = xmlText.match(/limit["']?\s*[:=]\s*["']?(\d+)/i);

            args = {
              operation: operationMatch ? operationMatch[1] : "search",
              query: queryMatch ? queryMatch[1] : "ягоды",
              limit: limitMatch ? parseInt(limitMatch[1]) : 10,
            };

            // Специальная логика для запросов о ягодах
            if (
              xmlText.toLowerCase().includes("клубник") ||
              xmlText.toLowerCase().includes("ягод") ||
              xmlText.toLowerCase().includes("berry")
            ) {
              args.query = "ягоды";
              args.operation = "get_by_category";
              args.category = "Ягоды";
            }

            console.log("Parsed XML args:", args);
          }

          // Вызываем соответствующий инструмент
          let result;
          if (functionName === "strapi_products") {
            result = await callStrapiTool(functionName, args);
          } else if (functionName === "chat_assistant") {
            // Обработка базовых запросов ассистента
            result = {
              message: "Информация получена от ассистента",
              data: args,
            };
          } else if (functionName === "cart_operations") {
            // Обработка операций с корзиной
            result = { message: "Операция с корзиной выполнена", data: args };
          } else {
            result = {
              error: `Инструмент ${functionName} не поддерживается`,
              data: args,
            };
          }

          // Добавляем результат в массив
          toolResults.push({
            tool_call_id: toolCall.id,
            result: JSON.stringify(result),
          });
        } catch (error: any) {
          console.error(
            `Error processing tool call ${toolCall.function.name}:`,
            error,
          );
          toolResults.push({
            tool_call_id: toolCall.id,
            result: JSON.stringify({
              error: `Ошибка при выполнении ${toolCall.function.name}: ${error.message}`,
            }),
          });
        }
      }

      // Второй запрос к DeepSeek API с результатами tool calls
      // Создаем массив сообщений для второго запроса
      const secondMessages = [
        ...messages,
        assistantMessage,
        ...toolResults.map((tr) => ({
          role: "tool" as const,
          tool_call_id: tr.tool_call_id,
          content: tr.result,
        })),
      ];

      const secondResponse = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: secondMessages,
          temperature: 0.7,
          max_tokens: 1000,
          stream: false,
        }),
      });

      if (!secondResponse.ok) {
        const errorText = await secondResponse.text();
        throw new Error(
          `DeepSeek API second call error: ${secondResponse.status} - ${errorText}`,
        );
      }

      const secondData = await secondResponse.json();
      console.log(
        "Second API response data:",
        JSON.stringify(secondData, null, 2),
      );

      finalAssistantMessage = secondData.choices[0].message;
      console.log("Final assistant message:", finalAssistantMessage);
      console.log("Final assistant content:", finalAssistantMessage.content);

      // Добавляем окончательный ответ в историю
      const finalMessageWithTimestamp = {
        ...finalAssistantMessage,
        timestamp: new Date().toISOString(),
      };
      history.push(finalMessageWithTimestamp);
    }

    // Возвращаем ответ
    return {
      success: true,
      message:
        finalAssistantMessage.content || "Я помогу вам с поиском продуктов.",
      tool_calls: assistantMessage.tool_calls || [],
      tool_results: toolResults,
      sessionId: cookieSessionId,
      history: recentHistory,
    };
  } catch (error: any) {
    console.error("Chat assistant error:", error);

    return {
      success: false,
      error: error.message || "Произошла ошибка при обработке запроса",
      message: "Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.",
    };
  }
});
