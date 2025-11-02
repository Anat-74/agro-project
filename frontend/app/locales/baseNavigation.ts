import type { LocaleCode } from "../types/types"

export const baseNavigationTranslations: Record<LocaleCode, {
   home: string
   about: string
   services: string
   contacts: string
}> = {
   ru: {
      home: "Главная",
      about: "О нас",
      services: "Услуги",
      contacts: "Контакты"
   },
   be: {
      home: "Галоўная",
      about: "Пра нас",
      services: "Паслугі",
      contacts: "Кантакты"
   }
 }