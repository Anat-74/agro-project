<template>
  <div class="chat-assistant">
    <!-- Floating button -->
    <button
      v-if="!isOpen"
      class="chat-button"
      @click="openChat"
      aria-label="Открыть чат с ассистентом"
    >
      <svg class="chat-icon" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
        />
      </svg>
      <span class="chat-button-text">AI Ассистент</span>
    </button>

    <!-- Chat modal -->
    <div v-if="isOpen" class="chat-modal">
      <div class="chat-header">
        <div class="header-content">
          <div class="assistant-info">
            <div class="assistant-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
            </div>
            <div>
              <h3 class="assistant-title">AI Ассистент</h3>
              <p class="assistant-subtitle">Agro-Market Помощник</p>
            </div>
          </div>
          <button
            class="close-button"
            @click="closeChat"
            aria-label="Закрыть чат"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="chat-body" ref="chatBody">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
              />
            </svg>
          </div>
          <h4 class="empty-title">Привет! Я ваш AI-ассистент</h4>
          <p class="empty-description">
            Я помогу вам с поиском продуктов, ответами на вопросы о доставке и
            оплате, консультацией по сельскохозяйственной продукции и другими
            вопросами.
          </p>
          <div class="suggestions">
            <button
              v-for="suggestion in quickSuggestions"
              :key="suggestion"
              class="suggestion-button"
              @click="sendQuickMessage(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>

        <div v-else class="messages-container">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['message', message.role]"
          >
            <div class="message-avatar">
              <svg
                v-if="message.role === 'assistant'"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
            </div>
            <div class="message-content">
              <div
                class="message-text"
                v-html="
                  formatMessage(message.content, message.clientInstruction)
                "
              ></div>
              <div class="message-time">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>

          <div v-if="isLoading" class="message assistant">
            <div class="message-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-footer">
        <form @submit.prevent="sendMessage" class="message-form">
          <input
            v-model="inputMessage"
            type="text"
            placeholder="Введите ваш вопрос..."
            :disabled="isLoading"
            class="message-input"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <button
            type="submit"
            :disabled="!inputMessage.trim() || isLoading"
            class="send-button"
            aria-label="Отправить сообщение"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
        <div class="chat-footer-info">
          <p class="footer-text">
            AI-ассистент работает на DeepSeek. Ответы могут содержать
            неточности.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from "vue";
import { useCartStore } from "~/stores/useCartStore";
import {
  parseAIResponse,
  type ChatAssistantResponse,
} from "~/composables/useChatAssistant";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  clientInstruction?: any; // Инструкция для клиента (например, добавление в корзину)
}

const isOpen = ref(false);
const inputMessage = ref("");
const messages = ref<ChatMessage[]>([]);
const isLoading = ref(false);
const chatBody = ref<HTMLElement | null>(null);
const sessionId = ref<string | null>(null);
const cartStore = useCartStore();

const quickSuggestions = [
  "Какие продукты сейчас в продаже?",
  "Как оформить доставку?",
  "Какие есть способы оплаты?",
  "Как добавить товар в корзину?",
  "Есть ли скидки на сельхозпродукцию?",
];

const openChat = () => {
  isOpen.value = true;
  // Загружаем историю из localStorage при открытии
  loadChatHistory();
};

const closeChat = () => {
  isOpen.value = false;
};

const sendQuickMessage = (message: string) => {
  inputMessage.value = message;
  sendMessage();
};

const sendMessage = async () => {
  const message = inputMessage.value.trim();
  if (!message || isLoading.value) return;

  // Добавляем сообщение пользователя
  const userMessage: ChatMessage = {
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  };

  messages.value.push(userMessage);
  inputMessage.value = "";
  isLoading.value = true;

  // Сохраняем историю
  saveChatHistory();

  // Прокручиваем к низу
  scrollToBottom();

  try {
    // Используем $fetch напрямую, так как компонент уже смонтирован
    const response = await $fetch("/api/chat-assistant", {
      method: "POST",
      body: JSON.stringify({
        message,
        sessionId: sessionId.value,
        tools: [], // Можно добавить MCP tools здесь
        cartState: cartStore.items.length, // Текущее состояние корзины
      }),
    });

    // Парсим ответ от AI (может быть XML/DSML или JSON)
    const parsedResponse = parseAIResponse(response);

    // Обрабатываем успешный ответ
    processAIResponse(parsedResponse);
  } catch (error: any) {
    console.error("Chat error:", error);

    const errorMessage: ChatMessage = {
      role: "assistant",
      content:
        "Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз.",
      timestamp: new Date().toISOString(),
    };
    messages.value.push(errorMessage);
  } finally {
    isLoading.value = false;
    saveChatHistory();
    scrollToBottom();
  }
};

/**
 * Обрабатывает успешный ответ от AI
 */
const processAIResponse = (response: any) => {
  if (!response || !response.success) {
    handleAIError(response?.error || "Неизвестная ошибка");
    return;
  }

  // Сохраняем sessionId для последующих запросов
  if (response.sessionId) {
    sessionId.value = response.sessionId;
  }

  // Добавляем ответ ассистента
  const assistantMessage: ChatMessage = {
    role: "assistant",
    content: response.message,
    timestamp: new Date().toISOString(),
    clientInstruction: response.clientInstruction,
  };

  messages.value.push(assistantMessage);

  // Обрабатываем tool calls если есть
  if (response.tool_calls && response.tool_calls.length > 0) {
    console.log("Tool calls received:", response.tool_calls);
    processToolCalls(response.tool_calls);
  }

  // Обрабатываем инструкции для клиента
  if (response.clientInstruction) {
    handleClientInstruction(response.clientInstruction);
  }

  // Сохраняем историю и прокручиваем
  saveChatHistory();
  scrollToBottom();
};

/**
 * Обрабатывает ошибки от AI
 */
const handleAIError = (error: any) => {
  console.error("AI error:", error);

  const errorMessage: ChatMessage = {
    role: "assistant",
    content: `Ошибка: ${error?.message || error || "Неизвестная ошибка"}`,
    timestamp: new Date().toISOString(),
  };
  messages.value.push(errorMessage);

  saveChatHistory();
  scrollToBottom();
};

/**
 * Обрабатывает tool calls от AI
 */
const processToolCalls = (toolCalls: any[]) => {
  if (!toolCalls || toolCalls.length === 0) return;

  console.log("Processing tool calls:", toolCalls);

  // Здесь можно добавить логику обработки tool calls
  // Например, выполнение функций strapi_products, cart_operations и т.д.

  toolCalls.forEach((toolCall, index) => {
    const { function: func } = toolCall;
    console.log(
      `Tool call ${index + 1}: ${func.name} with args:`,
      func.arguments,
    );

    // В реальном приложении здесь будет вызов соответствующих функций
    // Например: executeToolCall(func.name, JSON.parse(func.arguments))
  });
};

/**
 * Обрабатывает инструкции для клиента
 */
const handleClientInstruction = (instruction: any) => {
  if (!instruction) return;

  console.log("Client instruction received:", instruction);

  switch (instruction.type) {
    case "add_to_cart":
    case "remove_from_cart":
    case "update_cart":
      // Эти инструкции уже обрабатываются через кнопки в formatMessage
      break;
    case "tool_calls":
      // Обработка tool calls
      if (instruction.calls && Array.isArray(instruction.calls)) {
        processToolCalls(instruction.calls);
      }
      break;
    default:
      console.warn("Unknown client instruction type:", instruction.type);
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBody.value) {
      chatBody.value.scrollTop = chatBody.value.scrollHeight;
    }
  });
};

const formatMessage = (text: string, clientInstruction?: any) => {
  let formattedText = text.replace(/\n/g, "<br>");

  // Добавляем кнопки для действий с корзиной, если есть инструкция
  if (clientInstruction) {
    const { type } = clientInstruction;
    // Экранируем JSON для вставки в атрибут onclick
    const escapedInstruction = JSON.stringify(clientInstruction)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n');

    switch (type) {
      case "add_to_cart":
        formattedText += `<br><br><div class="cart-action-buttons">
          <button class="cart-action-button add-to-cart" onclick="window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { detail: { type: 'add_to_cart', data: ${escapedInstruction} } }))">
            ✅ Добавить в корзину
          </button>
          <button class="cart-action-button cancel" onclick="window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { detail: { type: 'cancel' } }))">
            ❌ Отмена
          </button>
        </div>`;
        break;

      case "remove_from_cart":
        formattedText += `<br><br><div class="cart-action-buttons">
          <button class="cart-action-button remove-from-cart" onclick="window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { detail: { type: 'remove_from_cart', data: ${escapedInstruction} } }))">
            🗑️ Удалить из корзины
          </button>
          <button class="cart-action-button cancel" onclick="window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { detail: { type: 'cancel' } }))">
            ❌ Отмена
          </button>
        </div>`;
        break;

      case "update_cart_quantity":
        formattedText += `<br><br><div class="cart-action-buttons">
          <button class="cart-action-button update-quantity" onclick="window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { detail: { type: 'update_cart_quantity', data: ${escapedInstruction} } }))">
            🔄 Обновить количество
          </button>
          <button class="cart-action-button cancel" onclick="window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { detail: { type: 'cancel' } }))">
            ❌ Отмена
          </button>
        </div>`;
        break;

      case "clear_cart":
        formattedText += `<br><br><div class="cart-action-buttons">
          <button class="cart-action-button clear-cart" onclick="window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { detail: { type: 'clear_cart' } }))">
            🧹 Очистить корзину
          </button>
          <button class="cart-action-button cancel" onclick="window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { detail: { type: 'cancel' } }))">
            ❌ Отмена
          </button>
        </div>`;
        break;

      case "show_cart":
        formattedText += `<br><br><div class="cart-action-buttons">
          <button class="cart-action-button show-cart" onclick="window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { detail: { type: 'show_cart' } }))">
            🛒 Показать корзину
          </button>
        </div>`;
        break;
    }
  }

  return formattedText;
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const saveChatHistory = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "chatAssistantHistory",
      JSON.stringify(messages.value),
    );
    if (sessionId.value) {
      localStorage.setItem("chatAssistantSessionId", sessionId.value);
    }
  }
};

const loadChatHistory = () => {
  if (typeof window !== "undefined") {
    const savedHistory = localStorage.getItem("chatAssistantHistory");
    const savedSessionId = localStorage.getItem("chatAssistantSessionId");

    if (savedHistory) {
      try {
        messages.value = JSON.parse(savedHistory);
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    }

    if (savedSessionId) {
      sessionId.value = savedSessionId;
    }

    scrollToBottom();
  }
};

const clearChatHistory = () => {
  messages.value = [];
  sessionId.value = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("chatAssistantHistory");
    localStorage.removeItem("chatAssistantSessionId");
  }
};

// Обработка клавиш
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && isOpen.value) {
    closeChat();
  }
};

// Функция для обработки действий с корзиной
const handleCartAction = (event: CustomEvent) => {
  console.log('[ChatAssistant] Cart action received:', event.detail);
  const { type, data } = event.detail;

  switch (type) {
    case "add_to_cart":
      if (data.product) {
        // Создаем объект продукта для добавления в корзину
        const product = {
          id: data.product.id,
          name: data.product.name,
          price: data.product.price,
          slug: data.product.slug,
          image: data.product.image,
        };

        // Добавляем продукт в корзину
        cartStore.addToCart(
          product as any,
          data.categorySlug || "fruits",
          null,
        );

        // Добавляем сообщение об успешном добавлении
        const successMessage: ChatMessage = {
          role: "assistant",
          content: `✅ Товар "${data.product.name}" успешно добавлен в корзину!`,
          timestamp: new Date().toISOString(),
        };
        messages.value.push(successMessage);
        saveChatHistory();
        scrollToBottom();
      } else if (data.productId) {
        // Если нет полной информации о продукте, показываем сообщение
        const infoMessage: ChatMessage = {
          role: "assistant",
          content: `Для добавления товара с ID ${data.productId} в корзину перейдите на страницу товара.`,
          timestamp: new Date().toISOString(),
        };
        messages.value.push(infoMessage);
        saveChatHistory();
        scrollToBottom();
      }
      break;

    case "remove_from_cart":
      if (data.productId) {
        const productId = Number(data.productId);
        cartStore.removeFromCart(productId);

        const successMessage: ChatMessage = {
          role: "assistant",
          content: `✅ Товар с ID ${productId} удален из корзины.`,
          timestamp: new Date().toISOString(),
        };
        messages.value.push(successMessage);
        saveChatHistory();
        scrollToBottom();
      }
      break;

    case "update_cart_quantity":
      if (data.productId && data.quantity) {
        const productId = Number(data.productId);
        const quantity = Number(data.quantity);
        cartStore.updateQuantity(productId, quantity);

        const successMessage: ChatMessage = {
          role: "assistant",
          content: `✅ Количество товара с ID ${productId} обновлено до ${quantity}.`,
          timestamp: new Date().toISOString(),
        };
        messages.value.push(successMessage);
        saveChatHistory();
        scrollToBottom();
      }
      break;

    case "clear_cart":
      cartStore.clearCart();

      const successMessage: ChatMessage = {
        role: "assistant",
        content: "✅ Корзина успешно очищена.",
        timestamp: new Date().toISOString(),
      };
      messages.value.push(successMessage);
      saveChatHistory();
      scrollToBottom();
      break;

    case "show_cart":
      // Показываем сообщение о корзине
      const cartItems = cartStore.items;
      const totalItems = cartStore.totalItems;
      const totalPrice = cartStore.totalPrice;

      let cartMessage = "🛒 Содержимое вашей корзины:\n\n";

      if (cartItems.length === 0) {
        cartMessage += "Корзина пуста.";
      } else {
        cartItems.forEach((item, index) => {
          cartMessage += `${index + 1}. ${item.product.name} - ${item.quantity} × ${item.product.price} ₽ = ${item.product.price * item.quantity} ₽\n`;
        });
        cartMessage += `\nВсего товаров: ${totalItems}\n`;
        cartMessage += `Общая сумма: ${totalPrice} ₽`;
      }

      const cartInfoMessage: ChatMessage = {
        role: "assistant",
        content: cartMessage,
        timestamp: new Date().toISOString(),
      };
      messages.value.push(cartInfoMessage);
      saveChatHistory();
      scrollToBottom();
      break;

    case "cancel":
      // Просто закрываем действие, ничего не делаем
      const cancelMessage: ChatMessage = {
        role: "assistant",
        content: "Действие отменено.",
        timestamp: new Date().toISOString(),
      };
      messages.value.push(cancelMessage);
      saveChatHistory();
      scrollToBottom();
      break;
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  // Добавляем обработчик событий для действий с корзиной
  window.addEventListener(
    "chat-assistant-cart-action",
    handleCartAction as EventListener,
  );
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener(
    "chat-assistant-cart-action",
    handleCartAction as EventListener,
  );
});
</script>

<style scoped lang="scss">
.chat-assistant {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.chat-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(76, 175, 80, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

.chat-icon {
  width: 20px;
  height: 20px;
}

.chat-button-text {
  white-space: nowrap;
}

.chat-modal {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1001;
  width: 400px;
  max-width: calc(100vw - 48px);
  height: 600px;
  max-height: calc(100vh - 48px);
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assistant-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.assistant-avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
  }
}

.assistant-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.assistant-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  opacity: 0.9;
}

.close-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  color: #4caf50;
  opacity: 0.7;

  svg {
    width: 100%;
    height: 100%;
  }
}

.empty-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.empty-description {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 300px;
  margin: 0 auto;
}

.suggestion-button {
  padding: 10px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;

  &:hover {
    background: #f5f5f5;
    border-color: #4caf50;
    color: #2e7d32;
  }
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease;

  &.user {
    flex-direction: row-reverse;

    .message-avatar {
      background: #4caf50;
    }

    .message-content {
      align-items: flex-end;
    }

    .message-text {
      background: #4caf50;
      color: white;
      border-radius: 18px 18px 4px 18px;
    }
  }

  &.assistant {
    .message-avatar {
      background: #757575;
    }

    .message-text {
      background: white;
      color: #333;
      border: 1px solid #e0e0e0;
      border-radius: 18px 18px 18px 4px;
    }
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 18px;
    height: 18px;
    color: white;
  }
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 70%;
}

.message-text {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  color: #999;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;

  span {
    width: 8px;
    height: 8px;
    background: #757575;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}

.chat-footer {
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.message-form {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #4caf50;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
}

.send-button {
  width: 48px;
  height: 48px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    background: #388e3c;
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.chat-footer-info {
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 11px;
  color: #999;
  line-height: 1.4;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

@media (max-width: 480px) {
  .chat-modal {
    width: calc(100vw - 32px);
    height: calc(100vh - 100px);
    bottom: 16px;
    right: 16px;
    max-width: none;
    max-height: none;
  }

  .chat-button {
    bottom: 16px;
    right: 16px;
  }

  .message-content {
    max-width: 80%;
  }
}

/* Стили для кнопок действий с корзиной */
.cart-action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.cart-action-button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

.cart-action-button.add-to-cart {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: white;
}

.cart-action-button.remove-from-cart {
  background: linear-gradient(135deg, #f44336, #c62828);
  color: white;
}

.cart-action-button.update-quantity {
  background: linear-gradient(135deg, #2196f3, #1565c0);
  color: white;
}

.cart-action-button.clear-cart {
  background: linear-gradient(135deg, #ff9800, #ef6c00);
  color: white;
}

.cart-action-button.show-cart {
  background: linear-gradient(135deg, #9c27b0, #6a1b9a);
  color: white;
}

.cart-action-button.cancel {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}
</style>
