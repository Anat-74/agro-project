/**
 * Кастомный composable для работы с AI-ассистентом
 * Использует createUseAsyncData из Nuxt 4.4 с transform функцией
 * для парсинга XML/DSML ответов от AI
 */

import type { Ref } from "vue";
import type { AsyncDataOptions } from "#app";

export interface ChatAssistantResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  tool_calls?: Array<{
    function: {
      name: string;
      arguments: string;
    };
    id: string;
    index: number;
    type: "function";
  }>;
  clientInstruction?: {
    type: "add_to_cart" | "remove_from_cart" | "update_cart" | "tool_calls";
    product?: {
      id: number;
      name: string;
      price: number;
      slug: string;
      image?: string;
    };
    quantity?: number;
    calls?: any[];
  };
  error?: string;
  timestamp?: string;
}

export interface UseChatAssistantOptions extends Partial<
  AsyncDataOptions<ChatAssistantResponse>
> {
  // Дополнительные опции для чата
  parseXML?: boolean;
  cacheDuration?: number; // Длительность кэширования в миллисекундах
}

/**
 * Парсит XML/DSML ответы от AI и преобразует их в JSON
 */
function parseAIResponse(response: any): ChatAssistantResponse {
  if (!response) {
    return {
      success: false,
      message: "Пустой ответ от сервера",
      error: "EMPTY_RESPONSE",
    };
  }

  // Если ответ уже в правильном формате
  if (typeof response === "object" && response.success !== undefined) {
    return response as ChatAssistantResponse;
  }

  // Если ответ - строка, пытаемся распарсить
  if (typeof response === "string") {
    try {
      // Пытаемся распарсить как JSON
      const parsed = JSON.parse(response);
      if (parsed.success !== undefined) {
        return parsed as ChatAssistantResponse;
      }
    } catch (jsonError) {
      // Не JSON, пытаемся распарсить как XML/DSML
      return parseXMLResponse(response);
    }
  }

  // Если ничего не подошло, возвращаем ошибку
  return {
    success: false,
    message: "Неизвестный формат ответа",
    error: "UNKNOWN_FORMAT",
    tool_calls: [],
  };
}

/**
 * Парсит XML/DSML ответы от AI
 */
function parseXMLResponse(xmlString: string): ChatAssistantResponse {
  try {
    // Упрощенный парсинг XML/DSML формата
    // Пример формата: <function name="strapi_products">{"operation": "get_featured"}</function>

    const toolCalls: any[] = [];
    let humanMessage = xmlString;
    let clientInstruction = undefined;

    // Ищем теги <function>
    const functionRegex =
      /<function\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/function>/g;
    let match;

    while ((match = functionRegex.exec(xmlString)) !== null) {
      const [, name, argsString] = match;

      try {
        if (argsString) {
          const args = JSON.parse(argsString.trim());
          toolCalls.push({
            function: { name, arguments: JSON.stringify(args) },
            id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            index: toolCalls.length,
            type: "function" as const,
          });

          // Удаляем XML из человеческого сообщения
          humanMessage = humanMessage.replace(match[0], "");
        }
      } catch (error) {
        console.warn(
          "Не удалось распарсить аргументы функции:",
          argsString,
          error,
        );
      }
    }

    // Очищаем сообщение от XML тегов
    humanMessage = humanMessage
      .replace(/<[^>]*>/g, "") // Удаляем все XML теги
      .replace(/\s+/g, " ") // Нормализуем пробелы
      .trim();

    // Если есть tool calls, создаем clientInstruction
    if (toolCalls.length > 0) {
      clientInstruction = {
        type: "tool_calls" as const,
        calls: toolCalls,
      };
    }

    return {
      success: true,
      message: humanMessage || "Ответ от AI-ассистента",
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      clientInstruction,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Ошибка парсинга XML ответа:", error);
    return {
      success: false,
      message: "Ошибка обработки ответа от AI",
      error: "XML_PARSE_ERROR",
      tool_calls: [],
    };
  }
}

/**
 * Проверяет, не устарели ли кэшированные данные
 */
function isCacheExpired(
  cachedData: any,
  cacheDuration: number = 5 * 60 * 1000,
): boolean {
  if (!cachedData || !cachedData.timestamp) return true;

  const cacheTime = new Date(cachedData.timestamp).getTime();
  const currentTime = Date.now();

  return currentTime - cacheTime > cacheDuration;
}

/**
 * Создает кастомный useAsyncData для работы с AI-ассистентом
 */
export const useChatAssistant = createUseAsyncData({
  // Базовые настройки
  server: false, // Только клиентская сторона
  lazy: true, // Не блокировать навигацию
  immediate: false, // Не выполнять сразу

  // Трансформация данных
  transform: (response: any) => {
    return parseAIResponse(response);
  },

  // Умное кэширование
  getCachedData: (key: string, nuxtApp: any) => {
    const cached = nuxtApp.payload.data[key] ?? nuxtApp.static.data[key];

    if (cached && !isCacheExpired(cached, 5 * 60 * 1000)) {
      console.log(`Используем кэшированные данные для ключа: ${key}`);
      return cached;
    }

    // Если данные устарели или их нет, возвращаем undefined
    // чтобы triggerнуть новый запрос
    return undefined;
  },

  // Дедупликация запросов
  dedupe: "cancel" as const,

  // Таймаут запроса (30 секунд)
  timeout: 30000,

  // Глубокое реактивное отслеживание
  deep: true,

  // Значение по умолчанию
  default: () => ({
    success: false,
    message: "",
    tool_calls: [],
    timestamp: new Date().toISOString(),
  }),
});

/**
 * Тип возвращаемого значения useChatAssistant
 */
export type UseChatAssistantReturn = ReturnType<typeof useChatAssistant>;

/**
 * Вспомогательная функция для создания реактивного ключа чата
 */
export function createChatKey(
  sessionId: Ref<string> | string,
  message: Ref<string> | string,
): string {
  const session = typeof sessionId === "string" ? sessionId : sessionId.value;
  const msg = typeof message === "string" ? message : message.value;

  // Создаем хэш сообщения для уникальности ключа
  const messageHash = msg ? simpleHash(msg) : "empty";
  const timestamp = Date.now();

  return `chat-${session}-${messageHash}-${timestamp}`;
}

/**
 * Простая хэш-функция для строк
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Вспомогательная функция для создания зависимостей для watch
 */
export function createChatDependencies(
  sessionId: Ref<string | null>,
  message: Ref<string>,
  cartItemCount?: Ref<number>,
) {
  return computed(() => ({
    sessionId: sessionId.value || '',
    message: message.value,
    cartItemCount: cartItemCount?.value || 0,
    timestamp: Date.now(), // Для принудительного обновления
  }));
}

/**
 * Проверяет, нужно ли обновлять данные при изменении зависимостей
 */
export function shouldRefreshChat(
  newDeps: any,
  oldDeps: any,
  options: {
    minMessageLength?: number;
    ignoreSessionChange?: boolean;
  } = {},
): boolean {
  const { minMessageLength = 3, ignoreSessionChange = false } = options;

  // Не обновляем при первом рендере
  if (!oldDeps) return false;

  // Обновляем при изменении sessionId (если не игнорируем)
  if (!ignoreSessionChange && newDeps.sessionId !== oldDeps.sessionId) {
    return true;
  }

  // Обновляем при значительном изменении сообщения
  if (newDeps.message && oldDeps.message) {
    const newMessage = newDeps.message.trim();
    const oldMessage = oldDeps.message.trim();

    if (newMessage !== oldMessage && newMessage.length >= minMessageLength) {
      return true;
    }
  }

  // Обновляем при изменении состояния корзины
  if (newDeps.cartItemCount !== oldDeps.cartItemCount) {
    return true;
  }

  return false;
}

// Экспортируем функцию парсинга для использования в компонентах
export { parseAIResponse, parseXMLResponse };
