import type { Ref } from "vue";

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
  searchResults?: any[];
  error?: string;
  timestamp?: string;
}

export function parseAIResponse(response: any): ChatAssistantResponse {
  if (!response) {
    return {
      success: false,
      message: "Пустой ответ от сервера",
      error: "EMPTY_RESPONSE",
    };
  }

  if (typeof response === "object" && response.success !== undefined) {
    return response as ChatAssistantResponse;
  }

  if (typeof response === "string") {
    try {
      const parsed = JSON.parse(response);
      if (parsed.success !== undefined) {
        return parsed as ChatAssistantResponse;
      }
    } catch {
      // not JSON, return error
    }
  }

  return {
    success: false,
    message: "Неизвестный формат ответа",
    error: "UNKNOWN_FORMAT",
    tool_calls: [],
  };
}
