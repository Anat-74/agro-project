<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '../stores/useCartStore'

// Сохраняем оригинальный интерфейс для совместимости
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  clientInstruction?: any; // Инструкция для клиента (например, добавление в корзину)
}

// Импортируем только executeCartAction из нового композабла
import { executeCartAction as executeCartActionNew } from '../composables/chat-assistant/useChatCart'

const isOpen = ref(false);
const inputMessage = ref("");
const messages = ref<ChatMessage[]>([]);
const isLoading = ref(false);
const chatBody = ref<HTMLElement | null>(null);
const sessionId = ref<string | null>(null);
const cartStore = useCartStore();

// Функция для вызова MCP инструментов (оставляем оригинальную)
const callMCPTool = async (toolName: string, arguments_: any) => {
  try {
    const response = await fetch('/api/mcp/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: arguments_,
        },
        id: Date.now().toString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MCP API error ${response.status}:`, errorText);
      throw new Error(`MCP API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      console.error(`MCP tool ${toolName} error:`, data.error);
      throw new Error(data.error.message || `MCP tool ${toolName} error`);
    }
    
    if (!data.result) {
      console.warn(`MCP tool ${toolName} returned empty result:`, data);
      throw new Error(`MCP tool ${toolName} returned empty result`);
    }
    
    console.log(`MCP tool ${toolName} result:`, JSON.stringify(data.result, null, 2));
    return data.result;
  } catch (error) {
    console.error(`Error calling MCP tool ${toolName}:`, error);
    
    // Возвращаем структурированную ошибку вместо выбрасывания
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown MCP error',
      tool: toolName,
      timestamp: new Date().toISOString()
    };
  }
};

// Заменяем оригинальную executeCartAction на новую версию
const executeCartAction = async (instruction: any) => {
  return executeCartActionNew(instruction, callMCPTool)
}

// Остальной код компонента остается без изменений...
// Здесь должен быть остальной код из оригинального ChatAssistant.vue
// начиная с quickSuggestions (строка 452 в оригинале)

const quickSuggestions = [
  "Собери корзину для борща",
  "Найди яблоко",
  "Покажи корзину",
  "Очисти корзину",
  "Добавь картофель",
  "Найди овощи",
  "Собери завтрак",
  "Собери куриный суп",
  "Собери пиццу",
  "Собери смузи",
];

// ... остальной код компонента
</script>

<template>
  <div>
    <!-- Временный компонент для тестирования -->
    <p>Optimized ChatAssistant component (work in progress)</p>
  </div>
</template>