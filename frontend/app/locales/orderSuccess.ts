import type { LocaleCode } from "../types/types"

export const orderSuccessTranslations: Record<LocaleCode, {
  title: string
  notice: string
  thanks: string
}> = {
  ru: {
    title: "Заказ #{orderId} успешно сформирован!",
    notice: "В ближайшее время с вами свяжутся.",
    thanks: "Благодарим за заказ!"
  },
  en: {
    title: "Order #{orderId} successfully placed!",
    notice: "We will contact you shortly.",
    thanks: "Thank you for your order!"
  },
  be: {
    title: "Заказ #{orderId} паспяхова створаны!",
    notice: "У бліжэйшы час з вамі звяжуцца.",
    thanks: "Дзякуем за заказ!"
  }
}