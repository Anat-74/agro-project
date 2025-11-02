import type { LocaleCode } from "../types/types"

export const cartTranslations: Record<LocaleCode, {
   title: string
   description: string
   visuallyHidden: string
   ariaLabelBasket: string
   cartEmpty: string
   total: string
   warningLocale: string
 }> = {
   ru: {
     title: 'Корзина',
     description: 'Страница корзины сайта',
     visuallyHidden: 'Корзина товаров и оформление заказа',
     ariaLabelBasket: 'Перейти в кознину товаров',
     cartEmpty: 'Корзина пустая',
     warningLocale: 'Для просмотра описания товара, переключите язык на:',
     total: 'Всего товаров:'
   },
   be: {
     title: 'Кошык',
     description: 'Старонка кошыка сайта',
     visuallyHidden: 'Кошык тавараў, афармленне замовы',
     ariaLabelBasket: 'Перайсці ў казіну тавараў',
     cartEmpty: 'Кошык пусты',
     warningLocale: 'Для прагляду апісання тавару, пераключыце мову на:',
     total: 'Усяго тавараў:'
   }
 }