import type { LocaleCode } from "../types/types"

export const baseFooterTranslations: Record<LocaleCode, {
   titleCompany: string
   titleLegal: string
}> = {
   ru: {
      titleCompany: "Компания",
      titleLegal: "Банковские реквизиты"
   },
   en: {
      titleCompany: "Company",
      titleLegal: "Bank details"
   },
   be: {
      titleCompany: "Кампанія",
      titleLegal: "Банкаўскія рэквізіты"
   }
 }