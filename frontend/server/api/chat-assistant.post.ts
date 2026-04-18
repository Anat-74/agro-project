import { defineEventHandler, readBody, getCookie, setCookie } from "h3";
import { $fetch } from "ofetch";

// DeepSeek API endpoint (OpenAI-compatible)
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
// В production используйте переменные окружения
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

// Простая функция для поиска товаров через нашу общую функцию
async function searchProductsTool(query?: string, category?: string, limit: number = 10) {
  try {
    // Импортируем общую функцию поиска
    const { searchProducts } = await import('../utils/product-search');
    
    // Вызываем функцию поиска
    const result = await searchProducts(query, category, limit);
    
    // Преобразуем результат в формат, ожидаемый AI ассистентом
    const products = result.products.map((p: any) => ({
      documentId: p.documentId,
      id: p.documentId, // Для обратной совместимости
      name: p.name,
      price: p.price,
      slug: p.slug,
      description: p.description,
      image: p.image,
      category: p.categoryName || "Без категории",
      isAvailable: true,
      isDiscount: false,
      discountPrice: null,
    }));
    
    console.log("Search results for query:", query, "Found products:", products.map((p: any) => `${p.name} (${p.price} руб, documentId: ${p.documentId})`));
    console.log("Total products found:", result.total, "Has more:", result.hasMore, "Success:", result.success, "Note:", result.note);
    
    return {
      success: true,
      products,
      total: result.total,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("Error in searchProductsTool:", error);
    return {
      success: false,
      error: `Ошибка поиска: ${error instanceof Error ? error.message : String(error)}`,
      products: [],
      total: 0,
    };
  }
}

// Вспомогательная функция для работы с Strapi API
async function callStrapiTool(toolName: string, args: any): Promise<any> {
  if (toolName === "strapi_products") {
    const { operation, query, category, limit = 10 } = args;
    
    // Для операции search используем нашу улучшенную функцию
    if (operation === "search" && query) {
      return await searchProductsTool(query, category, limit);
    }
    
    // Для других операций используем простую заглушку
    return {
      success: true,
      products: [],
      total: 0,
      limit,
      hasMore: false,
      message: `Операция "${operation}" временно недоступна. Используйте поиск товаров.`
    };
  }
  
  return {
    success: false,
    error: `Инструмент ${toolName} не реализован`
  };
}

// Вспомогательная функция для работы с корзиной
async function callCartTool(toolName: string, args: any): Promise<any> {
  console.log(`callCartTool called: ${toolName}`, args);
  
  if (toolName === "cart_operations") {
    const { operation, productId, quantity = 1 } = args;
    
    // Простая реализация для демонстрации
    return {
      success: true,
      message: `Операция корзины "${operation}" выполнена успешно`,
      operation,
      productId,
      quantity,
    };
  }
  
  return {
    success: false,
    error: `Инструмент ${toolName} не реализован`
  };
}

// Определяем доступные инструменты для AI-ассистента
const AVAILABLE_TOOLS = [
  {
    type: "function",
    function: {
      name: "strapi_products",
      description: "Поиск и получение информации о продуктах из базы данных",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["search", "get_featured", "get_by_category", "get_by_id"],
            description: "Тип операции: search - поиск по названию, get_featured - популярные товары, get_by_category - по категории, get_by_id - по ID",
          },
          query: {
            type: "string",
            description: "Поисковый запрос (для operation: 'search')",
          },
          category: {
            type: "string",
            description: "Название категории (для operation: 'get_by_category')",
          },
          limit: {
            type: "number",
            description: "Количество возвращаемых результатов (по умолчанию: 10)",
          },
          productId: {
            type: "string",
            description: "ID продукта (для operation: 'get_by_id')",
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
      description: "Операции с корзиной покупок",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["add", "remove", "get", "clear"],
            description: "Тип операции: add - добавить товар, remove - удалить товар, get - получить корзину, clear - очистить корзину",
          },
          productId: {
            type: "string",
            description: "ID продукта (для операций add/remove)",
          },
          quantity: {
            type: "number",
            description: "Количество (для операции add, по умолчанию: 1)",
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
      content: `Ты AI-ассистент для agro-market проекта "Агро-Маркет". Ты помогаешь пользователям с поиском продуктов и консультациями.

КОМАНДЫ ПОЛЬЗОВАТЕЛЯ И КАК НА НИХ РЕАГИРОВАТЬ:
1. "найди [товар]" → Вызови инструмент strapi_products с операцией "search"
2. "добавь [товар] в корзину" → Вызови инструмент cart_operations с операцией "add" и productId из найденных товаров
3. "покажи корзину" → Вызови инструмент cart_operations с операцией "get"
4. "удали [товар] из корзины" → Вызови инструмент cart_operations с операцией "remove"
5. "найди [товар] и добавь в корзину" → Вызови ОБА инструмента: сначала strapi_products для поиска, потом cart_operations для добавления

ДОСТУПНЫЕ ИНСТРУМЕНТЫ (используй tool_calls для их вызова):
1. strapi_products - Поиск товаров в базе данных
   Правильный формат аргументов: {"operation": "search", "query": "название товара", "limit": 5}

2. cart_operations - Управление корзиной покупок
   Правильный формат аргументов: {"operation": "add", "productId": "documentId товара", "quantity": 1}

СИСТЕМА РАБОТЫ:
1. Для запроса "найди [товар]" используй strapi_products с operation: "search" и query: "[товар]"
2. Для запроса "добавь яблоки в корзину" используй cart_operations с operation: "add" и productId: "ebt2ulbafd1h97w4me6o7dko"
3. Для запроса "добавь [другой товар] в корзину" (кроме яблок):
   - Если documentId известен из предыдущего поиска, используй cart_operations с найденным documentId
   - Если documentId неизвестен, сначала выполни поиск через strapi_products

ИЗВЕСТНЫЕ ТОВАРЫ:
- Яблоко Каштель → documentId: "ebt2ulbafd1h97w4me6o7dko" (используй этот ID для добавления яблок)

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ФОРМАТА:
1. ВСЕГДА используй tool_calls массив для вызова инструментов
2. НИКОГДА не возвращай JSON в content - используй только tool_calls
3. Для вызова инструмента возвращай массив tool_calls с одним или несколькими tool_call объектами
4. Каждый tool_call должен иметь: id, type: "function", function: {name: "имя_инструмента", arguments: "JSON_строка"}
5. Для составных запросов (например, "найди и добавь") возвращай несколько tool_call в массиве в правильном порядке
6. НИКОГДА не используй XML, HTML, DSML, Markdown или другие форматы
7. ВСЕГДА используй только двойные кавычки в JSON аргументах

ПРАВИЛЬНЫЕ ПРИМЕРЫ (используй ТОЛЬКО эти форматы через tool_calls):

ПРИМЕР 1: Пользователь говорит "найди яблоки"
Возвращай tool_calls массив с одним элементом:
tool_calls: [{
  "id": "call_123",
  "type": "function",
  "function": {
    "name": "strapi_products",
    "arguments": "{\"operation\": \"search\", \"query\": \"яблоки\", \"limit\": 5}"
  }
}]

ПРИМЕР 2: Пользователь говорит "добавь яблоко в корзину"
Возвращай tool_calls массив с одним элементом:
tool_calls: [{
  "id": "call_456",
  "type": "function",
  "function": {
    "name": "cart_operations",
    "arguments": "{\"operation\": \"add\", \"productId\": \"ebt2ulbafd1h97w4me6o7dko\", \"quantity\": 1}"
  }
}]

ПРИМЕР 3: Пользователь говорит "добавь найденный картофель в корзину"
Возвращай tool_calls массив с одним элементом:
tool_calls: [{
  "id": "call_789",
  "type": "function",
  "function": {
    "name": "cart_operations",
    "arguments": "{\"operation\": \"add\", \"productId\": \"НАЙДЕННЫЙ_RANEE_DOCUMENT_ID\", \"quantity\": 1}"
  }
}]
ПРИМЕЧАНИЕ: Если documentId неизвестен, сначала выполни поиск через strapi_products

ПРИМЕР 3: Пользователь говорит "покажи корзину"
Возвращай tool_calls массив с одним элементом:
tool_calls: [{
  "id": "call_789",
  "type": "function",
  "function": {
    "name": "cart_operations",
    "arguments": "{\"operation\": \"get\"}"
  }
}]

ПРИМЕР 4: Пользователь говорит "найди яблоки и добавь в корзину"
Возвращай tool_calls массив с ДВУМЯ элементами в правильном порядке:
tool_calls: [
  {
    "id": "call_111",
    "type": "function",
    "function": {
      "name": "strapi_products",
      "arguments": "{\"operation\": \"search\", \"query\": \"яблоки\", \"limit\": 5}"
    }
  },
  {
    "id": "call_222",
    "type": "function",
    "function": {
      "name": "cart_operations",
      "arguments": "{\"operation\": \"add\", \"productId\": \"ebt2ulbafd1h97w4me6o7dko\", \"quantity\": 1}"
    }
  }
]

ПРИМЕР 5: Пользователь говорит "найди горох и добавь в корзину"
Возвращай tool_calls массив с ДВУМЯ элементами:
tool_calls: [
  {
    "id": "call_333",
    "type": "function",
    "function": {
      "name": "strapi_products",
      "arguments": "{\"operation\": \"search\", \"query\": \"горох\", \"limit\": 5}"
    }
  },
  {
    "id": "call_444",
    "type": "function",
    "function": {
      "name": "cart_operations",
      "arguments": "{\"operation\": \"add\", \"productId\": \"ucpgucxhgbmsiugw8mzo70le\", \"quantity\": 1}"
    }
  }
]

НЕПРАВИЛЬНЫЕ ПРИМЕРЫ (НЕ ИСПОЛЬЗУЙ НИКОГДА):
- Любые форматы с тегами: <function_calls>, <invoke>, <parameter>, <tool_call>, <tool>
- XML, HTML, DSML, Markdown в tool_calls
- JSON в content (вместо tool_calls)
- Любые объяснения, комментарии или текст вместе с tool_calls

ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА:
1. Для известных товаров (яблоки, горох, картофель, морковь, огурцы) используй готовые documentId без поиска
2. Для неизвестных товаров сначала ищи через strapi_products, затем используй найденный documentId
3. Для составных запросов ("найди и добавь") возвращай несколько tool_calls в одном ответе
4. Всегда сохраняй порядок: сначала поиск, потом добавление в корзину
5. Не объясняй пользователю что ты делаешь - просто вызывай инструменты через tool_calls

ФОРМАТ ОТВЕТА С ИСПОЛЬЗОВАНИЕМ ИНСТРУМЕНТОВ:
1. Если нужно вызвать инструмент: верни ТОЛЬКО tool_calls массив без дополнительного текста в content
2. Content должен быть пустой строкой или null при использовании tool_calls
3. После выполнения инструментов система покажет тебе результаты, и тогда ты можешь ответить пользователю
4. Не пытайся показать пользователю технические форматы

ФОРМАТ ОТВЕТА ПОСЛЕ ПОЛУЧЕНИЯ РЕЗУЛЬТАТОВ ИНСТРУМЕНТОВ:
1. Когда система пришлет тебе результаты выполнения tool_calls, ты получишь их в контексте
2. На основе этих результатов сформируй ответ пользователю на русском языке
3. Для результатов поиска: покажи найденные товары в формате: 'Нашел X товаров: 1) [Название] - [цена] руб'
4. Для каждого товара укажи основные характеристики: название, цена, краткое описание
5. Предложи пользователю добавить товары в корзину
6. Для операций с корзиной: подтверди успешное выполнение, например: '✅ Товар добавлен в корзину'
7. Если товар не найден, сообщи об этом: 'По вашему запросу ничего не найдено. Попробуйте другие ключевые слова.'

ВАЖНЫЕ ХАРАКТЕРИСТИКИ:
- Отвечай на русском языке
- Будь дружелюбным и полезным
- Не показывай технические детали пользователю
- Говори просто и понятно
- Для операций с корзиной используй эмодзи для наглядности`,
    };

    // Формируем запрос к DeepSeek API
    const requestBody: any = {
      model: "deepseek-chat",
      messages: [systemPrompt, ...recentHistory],
      temperature: 0.7,
      max_tokens: 1000,
    };

    // Добавляем инструменты если нужно
    if (useTools) {
      requestBody.tools = AVAILABLE_TOOLS;
      requestBody.tool_choice = "auto";
    }

    // Выполняем запрос к DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Обрабатываем tool calls если они есть
    let toolResults = [];
    let clientInstruction = undefined;

    // Проверяем, не вернул ли AI JSON в content (вместо tool_calls)
    let parsedContent = null;
    if (assistantMessage.content && !assistantMessage.tool_calls) {
      try {
        // Пытаемся найти JSON в content
        const jsonMatch = assistantMessage.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[0]);
          console.log("Parsed JSON from content:", parsedContent);
        }
      } catch (error) {
        console.log("Could not parse JSON from content:", assistantMessage.content);
      }
    }

    // Если есть parsedContent, создаем искусственный tool call
    let toolCallsToProcess = assistantMessage.tool_calls || [];
    if (parsedContent && toolCallsToProcess.length === 0) {
      // Определяем какой инструмент вызывать на основе parsedContent
      let functionName = "strapi_products";
      if (parsedContent.operation === "add" || parsedContent.operation === "remove" || parsedContent.operation === "get" || parsedContent.operation === "clear") {
        functionName = "cart_operations";
      }
      
      // Создаем искусственный tool call
      const artificialToolCall = {
        id: `artificial_${Date.now()}`,
        type: "function",
        function: {
          name: functionName,
          arguments: JSON.stringify(parsedContent)
        }
      };
      toolCallsToProcess = [artificialToolCall];
      console.log("Created artificial tool call from content:", artificialToolCall);
    }

    if (toolCallsToProcess.length > 0) {
      console.log("Processing tool calls:", toolCallsToProcess);

      for (const toolCall of toolCallsToProcess) {
        try {
          const functionName = toolCall.function.name;
          let args;

          // Парсим аргументы
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch (jsonError) {
            console.error("Failed to parse JSON arguments:", toolCall.function.arguments);
            // Если не JSON, пытаемся извлечь JSON из текста
            const text = toolCall.function.arguments;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                args = JSON.parse(jsonMatch[0]);
              } catch (e) {
                throw new Error(`Невалидный JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
              }
            } else {
              throw new Error(`Невалидный формат аргументов: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
            }
          }

          console.log(`Calling tool ${functionName} with args:`, args);

          // Вызываем соответствующий инструмент
          let result;
          if (functionName === "strapi_products") {
            result = await callStrapiTool(functionName, args);
          } else if (functionName === "cart_operations") {
            result = await callCartTool(functionName, args);
            
            // Для операций с корзиной создаем clientInstruction
            if (result.success && args.operation === "add" && args.productId) {
              // Получаем информацию о товаре из Strapi для правильного clientInstruction
              try {
                const strapiUrl = process.env.STRAPI_URL || "http://127.0.0.1:1337";
                // В Strapi v5 используем фильтр по documentId
                const productResponse = await $fetch(`${strapiUrl}/api/products`, {
                  params: {
                    "filters[documentId][$eq]": args.productId,
                    "populate": "*",
                    "pagination[pageSize]": 1
                  }
                });
                
                if (productResponse.data && productResponse.data.length > 0) {
                  const productData = productResponse.data[0];
                  
                  // Обработка изображения в Strapi v5 (согласованно с product-search.ts)
                  let image = null;
                  if (productData.image) {
                    console.log('Product image data:', JSON.stringify(productData.image, null, 2));
                    
                    if (Array.isArray(productData.image) && productData.image.length > 0) {
                      // Используем ту же логику, что и в product-search.ts
                      const img = productData.image[0];
                      image = img.url || img.formats?.thumbnail?.url || null;
                      console.log('Using image URL from array:', image);
                    } else if (productData.image.url) {
                      image = productData.image.url;
                      console.log('Using direct image URL:', image);
                    }
                  }
                  
                    if (!image) {
                    console.log('No image found for product:', productData.name);
                    // Используем существующее изображение из public/image
                    image = "/image/cart-empty-img.png";
                  }
                  
                  clientInstruction = {
                    type: "add_to_cart",
                    data: {
                      productId: args.productId,
                      product: {
                        id: productData.documentId || productData.id,
                        documentId: productData.documentId || productData.id,
                        name: productData.name || `Товар ${args.productId}`,
                        price: productData.price || 0,
                        slug: productData.slug || `product-${args.productId}`,
                        image: image,
                      },
                      quantity: args.quantity || 1,
                    }
                  };
                } else {
                  // Если не удалось получить информацию о товаре, используем минимальные данные с placeholder
                  clientInstruction = {
                    type: "add_to_cart",
                    data: {
                      productId: args.productId,
                      product: {
                        id: args.productId,
                        documentId: args.productId,
                        name: `Товар ${args.productId}`,
                        price: 100,
                        slug: `product-${args.productId}`,
                        image: "/images/placeholder.jpg",
                      },
                      quantity: args.quantity || 1,
                    }
                  };
                }
              } catch (productError) {
                console.error("Error fetching product info:", productError);
                // Fallback к минимальным данным с placeholder
                clientInstruction = {
                  type: "add_to_cart",
                  data: {
                    productId: args.productId,
                    product: {
                      id: args.productId,
                      documentId: args.productId,
                      name: `Товар ${args.productId}`,
                      price: 100,
                      slug: `product-${args.productId}`,
                      image: "/images/placeholder.jpg",
                    },
                    quantity: args.quantity || 1,
                  }
                };
              }
            }
          } else {
            result = {
              error: `Инструмент ${functionName} не реализован`,
              data: args,
            };
          }

          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify(result),
          });
        } catch (error) {
          console.error(`Error processing tool call ${toolCall.function.name}:`, error);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: toolCall.function.name,
            content: JSON.stringify({
              error: `Ошибка при выполнении ${toolCall.function.name}: ${error instanceof Error ? error.message : String(error)}`,
            }),
          });
        }
      }

        // Если есть результаты инструментов, отправляем их обратно в AI
        if (toolResults.length > 0) {
          // Определяем, использовал ли AI старый формат (JSON в content) или новый (tool_calls)
          // Если есть tool_calls или созданные искусственные tool calls, используем обычный flow
          // Старый формат (JSON в content без tool_calls) обрабатываем специально для обратной совместимости
          if (parsedContent && toolCallsToProcess.length === 0) {
            if (parsedContent.operation === "search") {
            // Для поиска отправляем результаты обратно в AI, чтобы получить детальный ответ
            // Создаем сообщение assistant с tool_calls (искусственными) и пустым content
            const assistantMessageWithToolCalls = {
              role: "assistant",
              content: "",
              tool_calls: toolCallsToProcess,
            };
            
            const secondRoundMessages = [
              systemPrompt,
              ...recentHistory,
              assistantMessageWithToolCalls,
              ...toolResults,
            ];

            const secondRoundResponse = await fetch(DEEPSEEK_API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
              },
              body: JSON.stringify({
                model: "deepseek-chat",
                messages: secondRoundMessages,
                temperature: 0.7,
                max_tokens: 1000,
              }),
            });

            if (!secondRoundResponse.ok) {
              throw new Error(`DeepSeek API second round error: ${secondRoundResponse.status}`);
            }

            const secondRoundData = await secondRoundResponse.json();
            assistantMessage.content = secondRoundData.choices[0].message.content;
          } else if (parsedContent.operation === "add") {
            // Для добавления в корзину показываем простое сообщение
            assistantMessage.content = "✅ Товар добавлен в корзину";
          } else if (parsedContent.operation === "get") {
            // Для получения корзины показываем простое сообщение
            assistantMessage.content = "Корзина загружена";
          } else {
            assistantMessage.content = "Операция выполнена успешно";
          }
        } else {
          // Обычный flow: отправляем результаты инструментов обратно в AI
          const secondRoundMessages = [
            systemPrompt,
            ...recentHistory,
            assistantMessage,
            ...toolResults,
          ];

          const secondRoundResponse = await fetch(DEEPSEEK_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: secondRoundMessages,
              temperature: 0.7,
              max_tokens: 1000,
            }),
          });

          if (!secondRoundResponse.ok) {
            throw new Error(`DeepSeek API second round error: ${secondRoundResponse.status}`);
          }

          const secondRoundData = await secondRoundResponse.json();
          assistantMessage.content = secondRoundData.choices[0].message.content;
        }
      }
    }

    // Возвращаем ответ
    return {
      success: true,
      message: assistantMessage.content || "Нет ответа от ассистента",
      sessionId: cookieSessionId,
      tool_calls: toolCallsToProcess,
      clientInstruction,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in chat assistant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
});