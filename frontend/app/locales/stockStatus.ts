import type { LocaleCode } from "../types/types"

export const stockStatusTranslations: Record<LocaleCode, {
   inStock: string
   toOrder: string
}> = {
   ru: {
      inStock: "В наличии",
     toOrder: "Под заказ"
   },
   en: {
      inStock: "In stock",
      toOrder: "To order"
   }, 
   be: {
      inStock: "У наяўнасці",
      toOrder: "Пад замову"
   }
 }