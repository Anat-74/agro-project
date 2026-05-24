export interface QuickSuggestion {
  id: number
  text: string
  actionType: 'search' | 'latest' | 'recommend'
}

export interface AiPersonality {
  id: number
  tone: string
  responseStyle: string
  useEmojis: boolean
  maxSuggestions: number
}

export interface AiAssistant {
  id: number
  documentId: string
  welcomeTitle: string
  welcomeDescription: string
  aiPersonality: AiPersonality
  quickSuggestions: QuickSuggestion[]
  createdAt: string
  updatedAt: string
  publishedAt: string
  locale: string
  localizations?: AiAssistant[]
}

export type AiAssistantResponse = {
  data: AiAssistant
}

export interface ChatSuggestionsData {
  suggestions: QuickSuggestion[]
  welcomeTitle: string
  welcomeDescription: string
}
