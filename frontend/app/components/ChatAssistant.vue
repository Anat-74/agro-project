<script setup lang="ts">
// Импорты из новых композаблов для AI ассистента
import { useChatMessages } from '../composables/chat-assistant/useChatMessages'
import { useChatMCP } from '../composables/chat-assistant/useChatMCP'
import { useChatCart } from '../composables/chat-assistant/useChatCart'
import { parseAIResponse } from '../composables/chat-assistant/useChatAssistant'

// Инициализация композаблов
const chatMessages = useChatMessages()
const chatMCP = useChatMCP()
const chatCart = useChatCart()

// Реактивные переменные
const isOpen = ref(false)
const inputMessage = ref('')
const isLoading = ref(false)
const chatBody = ref<HTMLElement | null>(null)

// Использование методов из композаблов
const { 
  messages, 
  sessionId, 
  formatMessage, 
  formatTime,
  saveChatHistory,
  loadChatHistory,
  clearChatHistory,
  addUserMessage,
  addAssistantMessage,
  addErrorMessage 
} = chatMessages

const { callMCPTool } = chatMCP
const { cartStore, setupCartListeners } = chatCart

// Быстрые предложения (поиск товаров и управление корзиной)
const quickSuggestions = [
  'добавь яблоки в корзину',  // Работает с известным documentId
  'найди картофель',          // Поиск
  'найди овощи',              // Поиск
  'найди фрукты',             // Поиск
  'покажи корзину',           // Показать корзину
  'очисти корзину',           // Очистить корзину
  'найди молочные продукты',  // Поиск
  'найди мясо',               // Поиск
  'найди рыбу',               // Поиск
  'найди напитки'             // Поиск
]

// Преобразование быстрых предложений в сообщения для AI
const convertQuickSuggestionToAIMessage = (quickMessage: string) => {
  const mapping: Record<string, string> = {
    'добавь яблоки в корзину': 'добавь яблоки в корзину',
    'найди картофель': 'найди картофель',
    'найди овощи': 'найди овощи',
    'найди фрукты': 'найди фрукты',
    'покажи корзину': 'покажи корзину',
    'очисти корзину': 'очисти корзину',
    'найди молочные продукты': 'найди молочные продукты',
    'найди мясо': 'найди мясо',
    'найди рыбу': 'найди рыбу',
    'найди напитки': 'найди напитки'
  }
  
  return mapping[quickMessage] || quickMessage
}

// Основные функции компонента
const openChat = () => {
  isOpen.value = true
  loadChatHistory()
}

const closeChat = () => {
  isOpen.value = false
}

const sendQuickMessage = async (message: string) => {
  // Используем основной AI pipeline для быстрых предложений
  // Преобразуем быстрые предложения в текстовые сообщения для AI
  const aiMessage = convertQuickSuggestionToAIMessage(message)
  
  // Добавляем сообщение пользователя
  addUserMessage(message)
  inputMessage.value = ''
  isLoading.value = true
  scrollToBottom()

  try {
    const response = await $fetch('/api/chat-assistant', {
      method: 'POST',
      body: JSON.stringify({
        message: aiMessage,
        sessionId: sessionId.value,
        tools: [],
        cartState: cartStore.items.length
      })
    })

    const parsedResponse = parseAIResponse(response)
    processAIResponse(parsedResponse)
  } catch (error: any) {
    console.error('Quick message error:', error)
    addErrorMessage('Произошла ошибка при обработке быстрого предложения. Пожалуйста, попробуйте еще раз.')
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}


const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return

  addUserMessage(message)
  inputMessage.value = ''
  isLoading.value = true
  scrollToBottom()

  try {
    const response = await $fetch('/api/chat-assistant', {
      method: 'POST',
      body: JSON.stringify({
        message,
        sessionId: sessionId.value,
        tools: [],
        cartState: cartStore.items.length
      })
    })

    const parsedResponse = parseAIResponse(response)
    processAIResponse(parsedResponse)
  } catch (error: any) {
    console.error('Chat error:', error)
    addErrorMessage('Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз.')
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const processAIResponse = (response: any) => {
  if (!response || !response.success) {
    handleAIError(response?.error || 'Неизвестная ошибка')
    return
  }

  if (response.sessionId) {
    sessionId.value = response.sessionId
  }

  addAssistantMessage(response.message, response.clientInstruction)

  if (response.tool_calls && response.tool_calls.length > 0) {
    console.log('Tool calls received:', response.tool_calls)
    processToolCalls(response.tool_calls)
  }

  if (response.clientInstruction) {
    handleClientInstruction(response.clientInstruction)
  }

  saveChatHistory()
  scrollToBottom()
}

const handleAIError = (error: any) => {
  console.error('AI error:', error)
  addErrorMessage(`Ошибка: ${error?.message || error || 'Неизвестная ошибка'}`)
  scrollToBottom()
}

const processToolCalls = (toolCalls: any[]) => {
  if (!toolCalls || toolCalls.length === 0) return
  console.log('Processing tool calls:', toolCalls)
  
  toolCalls.forEach((toolCall, index) => {
    const { function: func } = toolCall
    console.log(`Tool call ${index + 1}: ${func.name} with args:`, func.arguments)
  })
}

const handleClientInstruction = async (instruction: any) => {
  if (!instruction) return
  console.log('Client instruction received:', instruction)

  const cartActionTypes = [
    'add_to_cart',
    'remove_from_cart', 
    'clear_cart',
    'show_cart',
    'create_recipe_cart',
    'search_products'
  ]

  if (cartActionTypes.includes(instruction.type)) {
    try {
      const result = await chatCart.executeCartAction(instruction, callMCPTool)
      
      if (result.message && result.message.trim() !== '') {
        addAssistantMessage(result.message)
        scrollToBottom()
      }
      
    } catch (error) {
      console.error('Error executing cart action:', error)
      addErrorMessage(`❌ Ошибка при выполнении действия: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      scrollToBottom()
    }
    return
  }

  switch (instruction.type) {
    case 'update_cart':
      break
    case 'tool_calls':
      if (instruction.calls && Array.isArray(instruction.calls)) {
        processToolCalls(instruction.calls)
      }
      break
    default:
      console.warn('Unknown client instruction type:', instruction.type)
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBody.value) {
      chatBody.value.scrollTop = chatBody.value.scrollHeight
    }
  })
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) {
    closeChat()
  }
}

// Функция getQuickSuggestionInstruction удалена - быстрые предложения теперь используют основной AI pipeline

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  const cleanupCartListeners = setupCartListeners(messages, saveChatHistory, scrollToBottom)
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    cleanupCartListeners()
  })
})
</script>

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
              <Icon name="material-symbols:chat" />
            </div>
            <div>
              <h3 class="assistant-title">AI Ассистент</h3>
              <p class="assistant-subtitle">Agro-Market Помощник</p>
            </div>
          </div>
          <div class="header-actions">
            <button
              v-if="messages.length > 0"
              class="clear-history-button"
              @click="clearChatHistory"
              aria-label="Очистить историю чата"
              title="Очистить историю"
            >
              <Icon name="material-symbols:delete-outline-rounded" />
            </button>
            <button
              class="close-button"
              @click="closeChat"
              aria-label="Закрыть чат"
            >
              <Icon name="material-symbols-light:close" />
            </button>
          </div>
        </div>
      </div>

      <div class="chat-body" ref="chatBody">
        <div v-if="messages.length === 0" class="empty-state">
           <div class="empty-icon">
              <Icon name="material-symbols:chat" />
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
              <Icon v-if="message.role === 'assistant'" name="material-symbols:chat" />
              <Icon v-else name="material-symbols:person" />
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
              <Icon name="material-symbols:chat" />
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
             <Icon name="material-symbols:send" />
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

<style scoped lang="scss">
// Стили остаются без изменений
.chat-assistant {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.assistant-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.assistant-avatar {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .icon {
    color: var(--light-color);
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

.close-button,
.clear-history-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--light-color);
  transition: all var(--transition-duration);
  border-radius: 4px;
  
  svg,
  .icon {
    color: inherit;
    fill: currentColor;
    transition: transform var(--transition-duration);
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    
    svg,
    .icon {
      transform: scale(1.1);
    }
  }
  
  &:active {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(0.95);
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
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  color: var(--primary-color);
  
  .icon {
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--primary-color);
  
  .icon {
    color: var(--light-color);
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

  .icon {
    color: var(--light-color);
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
  gap: 16px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.cart-action-button {
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.3px;
  border: 2px solid var(--success-color);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
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