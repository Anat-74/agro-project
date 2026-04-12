/**
 * Экспорт всех композаблов для AI ассистента
 */

export * from './useChatMessages'
export * from './useChatMCP'
export * from './useChatCart'
export * from './useChatQuickActions'

// Re-export типов для удобства
export type {
  ChatMessage,
  UseChatMessagesReturn
} from './useChatMessages'

export type {
  MCPToolCallResult,
  UseChatMCPReturn
} from './useChatMCP'

export type {
  CartActionResult,
  CartInstruction,
  CallMCPTool,
  UseChatCartReturn
} from './useChatCart'

export type {
  QuickSuggestion,
  QuickSuggestionMap,
  UseChatQuickActionsReturn
} from './useChatQuickActions'