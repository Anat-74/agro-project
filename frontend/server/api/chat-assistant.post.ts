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
      isDiscount: p.isDiscount || false,
    }));
    
    console.debug("Search results for query:", query, "Found products:", products.map((p: any) => `${p.name} (${p.price} руб, documentId: ${p.documentId})`));
    console.debug("Total products found:", result.total, "Has more:", result.hasMore, "Success:", result.success, "Note:", result.note);
    
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
  console.debug(`callCartTool called: ${toolName}`, args);
  
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
    const { message, sessionId, useTools = true, lastSearchResults } = body;

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

    // Добавляем контекст предыдущего поиска, если он есть
    let contextBlock = "";
    if (lastSearchResults && Array.isArray(lastSearchResults) && lastSearchResults.length > 0) {
      contextBlock = `
КОНТЕКСТ ПРЕДЫДУЩЕГО ПОИСКА (эти товары уже найдены, используй их documentId):
${JSON.stringify(lastSearchResults, null, 2)}

ВАЖНО: Если пользователь говорит "добавь в корзину" — НЕ СПРАШИВАЙ какой товар.
Используй documentId первого товара из контекста выше и вызови cart_operations.
ТЫ ОБЯЗАН использовать tool_calls, а не отвечать текстом.
Не вызывай поиск повторно для товаров, которые уже есть в контексте.
`;
    }

    // Формируем системный промпт — краткий, без хардкода и примеров
    const systemPrompt = {
      role: "system",
      content: `Ты AI-ассистент интернет-магазина "Агро-Маркет". Помогаешь с поиском товаров и корзиной.${contextBlock}

ПРАВИЛА РАБОТЫ С ИНСТРУМЕНТАМИ:
1. "найди [товар]" → strapi_products с operation: "search", query: "[товар]"
2. "добавь в корзину" → cart_operations с operation: "add"
   - Если есть КОНТЕКСТ выше: используй documentId первого товара из контекста, НЕ ОТВЕЧАЙ ТЕКСТОМ
   - Если контекста нет: сначала search, потом add
3. "покажи корзину" → cart_operations с operation: "get"
4. "найди [товар] и добавь" → СНАЧАЛА search, ПОТОМ add (два tool_calls в одном ответе)

ФОРМАТ ОТВЕТА:
- Для вызова инструмента: tool_calls массив, content пустой. НИКОГДА не отвечай текстом когда нужно вызвать инструмент
- После результата инструмента: ответь пользователю на русском
- Найденные товары: "Нашел X товаров: 1) [Название] - [цена] руб"
- Корзина: "✅ Товар добавлен в корзину"
- Если ничего не найдено: "По вашему запросу ничего не найдено"
- Будь дружелюбным, используй эмодзи 🥔 ✅ 🛒
- Не показывай технические детали и JSON в ответе пользователю`,
    };

    // Формируем запрос к DeepSeek API
    const requestBody: any = {
      model: "deepseek-chat",
      messages: [systemPrompt, ...recentHistory],
      temperature: 0.7,
      max_tokens: 500,
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
    let searchResultsOutput: any[] = [];

    const toolCallsToProcess = assistantMessage.tool_calls || [];

    if (toolCallsToProcess.length > 0) {
      console.debug("Processing tool calls:", toolCallsToProcess);

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

          console.debug(`Calling tool ${functionName} with args:`, args);

          // Вызываем соответствующий инструмент
          let result;
          if (functionName === "strapi_products") {
            result = await callStrapiTool(functionName, args);
            if (result.success && result.products && result.products.length > 0) {
              searchResultsOutput = result.products.map((p: any) => ({
                documentId: p.documentId,
                name: p.name,
                price: p.price,
                slug: p.slug,
                image: p.image,
                category: p.category,
                categoryName: p.categoryName,
                isDiscount: p.isDiscount || false
              }));

              clientInstruction = {
                type: "show_products",
                data: {
                  products: searchResultsOutput,
                  query: args.query,
                  total: result.total
                }
              };
            }
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
                    console.debug('Product image data:', JSON.stringify(productData.image, null, 2));
                    
                    if (Array.isArray(productData.image) && productData.image.length > 0) {
                      // Используем ту же логику, что и в product-search.ts
                      const img = productData.image[0];
                      image = img.url || img.formats?.thumbnail?.url || null;
                      console.debug('Using image URL from array:', image);
                    } else if (productData.image.url) {
                      image = productData.image.url;
                      console.debug('Using direct image URL:', image);
                    }
                  }
                  
                    if (!image) {
                    console.debug('No image found for product:', productData.name);
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
              max_tokens: 500,
            }),
          });

          if (!secondRoundResponse.ok) {
            throw new Error(`DeepSeek API second round error: ${secondRoundResponse.status}`);
          }

          const secondRoundData = await secondRoundResponse.json();
          assistantMessage.content = secondRoundData.choices[0].message.content;
        }
      }

    // Возвращаем ответ
    return {
      success: true,
      message: assistantMessage.content || "Нет ответа от ассистента",
      sessionId: cookieSessionId,
      tool_calls: toolCallsToProcess,
      clientInstruction,
      searchResults: searchResultsOutput.length > 0 ? searchResultsOutput : undefined,
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