/**
 * Composable для работы с корзиной через чат
 */

import { useCartStore } from '../../stores/useCartStore'

export interface CartActionResult {
  success: boolean
  message: string
  suggestion?: any
  data?: any
  error?: string
  fallback?: string
  note?: string
  details?: any
}

export interface CartInstruction {
  type: string
  data?: any
}

// Тип для функции callMCPTool
export type CallMCPTool = (toolName: string, arguments_: any) => Promise<any>

/**
 * Выполняет действие с корзиной на основе инструкции от AI
 */
export async function executeCartAction(
  instruction: CartInstruction,
  callMCPTool: CallMCPTool
): Promise<CartActionResult> {
  try {
    if (!instruction || !instruction.type) {
      return {
        success: false,
        message: '❌ Неверная инструкция: отсутствует тип действия'
      }
    }
    
    const { type, data } = instruction
    
    switch (type) {
      case 'add_to_cart':
        // Если есть productId, добавляем напрямую
        if (data?.productId && data?.product) {
          try {
            window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { 
              detail: { type: 'add_to_cart', data } 
            }))
            return {
              success: true,
              message: ''
            }
          } catch (eventError) {
            console.error('Error dispatching cart event:', eventError)
            return {
              success: false,
              message: `❌ Ошибка при добавлении товара в корзину: ${eventError instanceof Error ? eventError.message : 'Неизвестная ошибка'}`
            }
          }
        }
        
        // Если есть только название товара, ищем через MCP
        if (data?.productName) {
          try {
            // Ищем товар через MCP
            const searchResult = await callMCPTool('search_products', {
              query: data.productName,
              limit: 1
            })
            
            // Проверяем результат поиска
            if (!searchResult) {
              return {
                success: false,
                message: '❌ Ошибка при поиске товара: пустой ответ от MCP'
              }
            }
            
            if (searchResult.success === false) {
              return {
                success: false,
                message: `❌ Ошибка при поиске товара: ${searchResult.error || 'Неизвестная ошибка MCP'}`
              }
            }
            
            if (searchResult.products && searchResult.products.length > 0) {
              const product = searchResult.products[0]
              
              try {
                // Добавляем найденный товар
                window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { 
                  detail: { 
                    type: 'add_to_cart', 
                    data: {
                      productId: product.documentId,
                      product: {
                        id: product.documentId,
                        documentId: product.documentId,
                        name: product.name,
                        price: product.price,
                        slug: product.name.toLowerCase().replace(/ /g, '-'),
                        image: product.image ? [{ url: product.image }] : []
                      },
                      quantity: data.quantity || 1,
                      categorySlug: data.categorySlug || 'vegetables'
                    }
                  } 
                }))
                
                return {
                  success: true,
                  message: ''
                }
              } catch (eventError) {
                console.error('Error dispatching cart event for found product:', eventError)
                return {
                  success: false,
                  message: `❌ Ошибка при добавлении найденного товара: ${eventError instanceof Error ? eventError.message : 'Неизвестная ошибка'}`
                }
              }
            } else {
              return {
                success: false,
                message: `❌ Товар "${data.productName}" не найден`,
                suggestion: 'Попробуйте уточнить название или выбрать другой товар'
              }
            }
          } catch (error) {
            console.error('Error searching product:', error)
            return {
              success: false,
              message: `❌ Ошибка при поиске товара: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
              fallback: 'Попробуйте добавить товар через интерфейс магазина'
            }
          }
        }
        
        return {
          success: false,
          message: '❌ Не указан товар для добавления',
          suggestion: 'Укажите название товара или выберите из списка'
        }
        
      case 'remove_from_cart':
        try {
          if (!data?.productId) {
            return {
              success: false,
              message: '❌ Не указан ID товара для удаления'
            }
          }
          
          window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { 
            detail: { type: 'remove_from_cart', data } 
          }))
          return {
            success: true,
            message: '✅ Товар удален из корзины'
          }
        } catch (error) {
          console.error('Error removing from cart:', error)
          return {
            success: false,
            message: `❌ Ошибка при удалении товара: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
          }
        }
        
      case 'clear_cart':
        try {
          window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { 
            detail: { type: 'clear_cart' } 
          }))
          return {
            success: true,
            message: '✅ Корзина очищена'
          }
        } catch (error) {
          console.error('Error clearing cart:', error)
          return {
            success: false,
            message: `❌ Ошибка при очистке корзины: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
          }
        }
        
      case 'show_cart':
        try {
          window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { 
            detail: { type: 'show_cart' } 
          }))
          return {
            success: true,
            message: '🛒 Показана корзина'
          }
        } catch (error) {
          console.error('Error showing cart:', error)
          return {
            success: false,
            message: `❌ Ошибка при отображении корзины: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
          }
        }
        
      case 'create_recipe_cart':
        try {
          // Для рецептов нужно добавить несколько товаров
          if (!data?.recipe && !data?.customIngredients) {
            return {
              success: false,
              message: '❌ Не указан рецепт или ингредиенты',
              suggestion: 'Укажите рецепт (например, "borscht") или список ингредиентов'
            }
          }
          
          // Используем MCP для создания корзины рецепта
          const recipeResult = await callMCPTool('create_recipe_cart', {
            recipe: data.recipe,
            customIngredients: data.customIngredients,
            clearCart: data.clearCart !== false
          })
          
          if (recipeResult.success === false) {
            return {
              success: false,
              message: `❌ Ошибка при создании корзины рецепта: ${recipeResult.error || 'Неизвестная ошибка'}`
            }
          }
          
          // Если MCP вернул инструкцию, выполняем ее
          if (recipeResult.instruction) {
            // Очищаем корзину если нужно
            if (data.clearCart !== false) {
              try {
                window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { 
                  detail: { type: 'clear_cart' } 
                }))
              } catch (clearError) {
                console.error('Error clearing cart for recipe:', clearError)
                // Продолжаем выполнение даже при ошибке очистки
              }
            }
            
            // Для рецептов с ингредиентами
            if (recipeResult.ingredients && Array.isArray(recipeResult.ingredients)) {
              const addedIngredients: string[] = []
              
              // Добавляем каждый ингредиент с задержкой
              recipeResult.ingredients.forEach((ingredient: any, index: number) => {
                setTimeout(async () => {
                  try {
                    // Ищем товар по названию
                    const searchResult = await callMCPTool('search_products', {
                      query: ingredient.name,
                      limit: 1
                    })
                    
                    if (searchResult.success && searchResult.products.length > 0) {
                      const product = searchResult.products[0]
                      
                      window.dispatchEvent(new CustomEvent('chat-assistant-cart-action', { 
                        detail: { 
                          type: 'add_to_cart', 
                          data: { 
                            productId: product.documentId,
                            product: {
                              id: product.documentId,
                              documentId: product.documentId,
                              name: product.name,
                              price: product.price,
                              slug: product.name.toLowerCase().replace(/ /g, '-'),
                              image: product.image ? [{ url: product.image }] : []
                            },
                            quantity: ingredient.quantity || 1,
                            categorySlug: product.category || 'vegetables'
                          }
                        } 
                      }))
                      
                      addedIngredients.push(ingredient.name)
                    }
                  } catch (searchError) {
                    console.error(`Error searching ingredient ${ingredient.name}:`, searchError)
                  }
                }, index * 300) // Задержка между добавлениями
              })
              
              return {
                success: true,
                message: `✅ Корзина для "${recipeResult.recipe || 'рецепта'}" создана!\n\nДобавляю ${recipeResult.ingredientCount || recipeResult.ingredients.length} ингредиентов...`,
                note: 'Ингредиенты добавляются с небольшой задержкой'
              }
            }
          }
          
          return {
            success: true,
            message: `✅ Корзина для "${recipeResult.recipe || 'рецепта'}" создана!`,
            details: recipeResult
          }
        } catch (error) {
          console.error('Error creating recipe cart:', error)
          return {
            success: false,
            message: `❌ Ошибка при создании корзины рецепта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
            fallback: 'Попробуйте добавить ингредиенты по отдельности'
          }
        }
        
      case 'search_products':
        // Используем MCP для поиска товаров
        try {
          if (!data?.query && !data?.category) {
            return {
              success: false,
              message: '❌ Не указан запрос для поиска',
              suggestion: 'Укажите что искать (например, "яблоки", "овощи")'
            }
          }
          
          console.log(`Searching for: query="${data.query}", category="${data.category}"`)
          const result = await callMCPTool('search_products', {
            query: data.query,
            category: data.category,
            limit: data.limit || 5
          })
          console.log('Search result:', JSON.stringify(result, null, 2))
          
          // Проверяем результат
          if (!result) {
            return {
              success: false,
              message: '❌ Пустой ответ от поиска',
              suggestion: 'Попробуйте другой запрос'
            }
          }
          
          if (result.success === false) {
            return {
              success: false,
              message: `❌ Ошибка поиска: ${result.error || 'Неизвестная ошибка'}`,
              note: result.note || ''
            }
          }
          
          if (result.products && result.products.length > 0) {
            let message = `🍎 **Найдены яблоки!**\n\n`
            
            result.products.forEach((product: any, index: number) => {
              message += `**${index + 1}. ${product.name}**\n`
              message += `   💰 Цена: ${product.price} руб\n`
              if (product.description) {
                message += `   📝 ${product.description.substring(0, 100)}...\n`
              }
              message += `\n`
            })
            
            if (result.total > result.products.length) {
              message += `\n... и еще ${result.total - result.products.length} товаров`
            }
            
            if (result.note) {
              message += `\n\n_${result.note}_`
            }
            
            // Добавляем предложение добавить в корзину
            const firstProduct = result.products[0]
            message += `\n\nХотите добавить **"${firstProduct.name}"** в корзину?`
            
            return {
              success: true,
              message,
              data: result,
              suggestion: {
                type: 'add_to_cart',
                data: {
                  productId: firstProduct.documentId,
                  product: firstProduct,
                  quantity: 1
                }
              }
            }
          } else {
            return {
              success: true,
              message: `🔍 По запросу "${data.query || data.category}" ничего не найдено.\n\nПопробуйте:\n• Изменить запрос\n• Посмотреть все товары в категории\n• Использовать другое название`,
              suggestion: 'Попробуйте изменить запрос или выбрать другую категорию',
              data: result
            }
          }
        } catch (error) {
          console.error('Search error:', error)
          return {
            success: false,
            message: `❌ Ошибка при поиске: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
            fallback: 'Попробуйте поискать через интерфейс магазина'
          }
        }
    }
    
    return {
      success: false,
      message: 'Неизвестное действие'
    }
  } catch (error) {
    console.error('Error executing cart action:', error)
    return {
      success: false,
      message: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    }
  }
}

/**
 * Обработчик событий действий с корзиной
 */
export function createCartActionHandler(
  cartStore: any,
  messages: { value: any[] },
  saveChatHistory: () => void,
  scrollToBottom: () => void
) {
  return (event: CustomEvent) => {
    console.log('[ChatAssistant] Cart action received:', event.detail)
    const { type, data } = event.detail

    switch (type) {
      case 'add_to_cart':
        if (data.product) {
          // Создаем объект продукта для добавления в корзину
          // В Strapi v5 сервер возвращает documentId в поле id
          const product = {
            id: data.product.id,
            name: data.product.name,
            price: data.product.price,
            slug: data.product.slug,
            // Обрабатываем image (может быть строкой или массивом)
            image: typeof data.product.image === 'string' 
              ? [{ url: data.product.image }] 
              : Array.isArray(data.product.image)
                ? data.product.image
                : [],
            // Добавляем documentId для совместимости с обновленным store
            documentId: data.product.id
          }

          // Добавляем продукт в корзину
          cartStore.addToCart(
            product as any,
            data.categorySlug || 'fruits',
            null
          )

          // Не добавляем сообщение - оно уже будет показано через executeCartAction
        } else if (data.productId) {
          // Если нет полной информации о продукте, показываем сообщение
          const infoMessage = {
            role: 'assistant' as const,
            content: `Для добавления товара с ID ${data.productId} в корзину перейдите на страницу товара.`,
            timestamp: new Date().toISOString()
          }
          messages.value.push(infoMessage)
          saveChatHistory()
          scrollToBottom()
        }
        break

      case 'remove_from_cart':
        if (data.productId) {
          // В Strapi v5 productId может быть строкой (documentId)
          const productId = data.productId
          cartStore.removeFromCart(productId)

          const successMessage = {
            role: 'assistant' as const,
            content: `✅ Товар с ID ${productId} удален из корзины.`,
            timestamp: new Date().toISOString()
          }
          messages.value.push(successMessage)
          saveChatHistory()
          scrollToBottom()
        }
        break

      case 'update_cart_quantity':
        if (data.productId && data.quantity) {
          // В Strapi v5 productId может быть строкой (documentId)
          const productId = data.productId
          const quantity = Number(data.quantity)
          cartStore.updateQuantity(productId, quantity)

          const successMessage = {
            role: 'assistant' as const,
            content: `✅ Количество товара с ID ${productId} обновлено до ${quantity}.`,
            timestamp: new Date().toISOString()
          }
          messages.value.push(successMessage)
          saveChatHistory()
          scrollToBottom()
        }
        break

      case 'clear_cart':
        cartStore.clearCart()

        const successMessage = {
          role: 'assistant' as const,
          content: '✅ Корзина успешно очищена.',
          timestamp: new Date().toISOString()
        }
        messages.value.push(successMessage)
        saveChatHistory()
        scrollToBottom()
        break

      case 'show_cart':
        // Показываем сообщение о корзине
        const cartItems = cartStore.items
        const totalItems = cartStore.totalItems
        const totalPrice = cartStore.totalPrice

        let cartMessage = '🛒 Содержимое вашей корзины:\n\n'

        if (cartItems.length === 0) {
          cartMessage += 'Корзина пуста.'
        } else {
          cartItems.forEach((item: any, index: number) => {
            cartMessage += `${index + 1}. ${item.product.name} - ${item.quantity} × ${item.product.price} ₽ = ${item.product.price * item.quantity} ₽\n`
          })
          cartMessage += `\nВсего товаров: ${totalItems}\n`
          cartMessage += `Общая сумма: ${totalPrice} ₽`
        }

        const cartInfoMessage = {
          role: 'assistant' as const,
          content: cartMessage,
          timestamp: new Date().toISOString()
        }
        messages.value.push(cartInfoMessage)
        saveChatHistory()
        scrollToBottom()
        break

      case 'cancel':
        // Просто закрываем действие, ничего не делаем
        const cancelMessage = {
          role: 'assistant' as const,
          content: 'Действие отменено.',
          timestamp: new Date().toISOString()
        }
        messages.value.push(cancelMessage)
        saveChatHistory()
        scrollToBottom()
        break
    }
  }
}

/**
 * Composable для работы с корзиной через чат
 */
export function useChatCart() {
  const cartStore = useCartStore()
  
  // Функция для настройки обработчиков событий корзины
  const setupCartListeners = (
    messages: { value: any[] },
    saveChatHistory: () => void,
    scrollToBottom: () => void
  ) => {
    const handler = createCartActionHandler(cartStore, messages, saveChatHistory, scrollToBottom)
    
    // Добавляем обработчик событий для действий с корзиной
    window.addEventListener('chat-assistant-cart-action', handler as EventListener)
    
    // Возвращаем функцию для очистки
    return () => {
      window.removeEventListener('chat-assistant-cart-action', handler as EventListener)
    }
  }

  return {
    cartStore,
    setupCartListeners,
    executeCartAction,
    createCartActionHandler
  }
}

export type UseChatCartReturn = ReturnType<typeof useChatCart>