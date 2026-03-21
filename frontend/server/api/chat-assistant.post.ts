import { defineEventHandler, readBody, getCookie, setCookie } from "h3";

// DeepSeek API endpoint (OpenAI-compatible)
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
// В production используйте переменные окружения
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

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
    setCookie(event, "chat_session_id", cookieSessionId, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });

    // Получаем историю сообщений из cookie (упрощенная версия)
    const historyCookie = getCookie(event, `chat_history_${cookieSessionId}`);
    const history = historyCookie ? JSON.parse(historyCookie) : [];

    // Добавляем новое сообщение пользователя в историю
    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    history.push(userMessage);

    // Ограничиваем историю последними 10 сообщениями для экономии токенов
    const recentHistory = history.slice(-10);

    // Формируем расширенный системный промпт для ассистента с информацией о доступных инструментах
    const systemPrompt = {
      role: "system",
      content: `Ты AI-ассистент для agro-market проекта. Ты помогаешь пользователям с:
1. Поиском и рекомендацией продуктов
2. Ответами на вопросы о доставке и оплате
3. Помощью с корзиной покупок
4. Консультацией по сельскохозяйственной продукции
5. Ответами на вопросы о проекте

Доступные инструменты:
- chat_assistant: Получение информации о продуктах, доставке, оплате, FAQ
- strapi_products: Работа с продуктами из базы данных Strapi
- cart_operations: Управление корзиной покупок

Используй инструменты когда нужно получить конкретную информацию о продуктах, доставке или корзине.
Будь дружелюбным, полезным и профессиональным. Отвечай на русском языке.`,
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

    // Сохраняем обновленную историю в cookie (ограничиваем размер)
    const historyToSave = history.slice(-20); // Сохраняем последние 20 сообщений
    setCookie(
      event,
      `chat_history_${cookieSessionId}`,
      JSON.stringify(historyToSave),
      {
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: "strict",
        path: "/",
      },
    );

    // Обрабатываем tool calls если они есть
    let toolResults = [];
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Здесь можно реализовать вызов реальных MCP tools
      // Для демонстрации возвращаем mock результаты
      toolResults = assistantMessage.tool_calls.map((toolCall: any) => ({
        tool_call_id: toolCall.id,
        function_name: toolCall.function.name,
        result: `Инструмент ${toolCall.function.name} выполнен успешно`,
      }));
    }

    // Возвращаем ответ
    return {
      success: true,
      message: assistantMessage.content,
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
