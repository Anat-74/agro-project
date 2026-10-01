/**
 * Composable для управления сообщениями и историей чата
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  clientInstruction?: any // Инструкция для клиента (например, добавление в корзину)
  sources?: Array<{ title: string; url: string; snippet?: string }> // Источники ответа (материалы проекта)
  basis?: 'project' | 'general' // Ответ по материалам проекта или по общим знаниям
}

export interface UseChatMessagesOptions {
  storageKey?: string
  sessionStorageKey?: string
}

export function useChatMessages(options: UseChatMessagesOptions = {}) {
  const {
    storageKey = 'chatAssistantHistory',
    sessionStorageKey = 'chatAssistantSessionId'
  } = options

  const messages = ref<ChatMessage[]>([])
  const sessionId = ref<string | null>(null)

  // Экранируем HTML в тексте сообщения (защита от XSS),
  // кнопки действий добавляются ниже собственным безопасным HTML
  const escapeHtml = (text: string): string =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  // Инлайновая разметка (применяется к уже экранированному тексту):
  // **bold**, *italic*, `code`, [ссылка](url)
  const renderInline = (text: string): string =>
    text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      )

  // Мини-Markdown для ответов ассистента: абзацы, списки, заголовки (как <strong>).
  // Вход уже экранирован escapeHtml — здесь добавляются только «свои» безопасные теги.
  const renderMarkdown = (escaped: string): string => {
    const lines = escaped.split('\n')
    let html = ''
    let listTag: 'ul' | 'ol' | null = null
    const closeList = () => {
      if (listTag) {
        html += `</${listTag}>`
        listTag = null
      }
    }

    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '')
      const bullet = line.match(/^\s*[-*•]\s+(.+)$/)
      const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/)
      const heading = line.match(/^\s*#{1,6}\s+(.+)$/)

      if (bullet || ordered) {
        const tag = bullet ? 'ul' : 'ol'
        if (listTag !== tag) {
          closeList()
          html += `<${tag}>`
          listTag = tag
        }
        html += `<li>${renderInline((bullet || ordered)![1])}</li>`
      } else if (heading) {
        closeList()
        html += `<p><strong>${renderInline(heading[1])}</strong></p>`
      } else if (line.trim() === '') {
        closeList()
      } else {
        closeList()
        html += `<p>${renderInline(line)}</p>`
      }
    }

    closeList()
    return html
  }

  // Форматирование сообщения с добавлением кнопок действий
  const formatMessage = (text: string, clientInstruction?: any): string => {
    let formattedText = renderMarkdown(escapeHtml(text))

    // Добавляем кнопки только для действий, которые требуют подтверждения
    if (clientInstruction) {
      const { type } = clientInstruction
      
      // Действия, которые выполняются автоматически (не показываем кнопки)
      const autoActions = [
        'add_to_cart',
        'remove_from_cart',
        'clear_cart',
        'show_cart',
        'create_recipe_cart',
        'search_products'
      ]
      
      if (!autoActions.includes(type)) {
        // Экранируем JSON для вставки в атрибут onclick
        const escapedInstruction = JSON.stringify(clientInstruction)
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/\\/g, '\\\\')
          .replace(/\n/g, '\\n')

        switch (type) {
          case 'update_cart_quantity':
            formattedText += `<br><br><div class="cart-action-buttons">
              <button class="cart-action-button update-quantity" onclick="window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { detail: { type: 'update_cart_quantity', data: ${escapedInstruction} } }))">
                🔄 Обновить количество
              </button>
              <button class="cart-action-button cancel" onclick="window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { detail: { type: 'cancel' } }))">
                ❌ Отмена
              </button>
            </div>`
            break
            
          // Можно добавить другие действия, требующие подтверждения
        }
      }
    }

    return formattedText
  }

  // Форматирование времени
  const localeMap: Record<string, string> = { ru: 'ru-RU', be: 'be-BY' }
  const formatTime = (timestamp: string, locale: string = 'ru'): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(localeMap[locale] || 'ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Сохранение истории в localStorage
  const saveChatHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(messages.value))
      if (sessionId.value) {
        localStorage.setItem(sessionStorageKey, sessionId.value)
      }
    }
  }

  // Загрузка истории из localStorage
  const loadChatHistory = () => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem(storageKey)
      const savedSessionId = localStorage.getItem(sessionStorageKey)

      if (savedHistory) {
        try {
          messages.value = JSON.parse(savedHistory)
        } catch (e) {
          console.error('Error loading chat history:', e)
        }
      }

      if (savedSessionId) {
        sessionId.value = savedSessionId
      }
    }
  }

  // Очистка истории
  const clearChatHistory = () => {
    console.debug('Clearing chat history, current messages:', messages.value.length)
    messages.value = []
    sessionId.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(sessionStorageKey)
    }
    console.debug('Chat history cleared')
  }

  // Добавление сообщения
  const addMessage = (message: ChatMessage) => {
    messages.value.push(message)
    saveChatHistory()
  }

  // Добавление пользовательского сообщения
  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }
    addMessage(message)
  }

  // Добавление сообщения ассистента
  const addAssistantMessage = (
    content: string,
    clientInstruction?: any,
    sources?: Array<{ title: string; url: string; snippet?: string }>,
    basis?: 'project' | 'general',
  ) => {
    const message: ChatMessage = {
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      clientInstruction,
      sources: sources?.length ? sources : undefined,
      basis
    }
    addMessage(message)
  }

  // Добавление сообщения об ошибке
  const addErrorMessage = (error: string) => {
    const message: ChatMessage = {
      role: 'assistant',
      content: `❌ Ошибка: ${error}`,
      timestamp: new Date().toISOString()
    }
    addMessage(message)
  }

  return {
    messages,
    sessionId,
    formatMessage,
    formatTime,
    saveChatHistory,
    loadChatHistory,
    clearChatHistory,
    addMessage,
    addUserMessage,
    addAssistantMessage,
    addErrorMessage
  }
}

export type UseChatMessagesReturn = ReturnType<typeof useChatMessages>