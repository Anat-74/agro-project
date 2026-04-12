/**
 * Composable для работы с быстрыми предложениями чата
 */

import type { CartInstruction } from './useChatCart'

export const QUICK_SUGGESTIONS = [
  'Собери корзину для борща',
  'Найди яблоко',
  'Покажи корзину',
  'Очисти корзину',
  'Добавь картофель',
  'Найди овощи',
  'Собери завтрак',
  'Собери куриный суп',
  'Собери пиццу',
  'Собери смузи'
] as const

export type QuickSuggestion = typeof QUICK_SUGGESTIONS[number]

export interface QuickSuggestionMap {
  [key: string]: CartInstruction
}

export const QUICK_SUGGESTION_MAP: QuickSuggestionMap = {
  'Собери корзину для борща': {
    type: 'create_recipe_cart',
    data: {
      recipe: 'borscht',
      recipeName: 'Борщ',
      clearCart: true
    }
  },
  'Найди яблоко': {
    type: 'search_products',
    data: {
      query: 'яблоко',
      limit: 5,
      autoAdd: false
    }
  },
  'Покажи корзину': {
    type: 'show_cart'
  },
  'Очисти корзину': {
    type: 'clear_cart'
  },
  'Добавь картофель': {
    type: 'add_to_cart',
    data: {
      productName: 'картофель',
      quantity: 1,
      categorySlug: 'vegetables'
    }
  },
  'Найди овощи': {
    type: 'search_products',
    data: {
      query: '',
      category: 'vegetables',
      limit: 4
    }
  },
  'Собери завтрак': {
    type: 'create_recipe_cart',
    data: {
      recipe: 'breakfast',
      recipeName: 'Завтрак',
      clearCart: true
    }
  },
  'Собери куриный суп': {
    type: 'create_recipe_cart',
    data: {
      recipe: 'soup',
      recipeName: 'Куриный суп',
      clearCart: true
    }
  },
  'Собери пиццу': {
    type: 'create_recipe_cart',
    data: {
      recipe: 'pizza',
      recipeName: 'Домашняя пицца',
      clearCart: true
    }
  },
  'Собери смузи': {
    type: 'create_recipe_cart',
    data: {
      recipe: 'smoothie',
      recipeName: 'Фруктовый смузи',
      clearCart: true
    }
  }
}

export interface UseChatQuickActionsOptions {
  suggestions?: readonly string[]
  suggestionMap?: QuickSuggestionMap
}

export function useChatQuickActions(options: UseChatQuickActionsOptions = {}) {
  const {
    suggestions = QUICK_SUGGESTIONS,
    suggestionMap = QUICK_SUGGESTION_MAP
  } = options

  /**
   * Обрабатывает быстрое предложение
   */
  const processQuickSuggestion = async (
    suggestion: string,
    executeCartAction: (instruction: CartInstruction) => Promise<any>,
    addUserMessage: (content: string) => void,
    addAssistantMessage: (content: string, clientInstruction?: any) => void,
    saveChatHistory: () => void,
    scrollToBottom: () => void
  ) => {
    // Проверяем, есть ли инструкция для этого предложения
    const instruction = suggestionMap[suggestion]
    
    if (instruction) {
      // Добавляем сообщение пользователя
      addUserMessage(suggestion)
      
      // Выполняем действие
      const result = await executeCartAction(instruction)
      
      // Добавляем результат
      addAssistantMessage(result.message)
      
      // Если есть предложение (например, добавить найденный товар)
      if (result.suggestion) {
        // Добавляем кнопку для предложения
        const suggestionMessage = {
          role: 'assistant' as const,
          content: result.message + '<br><br><button class="cart-action-button add-to-cart" onclick="window.dispatchEvent(new CustomEvent(\'chat-assistant-cart-action\', { detail: ' + JSON.stringify(result.suggestion).replace(/"/g, '&quot;') + ' }))">✅ Добавить в корзину</button>',
          timestamp: new Date().toISOString(),
          clientInstruction: result.suggestion
        }
        // Заменяем последнее сообщение
        // messages.value[messages.value.length - 1] = suggestionMessage
      }
      
      saveChatHistory()
      scrollToBottom()
    } else {
      // Для других сообщений используем обычный AI
      return suggestion // Возвращаем текст для обычной обработки
    }
  }

  return {
    QUICK_SUGGESTIONS: suggestions,
    QUICK_SUGGESTION_MAP: suggestionMap,
    processQuickSuggestion
  }
}

export type UseChatQuickActionsReturn = ReturnType<typeof useChatQuickActions>