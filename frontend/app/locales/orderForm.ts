import type { LocaleCode } from "../types/types"

export const orderFormTranslations: Record<LocaleCode, {
   title: string
   email: string
   phone: string
   checkbox: string
   total: string
   checkout: string
   submitting: string
   showSuccessMessage: string
 }> = {
   ru: {
      title: 'Оформление заказа',
      email: 'Почта',
       phone: 'Телефон',
      checkbox: 'Согласен с условиями обработки данных',
      total: 'Итого:',
      checkout: 'Оформить',
      submitting: 'Оформляем...',
      showSuccessMessage: 'Заказ оформлен!'
   },
   be: {
      title: 'Афармленне замовы',
      email: 'Пошта',
      phone: 'Тэлефон',
      checkbox: 'Згодзен з умовамі апрацоўкі дадзеных',
      total: 'Усяго:',
      checkout: 'Аформіць',
      submitting: 'Афармляем...',
      showSuccessMessage: 'Заказ аформлены!'
   }
 }