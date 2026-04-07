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

        // Для русского языка: преобразуем первую букву в заглавную
        // потому что Strapi $startsWith чувствителен к регистру
        const capitalizedQuery = query.charAt(0).toUpperCase() + query.slice(1);

        // Ищем с заглавной первой буквой
        baseParams.append(
          "filters[$or][0][name][$startsWith]",
          capitalizedQuery,
        );
        baseParams.append(
          "filters[$or][1][description][$startsWith]",
          capitalizedQuery,
        );

        // Также ищем с оригинальным query (на случай если пользователь ввел с заглавной)
        baseParams.append("filters[$or][2][name][$startsWith]", query);
        baseParams.append("filters[$or][3][description][$startsWith]", query);

        // Для поиска в любом месте строки (не только в начале) используем $eq с маской
        // Но в Strapi v5 нет LIKE, поэтому используем $containsi если поддерживается
        baseParams.append("filters[$or][4][name][$containsi]", query);
        baseParams.append("filters[$or][5][description][$containsi]", query);

        baseParams.append("sort", "name:asc");
      }

      if (operation === "get_by_category" && category) {
        // Получение продуктов по категории
        baseParams.append("filters[isAvailable][$eq]", "true");

        // Для категории "Ягоды" используем более точный поиск
        if (category === "Ягоды") {
          // Ищем только конкретные ягоды по названию и подкатегории
          // Убираем общий поиск по "ягод" чтобы исключить томаты
          // Используем $startsWith с заглавными буквами
          baseParams.append("filters[$or][0][name][$startsWith]", "Ежевик");
          baseParams.append("filters[$or][1][name][$startsWith]", "Клубник");
          baseParams.append("filters[$or][2][name][$startsWith]", "Малин");
          baseParams.append("filters[$or][3][name][$startsWith]", "Черник");
          baseParams.append("filters[$or][4][name][$startsWith]", "Смородин");
          baseParams.append("filters[$or][5][name][$startsWith]", "Вишн");
          baseParams.append("filters[$or][6][name][$startsWith]", "Алыч");
          baseParams.append("filters[$or][7][name][$startsWith]", "Крыжовник");
          baseParams.append("filters[$or][8][name][$startsWith]", "Слив");
          baseParams.append(
            "filters[$or][9][subcategory][name][$eq]",
            "Ежевика",
          );
        } else {
          // Для других категорий используем стандартный поиск
          // Учитываем продукты с прямой связью с категорией
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
               id: product.documentId,
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
      const url = `${STRAPI_URL}/api/products?${baseParams.toString()}`;
      console.log("Strapi search URL:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Strapi API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Strapi raw search result:", JSON.stringify(result, null, 2));
      const products = result.data || [];

      // Форматируем ответ
      const formattedProducts = products.map((product: any) => {
        const attributes = product.attributes || product;
        // В Strapi v5 используем documentId как идентификатор продукта
        const productId = product.documentId;
        return {
          id: productId,
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

// Вспомогательная функция для работы с корзиной
async function callCartTool(toolName: string, args: any): Promise<any> {
  console.log(`callCartTool called: ${toolName}`, args);
  // Реализация работы с корзиной
  if (toolName === "cart_operations") {
    const { operation, productId, quantity = 1 } = args;

    try {
      // Для операции добавления сначала получаем информацию о продукте
      if (operation === "add" && productId) {
        try {
          // Получаем информацию о продукте из Strapi
          const STRAPI_URL = process.env.STRAPI_URL || process.env.NUXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
          const STRAPI_API_TOKEN = process.env.STRAPI_ADMIN_TOKEN || process.env.NUXT_STRAPI_TOKEN || "";
          
          // Определяем, является ли productId числовым ID или documentId
          const isNumericId = /^\d+$/.test(String(productId));
          let productUrl: string;
          if (isNumericId) {
            // Числовой ID – используем стандартный endpoint
            productUrl = `${STRAPI_URL}/api/products/${productId}?populate=*&publicationState=preview`;
          } else {
            // DocumentId – используем фильтр по documentId
            productUrl = `${STRAPI_URL}/api/products?filters[documentId][$eq]=${encodeURIComponent(productId)}&populate=*&publicationState=preview`;
          }
          
          console.log("Fetching product info from:", productUrl);
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (STRAPI_API_TOKEN) {
            headers["Authorization"] = `Bearer ${STRAPI_API_TOKEN}`;
          }
          const response = await fetch(productUrl, { headers });
          
          console.log("Product fetch response status:", response.status, response.statusText);
          
          if (response.ok) {
            const result = await response.json();
            console.log("Product fetch result:", JSON.stringify(result, null, 2));
            
            // Обрабатываем оба формата ответа: прямой объект или массив с фильтром
            let productData = result.data;
            if (Array.isArray(productData)) {
              // Если получили массив (фильтр по documentId), берем первый элемент
              if (productData.length === 0) {
                throw new Error(`Продукт с documentId ${productId} не найден`);
              }
              productData = productData[0];
            }
            
            const product = productData;
            const attributes = product.attributes || product;
            const productName = attributes.name;
            const productPrice = attributes.price;
            const productSlug = attributes.slug;
            const categorySlug = attributes.category?.slug || "fruits"; // fallback
            const imageUrl = attributes.mainImage?.url || attributes.image?.[0]?.url || "";
            
            console.log("Product info retrieved:", { productName, productPrice, productSlug, categorySlug, imageUrl });

            // Возвращаем инструкцию для клиента с полной информацией о продукте
            return {
              success: true,
              message: `Товар "${productName}" добавлен в корзину в количестве ${quantity}. Нажмите "Добавить в корзину" для подтверждения.`,
              operation: "add",
              productId: productId,
              productName,
              price: productPrice,
              quantity,
              total: productPrice * quantity,
              timestamp: new Date().toISOString(),
              // Инструкция для клиента
              clientInstruction: {
                type: "add_to_cart",
                product: {
                   id: product.documentId,
                  name: productName,
                  price: productPrice,
                  slug: productSlug,
                  image: imageUrl,
                },
                categorySlug: categorySlug,
                quantity: quantity,
              },
            };
          } else {
            const errorText = await response.text();
            console.error("Product fetch failed:", response.status, errorText);
          }
        } catch (error) {
          console.error("Error fetching product info:", error);
          // Если не удалось получить информацию, возвращаем базовый ответ
        }
      }

      switch (operation) {
        case "add":
          // Добавление товара в корзину (fallback если не удалось получить информацию)
          return {
            success: true,
            message: `Товар с ID ${productId} добавлен в корзину в количестве ${quantity}. Нажмите "Добавить в корзину" для подтверждения.`,
            operation: "add",
            productId,
            quantity,
            timestamp: new Date().toISOString(),
            // Инструкция для клиента
            clientInstruction: {
              type: "add_to_cart",
              productId: productId,
              quantity: quantity,
            },
          };

        case "remove":
          // Удаление товара из корзины
          return {
            success: true,
            message: `Товар с ID ${productId} удален из корзины. Нажмите "Удалить из корзины" для подтверждения.`,
            operation: "remove",
            productId,
            timestamp: new Date().toISOString(),
            // Инструкция для клиента
            clientInstruction: {
              type: "remove_from_cart",
              productId: productId,
            },
          };

        case "update":
          // Обновление количества товара
          return {
            success: true,
            message: `Количество товара с ID ${productId} обновлено до ${quantity}. Нажмите "Обновить количество" для подтверждения.`,
            operation: "update",
            productId,
            quantity,
            timestamp: new Date().toISOString(),
            // Инструкция для клиента
            clientInstruction: {
              type: "update_cart_quantity",
              productId: productId,
              quantity: quantity,
            },
          };

        case "get":
          // Получение содержимого корзины
          // Для операции get возвращаем только сообщение, так как реальные данные будут на клиенте
          return {
            success: true,
            message:
              "Содержимое корзины получено. Проверьте корзину в правом верхнем углу сайта.",
            operation: "get",
            timestamp: new Date().toISOString(),
            // Инструкция для клиента
            clientInstruction: {
              type: "show_cart",
            },
          };

        case "clear":
          // Очистка корзины
          return {
            success: true,
            message:
              "Корзина очищена. Нажмите 'Очистить корзину' для подтверждения.",
            operation: "clear",
            timestamp: new Date().toISOString(),
            // Инструкция для клиента
            clientInstruction: {
              type: "clear_cart",
            },
          };

        default:
          return {
            error: `Неизвестная операция корзины: ${operation}`,
            operation,
            productId,
            quantity,
          };
      }
    } catch (error: any) {
      console.error("Cart operation error:", error);
      return {
        error: `Ошибка при выполнении операции с корзиной: ${error.message}`,
        operation,
        productId,
        quantity,
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

ВАЖНЫЕ ПРАВИЛА ФОРМАТА:
1. ВСЕГДА используй ТОЛЬКО VALID JSON формат для аргументов инструментов
2. НИКОГДА не используй XML, HTML, DSML или другие форматы для аргументов
3. Аргументы ДОЛЖНЫ быть валидным JSON объектом, начинающимся с { и заканчивающимся }
4. Пример правильного формата для strapi_products:
   {
     "operation": "search",
     "query": "яблоки",
     "limit": 5
   }
5. Пример НЕПРАВИЛЬНОГО формата (НЕ ИСПОЛЬЗУЙ):
   <function_calls>
   <invoke name="strapi_products">
   <parameter name="operation" string="true">search</parameter>
   </invoke>
   </function_calls>

РАБОТА С КОРЗИНОЙ:
1. Когда пользователь просит добавить товар в корзину (например: "добавь горох в корзину", "положи яблоки в корзину", "хочу купить морковь"):
   - Сначала используй strapi_products с operation: "search" и query: "название товара" чтобы найти товар
   - Получи ID товара из результатов поиска
   - Затем используй cart_operations с operation: "add", productId: "найденный ID", quantity: 1
   
2. Когда пользователь просит посмотреть корзину (например: "что в корзине", "покажи корзину", "корзина", "моя корзина"):
   - Используй cart_operations с operation: "get"
   
3. Когда пользователь просит удалить товар из корзины (например: "удали горох из корзины", "убери яблоки из корзины"):
   - Используй cart_operations с operation: "remove" и productId: "ID товара"

4. Когда пользователь просит очистить корзину (например: "очисти корзину", "удали все из корзины"):
   - Используй cart_operations с operation: "clear"

ВАЖНО: РАСПОЗНАВАНИЕ НАМЕРЕНИЙ ПОЛЬЗОВАТЕЛЯ:
- Если пользователь говорит "добавь [товар] в корзину" → ищи товар и добавляй в корзину
- Если пользователь говорит "положи [товар] в корзину" → ищи товар и добавляй в корзину  
- Если пользователь говорит "хочу купить [товар]" → ищи товар и добавляй в корзину
- Если пользователь говорит "корзина" или "покажи корзину" → показывай содержимое корзины
- Если пользователь говорит "удали [товар] из корзины" → удаляй товар из корзины

ПОСЛЕДОВАТЕЛЬНОСТЬ ДЕЙСТВИЙ ДЛЯ ДОБАВЛЕНИЯ В КОРЗИНУ:
1. Поиск товара: strapi_products { "operation": "search", "query": "название товара" }
2. Получение ID товара из результатов поиска (используй поле 'id' из объекта продукта, сервер вернет результаты в следующем раунде)
3. После получения результатов поиска, вызови cart_operations с operation: "add", productId: "найденный ID", quantity: 1
ВАЖНО: Это двухэтапный процесс. Сначала вызови strapi_products, дождись результатов, затем вызови cart_operations.

ФОРМАТ ОТВЕТОВ ДЛЯ ПОЛЬЗОВАТЕЛЯ:
- НИКОГДА не показывай технические форматы (JSON, XML, DSML) в ответах
- Всегда преобразуй результаты инструментов в человеческий язык
- Пример: вместо "<function_calls>..." говори "Отлично! Я нашел горох и добавляю его в вашу корзину"
- Используй дружелюбный, социальный стиль общения
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

СТИЛЬ ОБЩЕНИЯ И ФОРМАТ ОТВЕТОВ:
1. ВСЕГДА используй человеческий, социальный язык в ответах пользователю
2. НИКОГДА не показывай технические форматы (JSON, XML, DSML, tool calls) в ответах пользователю
3. После получения данных от инструментов, объясняй их простыми, понятными словами
4. Пример ПРАВИЛЬНОГО ответа:
   "Отлично! Я нашел горох в нашем магазине. Это 'Горох Стручковый' по цене 4.48 рубля. Добавляю его в вашу корзину!"
5. Пример НЕПРАВИЛЬНОГО ответа (НЕ ИСПОЛЬЗУЙ):
   "<function_calls><invoke name='cart_operations'><parameter name='operation' string='true'>add</parameter>"
6. Если пользователь спрашивает о ягодах, используй операцию get_by_category с category="Ягоды"
7. Всегда заканчивай ответ дружелюбным предложением помощи или вопросом
8. Используй эмодзи и форматирование для улучшения читаемости, но не переусердствуй`,
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
    let clientInstruction: any = null; // Для хранения инструкций для клиента

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
            const categoryMatch = xmlText.match(
              /category["']?\s*[:=]\s*["']?([^"'\s>]+)/i,
            );
            const limitMatch = xmlText.match(/limit["']?\s*[:=]\s*["']?(\d+)/i);
            const productIdMatch = xmlText.match(
              /productId["']?\s*[:=]\s*["']?([^"'\s>]+)/i,
            );
            const quantityMatch = xmlText.match(
              /quantity["']?\s*[:=]\s*["']?(\d+)/i,
            );

            args = {
              operation: operationMatch ? operationMatch[1] : "search",
              query: queryMatch ? queryMatch[1] : "",
              limit: limitMatch ? parseInt(limitMatch[1]) : 10,
            };

            // Если есть категория, добавляем её
            if (categoryMatch) {
              args.category = categoryMatch[1];
            }

            // Если есть productId, добавляем его (для cart_operations)
            if (productIdMatch) {
              args.productId = productIdMatch[1];
            }

            // Если есть quantity, добавляем его (для cart_operations)
            if (quantityMatch) {
              args.quantity = parseInt(quantityMatch[1]);
            }

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
            console.log("Calling cart_operations with args:", args);
            result = await callCartTool(functionName, args);
            console.log("cart_operations result:", result);

            // Сохраняем clientInstruction для возврата клиенту
            if (result && result.clientInstruction) {
              console.log("Setting clientInstruction from cart_operations:", result.clientInstruction);
              clientInstruction = result.clientInstruction;
            } else {
              console.log("No clientInstruction in cart_operations result");
            }
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

      console.log(
        "Second request messages:",
        JSON.stringify(secondMessages, null, 2),
      );

      const secondResponse = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: secondMessages,
          tools: AVAILABLE_TOOLS, // Включаем инструменты для второго раунда
          tool_choice: "auto",
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
       
       // Проверяем, есть ли tool calls во втором ответе
       if (finalAssistantMessage.tool_calls && finalAssistantMessage.tool_calls.length > 0) {
         console.log("Second round tool calls detected:", finalAssistantMessage.tool_calls);
         
         // Обрабатываем tool calls второго раунда
         for (const toolCall of finalAssistantMessage.tool_calls) {
           try {
             const functionName = toolCall.function.name;
             let args: any = {};

             try {
               args = JSON.parse(toolCall.function.arguments);
             } catch (jsonError) {
               // Парсинг XML формата (как в первом раунде)
               const xmlText = toolCall.function.arguments;
               console.log("Parsing XML format in second round:", xmlText);

               const operationMatch = xmlText.match(
                 /operation["']?\s*[:=]\s*["']?([^"'\s>]+)/i,
               );
               const queryMatch = xmlText.match(
                 /query["']?\s*[:=]\s*["']?([^"'\s>]+)/i,
               );
               const productIdMatch = xmlText.match(
                 /productId["']?\s*[:=]\s*["']?([^"'\s>]+)/i,
               );
               const quantityMatch = xmlText.match(
                 /quantity["']?\s*[:=]\s*["']?(\d+)/i,
               );

               args = {
                 operation: operationMatch ? operationMatch[1] : "search",
                 query: queryMatch ? queryMatch[1] : "",
               };

               if (productIdMatch) args.productId = productIdMatch[1];
               if (quantityMatch) args.quantity = parseInt(quantityMatch[1]);
             }

             // Вызываем инструмент
             let result;
             if (functionName === "strapi_products") {
               console.log("Second round: calling strapi_products with args:", args);
               result = await callStrapiTool(functionName, args);
               console.log("Second round strapi_products result:", result);
             } else if (functionName === "cart_operations") {
               console.log("Second round: calling cart_operations with args:", args);
               result = await callCartTool(functionName, args);
               console.log("Second round cart_operations result:", result);
               if (result && result.clientInstruction) {
                 console.log("Second round: Setting clientInstruction from cart_operations:", result.clientInstruction);
                 clientInstruction = result.clientInstruction;
               } else {
                 console.log("Second round: No clientInstruction in cart_operations result");
               }
             } else if (functionName === "chat_assistant") {
               result = {
                 message: "Информация получена от ассистента",
                 data: args,
               };
             } else {
               result = {
                 error: `Инструмент ${functionName} не поддерживается`,
                 data: args,
               };
             }

             // Добавляем результат
             toolResults.push({
               tool_call_id: toolCall.id,
               result: JSON.stringify(result),
             });
           } catch (error: any) {
             console.error(`Error processing second round tool call ${toolCall.function.name}:`, error);
             toolResults.push({
               tool_call_id: toolCall.id,
               result: JSON.stringify({
                 error: `Ошибка при выполнении ${toolCall.function.name}: ${error.message}`,
               }),
             });
           }
         }
         
         // После обработки tool calls второго раунда, мы могли бы сделать третий запрос,
         // но для простоты ограничимся двумя раундами
         console.log("Second round tool calls processed, stopping further rounds.");
       }

      // Добавляем окончательный ответ в историю
      const finalMessageWithTimestamp = {
        ...finalAssistantMessage,
        timestamp: new Date().toISOString(),
      };
      history.push(finalMessageWithTimestamp);
    }

    // Возвращаем ответ
    console.log("Server returning clientInstruction:", clientInstruction);
    console.log("clientInstruction type:", typeof clientInstruction);
    if (clientInstruction) {
      console.log("clientInstruction content:", JSON.stringify(clientInstruction, null, 2));
    }
    return {
      success: true,
      message:
        finalAssistantMessage.content || "Я помогу вам с поиском продуктов.",
      tool_calls: assistantMessage.tool_calls || [],
      tool_results: toolResults,
      sessionId: cookieSessionId,
      history: recentHistory,
      clientInstruction: clientInstruction, // Добавляем инструкции для клиента
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
