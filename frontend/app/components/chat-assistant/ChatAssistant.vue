<script setup lang="ts">
import { useChatMessages } from "../../composables/chat-assistant/useChatMessages";
import { useChatCart } from "../../composables/chat-assistant/useChatCart";
import { parseAIResponse } from "../../composables/chat-assistant/useChatAssistant";
import { chatAssistantTranslations } from "../../locales/chat-assistant";
import ChatProductCard from "./ChatProductCard.vue";
import VoiceInput from "./VoiceInput.vue";
const { currentLocale } = useLocale();
const chatMessages = useChatMessages();
const chatCart = useChatCart();
const t = computed(() => chatAssistantTranslations[currentLocale.value]);

// Реактивные переменные
const inputMessage = ref("");
const isLoading = ref(false);
const chatBody = ref<HTMLElement | null>(null);

const dialogElement = useTemplateRef<HTMLDialogElement>("chat-dialog");
const { open, close, isOpen } = useDialog("chatAssistant", dialogElement, {
  useShowMethod: true,
});

provide('openChat', open)

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
  addErrorMessage,
} = chatMessages;

const { cartStore, setupCartListeners } = chatCart;

// Быстрые предложения — загружаются из Strapi
const quickSuggestions = ref<string[]>([]);

// Контекст последнего поиска для связки "найди → добавь в корзину"
const lastSearchResults = ref<any[]>([]);

// Основные функции компонента
const openChat = () => {
  open?.();
  loadChatHistory();
};

const closeChat = () => {
  close?.();
};

const sendQuickMessage = async (message: string) => {
  addUserMessage(message);
  inputMessage.value = "";
  isLoading.value = true;
  scrollToBottom();

  try {
    const response = await $fetch("/api/chat-assistant", {
      method: "POST",
      body: JSON.stringify({
        message,
        sessionId: sessionId.value,
        tools: [],
        cartState: cartStore.items.length,
        lastSearchResults: lastSearchResults.value,
        locale: currentLocale.value,
      }),
    });

    const parsedResponse = parseAIResponse(response);
    processAIResponse(parsedResponse);
  } catch {
    addErrorMessage(t.value.errorQuickMessage);
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

const sendMessage = async () => {
  const message = inputMessage.value.trim();
  if (!message || isLoading.value) return;

  addUserMessage(message);
  inputMessage.value = "";
  isLoading.value = true;
  scrollToBottom();

  try {
    const response = await $fetch("/api/chat-assistant", {
      method: "POST",
      body: JSON.stringify({
        message,
        sessionId: sessionId.value,
        tools: [],
        cartState: cartStore.items.length,
        lastSearchResults: lastSearchResults.value,
        locale: currentLocale.value,
      }),
    });

    const parsedResponse = parseAIResponse(response);
    processAIResponse(parsedResponse);
  } catch {
    addErrorMessage(t.value.errorSendMessage);
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

const processAIResponse = (response: any) => {
  if (!response || !response.success) {
    handleAIError(response?.error || t.value.errorDefault);
    return;
  }

  if (response.sessionId) {
    sessionId.value = response.sessionId;
  }

  if (response.searchResults) {
    lastSearchResults.value = response.searchResults;
  }

  addAssistantMessage(response.message, response.clientInstruction);

  if (response.tool_calls && response.tool_calls.length > 0) {
    console.debug("Tool calls received:", response.tool_calls);
    processToolCalls(response.tool_calls);
  }

  if (response.clientInstruction) {
    handleClientInstruction(response.clientInstruction);
  }

  saveChatHistory();
  scrollToBottom();
};

const handleAIError = (error: any) => {
  console.error("AI error:", error);
  addErrorMessage(
    `${t.value.errorPrefix}: ${error?.message || error || t.value.errorDefault}`,
  );
  scrollToBottom();
};

const processToolCalls = (toolCalls: any[]) => {
  if (!toolCalls || toolCalls.length === 0) return;
  console.debug("Processing tool calls:", toolCalls);

  toolCalls.forEach((toolCall, index) => {
    const { function: func } = toolCall;
    console.debug(
      `Tool call ${index + 1}: ${func.name} with args:`,
      func.arguments,
    );
  });
};

const handleClientInstruction = async (instruction: any) => {
  if (!instruction) return;
  console.debug("Client instruction received:", instruction);

  if (instruction.type === "show_products") return;

  const cartActionTypes = [
    "add_to_cart",
    "remove_from_cart",
    "clear_cart",
    "show_cart",
    "create_recipe_cart",
    "search_products",
  ];

  if (cartActionTypes.includes(instruction.type)) {
    try {
      const result = await chatCart.executeCartAction(instruction);

      if (result.message && result.message.trim() !== "") {
        addAssistantMessage(result.message);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error executing cart action:", error);
      addErrorMessage(
        `❌ ${t.value.errorCartAction}: ${error instanceof Error ? error.message : t.value.errorDefault}`,
      );
      scrollToBottom();
    }
    return;
  }

  switch (instruction.type) {
    case "update_cart":
      break;
    case "tool_calls":
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

const onVoiceResult = (text: string) => {
  inputMessage.value = text;
  nextTick(() => sendMessage());
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && isOpen.value) {
    closeChat();
  }
};

// Функция getQuickSuggestionInstruction удалена - быстрые предложения теперь используют основной AI pipeline

const loadQuickSuggestions = async () => {
  try {
    const data = await $fetch<ChatSuggestionsData>(
      `/api/chat-suggestions?locale=${currentLocale.value}`,
    );
    quickSuggestions.value = data.suggestions.map((s) => s.text);
  } catch {
    quickSuggestions.value = [
      "Найди ягоды для варенья",
      "Что есть со скидкой?",
      "Подбери фрукты к чаю",
      "Покажи новинки",
      "Что посоветуешь?",
    ];
  }
};

watch(currentLocale, () => {
  loadQuickSuggestions();
});

onMounted(() => {
  loadQuickSuggestions();
  window.addEventListener("keydown", handleKeyDown);
  const cleanupCartListeners = setupCartListeners(
    messages,
    saveChatHistory,
    scrollToBottom,
  );

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    cleanupCartListeners();
  });
});
</script>

<template>
  <div class="chat-assistant">
    <ChatAssistantButton
      v-if="!isOpen"
      variant="chat-toggle"
      @click="openChat"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      </svg>
      <span>{{ t.title }}</span>
    </ChatAssistantButton>

    <dialog ref="chat-dialog" class="chat-assistant__modal">
      <div class="chat-assistant__items">
      <header class="chat-assistant__header" aria-label="chat assistant header">
        <div class="chat-assistant__header-content">
          <div class="chat-assistant__info">
            <div class="chat-assistant__avatar">
              <Icon name="material-symbols:chat" />
            </div>
            <div>
              <h3 class="chat-assistant__title">{{ t.title }}</h3>
              <p class="chat-assistant__subtitle">{{ t.subtitle }}</p>
            </div>
          </div>
          <div class="chat-assistant__actions">
            <ChatAssistantButton
              v-if="messages.length > 0"
              variant="delete"
              :aria-label="t.clearHistory"
              :title="t.clearHistoryTitle"
              @click="clearChatHistory"
            />
            <ChatAssistantButton
              variant="close"
              :aria-label="t.closeChat"
              :title="t.closeChatTitle"
              @click="closeChat"
            >
              <Icon name="material-symbols-light:close" />
            </ChatAssistantButton>
          </div>
        </div>
      </header>

      <div class="chat-assistant__body" ref="chatBody">
        <div v-if="messages.length === 0" class="chat-assistant__empty">
          <div class="chat-assistant__empty-icon">
            <Icon name="material-symbols:chat" />
          </div>
          <h4 class="chat-assistant__empty-title">{{ t.emptyTitle }}</h4>
          <p class="chat-assistant__empty-description">
            {{ t.emptyDescription }}
          </p>
          <div class="chat-assistant__suggestions">
            <ChatAssistantButton
              v-for="suggestion in quickSuggestions"
              :key="suggestion"
              variant="suggestion"
              @click="sendQuickMessage(suggestion)"
            >
              {{ suggestion }}
            </ChatAssistantButton>
          </div>
        </div>

        <div v-else class="messages-container">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="[
              'message',
              message.role === 'user' ? 'message_user' : 'message_assistant',
            ]"
          >
            <div class="message__avatar">
              <Icon
                v-if="message.role === 'assistant'"
                name="material-symbols:chat"
              />
              <Icon v-else name="material-symbols:person" />
            </div>
            <div class="message__content">
              <div
                class="message__text"
                v-html="
                  formatMessage(message.content, message.clientInstruction)
                "
              ></div>
              <div class="message__time">
                {{ formatTime(message.timestamp, currentLocale) }}
              </div>
              <div
                v-if="message.clientInstruction?.type === 'show_products'"
                class="message__products"
              >
                <ChatProductCard
                  v-for="product in message.clientInstruction.data.products"
                  :key="product.documentId"
                  :product="product"
                />
              </div>
            </div>
          </div>

          <div v-if="isLoading" class="message message_assistant">
            <div class="message__avatar">
              <Icon name="material-symbols:chat" />
            </div>
            <div class="message__content">
              <div class="message__typing">
                <span class="message__dot"></span>
                <span class="message__dot"></span>
                <span class="message__dot"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="chat-assistant__footer" aria-label="chat assistant footer">
        <form @submit.prevent="sendMessage" class="chat-assistant__form">
          <ClientOnly>
            <VoiceInput
              :disabled="isLoading"
              :locale="currentLocale"
              @on-result="onVoiceResult"
            />
          </ClientOnly>
          <UInput
            v-model="inputMessage"
            :placeholder="t.placeholder"
            :disabled="isLoading"
          />
          <ChatAssistantButton
            type="submit"
            variant="send"
            :isDisabled="!inputMessage.trim() || isLoading"
            :aria-label="t.sendButton"
          />
        </form>
        <div class="chat-assistant__footer-info">
          <p class="chat-assistant__footer-text">
            {{ t.footerText }}
          </p>
        </div>
      </footer>
      </div>
    </dialog>
  </div>
</template>

<style scoped lang="scss">
.chat-assistant__modal {
  display: none;

  &[open] {
  display: block;
  position: fixed;
  margin-inline-end: 0;
  bottom: toRem(24);
  right: toRem(24);
  z-index: 1001;
  width: toRem(400);
  max-width: calc(100vw - toRem(48));
  height: toRem(600);
  max-height: calc(100vh - toRem(48));
  background: var(--light-color);
  border: none;
  border-radius: toRem(16);
  padding: 0;

  &::backdrop {
    background: rgba(0, 0, 0, 0.3);
  }
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  }
}

.chat-assistant__items {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-assistant__header {
  flex-shrink: 0;
  padding: toRem(16) toRem(20);
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: var(--light-color);
}

.chat-assistant__header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-assistant__actions {
  display: flex;
  gap: toRem(8);
  align-items: center;
}

.chat-assistant__info {
  display: flex;
  align-items: center;
  gap: toRem(12);
}

.chat-assistant__avatar {
  width: toRem(48);
  height: toRem(48);
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  .icon {
    color: var(--light-color);
  }
}

.chat-assistant__title {
  margin: 0;
  font-weight: 600;
  @include adaptiveValue("font-size", 16, 14);
}

.chat-assistant__subtitle {
  margin: toRem(2) 0 0;
  opacity: 0.9;
  @include adaptiveValue("font-size", 12, 11);
}

.chat-assistant__body {
  flex: 1;
  overflow-y: auto;
  padding: toRem(20);
  background: var(--bg);
}

.chat-assistant__empty {
  text-align: center;
  padding: toRem(40) toRem(20);
}

.chat-assistant__empty-icon {
  width: toRem(80);
  height: toRem(80);
  margin: 0 auto toRem(20);
  color: var(--primary-color);

  .icon {
    width: 100%;
    height: 100%;
  }
}

.chat-assistant__empty-title {
  margin: 0 0 toRem(8);
  font-weight: 600;
  color: var(--color);
  @include adaptiveValue("font-size", 18, 16);
}

.chat-assistant__empty-description {
  margin: 0 0 toRem(24);
  line-height: 1.5;
  color: var(--gray-color);
  @include adaptiveValue("font-size", 14, 13);
}

.chat-assistant__suggestions {
  display: flex;
  flex-direction: column;
  gap: toRem(8);
  max-width: toRem(300);
  margin: 0 auto;
}

.messages-container {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: toRem(16);
}

.message {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  gap: toRem(12);
  align-content: start;
  animation: fadeIn 0.3s ease;

  &--user {
    .message__avatar {
      order: 1;
      background: var(--success-color);
    }

    .message__content {
      order: 0;
    }

    .message__text {
      background: var(--success-color);
      color: var(--light-color);
      border-radius: toRem(18) toRem(18) toRem(4) toRem(18);
    }
  }

  &--assistant {
    .message__avatar {
      background: var(--gray-color);
    }

    .message__text {
      background: var(--light-color);
      color: var(--color);
      border: toRem(1) solid var(--border-color);
      border-radius: toRem(18) toRem(18) toRem(18) toRem(4);
    }
  }
}

.message__avatar {
  width: toRem(40);
  height: toRem(40);
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

.message__content {
  display: flex;
  flex-direction: column;
  gap: toRem(4);
  max-width: 70%;
}

.message__text {
  padding: toRem(12) toRem(16);
  line-height: 1.5;
  word-wrap: break-word;
  @include adaptiveValue("font-size", 14, 13);
}

.message__time {
  color: var(--gray-color);
  @include adaptiveValue("font-size", 11, 10);
}

.message__products {
  display: flex;
  flex-direction: column;
  gap: toRem(8);
  margin-top: toRem(8);
}

.message__typing {
  display: flex;
  gap: toRem(4);
  padding: toRem(12) toRem(16);
}

.message__dot {
  width: toRem(8);
  height: toRem(8);
  background: var(--gray-color);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;

  &:nth-child(1) {
    animation-delay: -0.32s;
  }

  &:nth-child(2) {
    animation-delay: -0.16s;
  }
}

.chat-assistant__footer {
  flex-shrink: 0;
  padding: toRem(16) toRem(20);
  background: var(--light-color);
  border-top: toRem(1) solid var(--border-color);
}

.chat-assistant__form {
  display: flex;
  gap: toRem(8);
  margin-bottom: toRem(8);
}

.chat-assistant__input {
  flex: 1;
  padding: toRem(12) toRem(16);
  border: toRem(1) solid var(--border-color);
  border-radius: toRem(24);
  outline: none;
  transition: border-color var(--transition-duration);
  @include adaptiveValue("font-size", 14, 13);

  &:focus {
    border-color: var(--success-color);
  }

  &:disabled {
    background: var(--bg);
    cursor: not-allowed;
  }
}

.chat-assistant__footer-info {
  text-align: center;
}

.chat-assistant__footer-text {
  margin: 0;
  color: var(--gray-color);
  line-height: 1.4;
  @include adaptiveValue("font-size", 11, 10);
}

.chat-assistant__cart-actions {
  display: flex;
  gap: toRem(16);
  margin-top: toRem(16);
  flex-wrap: wrap;
}

.chat-assistant__cart-action {
  padding: toRem(14) toRem(24);
  border-radius: toRem(12);
  font-weight: 700;
  letter-spacing: 0.3px;
  border: toRem(2) solid var(--success-color);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  align-items: center;
  gap: toRem(8);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  @include adaptiveValue("font-size", 16, 14);

  @include hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  &--add {
    background: linear-gradient(135deg, var(--success-color), #2e7d32);
    color: var(--light-color);
  }

  &--remove {
    background: linear-gradient(135deg, var(--danger-color), #c62828);
    color: var(--light-color);
  }

  &--update {
    background: linear-gradient(135deg, #2196f3, #1565c0);
    color: var(--light-color);
  }

  &--clear {
    background: linear-gradient(135deg, #ff9800, #ef6c00);
    color: var(--light-color);
  }

  &--show {
    background: linear-gradient(135deg, #9c27b0, #6a1b9a);
    color: var(--light-color);
  }

  &--cancel {
    background: var(--bg);
    color: var(--gray-color);
    border: toRem(1) solid var(--border-color);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(toRem(10));
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
    transform: translateY(toRem(-6));
  }
}

@media (max-width: $mobile) {
  .chat-assistant__modal {
    width: calc(100vw - toRem(32));
    height: calc(100vh - toRem(100));
    bottom: toRem(16);
    right: toRem(16);
    max-width: none;
    max-height: none;
  }

  .chat-assistant__toggle {
    bottom: toRem(16);
    right: toRem(16);
  }

  .message__content {
    max-width: 80%;
  }
}
</style>
