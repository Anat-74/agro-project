import type { LocaleCode } from "../types/types"

export const shareButtonTranslations: Record<LocaleCode, {
   successMessage: string
   errorMessage: string
}> = {
  ru: {
    successMessage: "Ссылка скопирована в буфер обмена!",
    errorMessage: "Не удалось скопировать ссылку"
  },
  en: {
    successMessage: "Link copied to clipboard!",
    errorMessage: "Failed to copy link"
  },
  be: {
    successMessage: "Спасылка скапіявана ў буфер абмену!",
    errorMessage: "Не ўдалося скапіяваць спасылку"
  }
}