import type { LocaleCode } from "../types/types"

export const buttonTranslations: Record<LocaleCode, {
   label: string
   ariaLabelLang: string
   ariaLabelGoBack: string
   ariaLabelGoForward: string
   ariaLabelAdded: string
   ariaLabelPagination: string
   ariaLabelClosedSuccess: string
   ariaLabelDialogOpen: string
   ariaLabelDialogClosed: string
   ariaLabelCopyLink: string
   ariaLabelReduceQuantity: string
   ariaLabelIncreaseQuantity: string
   ariaLabelRemoveItemFromCart: string
   ariaLabelScrollToTop: string

 }> = {
   ru: {
       label: "Добавить в корзину",
       ariaLabelAdded: "Добавлено в корзину",
      ariaLabelLang: "Переключить язык",
      ariaLabelGoBack: "Вернуться назад",
       ariaLabelGoForward: "Идти вперед",
       ariaLabelPagination: "Перейти на следующую страницу",
       ariaLabelClosedSuccess: "Закрыть сообщение",
       ariaLabelDialogOpen: "Открытое модное окно",
       ariaLabelDialogClosed: "Закрыть модальное окно",
       ariaLabelCopyLink: "Скопировать ссылку на продукт",
       ariaLabelReduceQuantity: "Уменьшить количества",
       ariaLabelIncreaseQuantity: "Увеличить количества",
       ariaLabelRemoveItemFromCart: "Удалить товар из корзины",
       ariaLabelScrollToTop: "Прокрутить наверх"
   },
   en: {
      label: "Add to cart",
      ariaLabelAdded: "Added to cart",
      ariaLabelLang: "Switch language",
      ariaLabelGoBack: "Go back",
      ariaLabelGoForward: "Go forward",
      ariaLabelPagination: "Go to the next page",
      ariaLabelClosedSuccess: "Close message",
      ariaLabelDialogOpen: "Open modal window",
      ariaLabelDialogClosed: "Close modal window",
      ariaLabelCopyLink: "Copy link to product",
      ariaLabelReduceQuantity: "Reduce quantities",
      ariaLabelIncreaseQuantity: "Increase quantities",
      ariaLabelRemoveItemFromCart: "Remove item from cart",
      ariaLabelScrollToTop: "Scroll to top"
   },
   be: {
      label: "Дадаць у кошык",
      ariaLabelAdded: "Паведамленні ў кошык",
      ariaLabelLang: "Пераключыць мову",
      ariaLabelGoBack: "Вярнуцца назад",
      ariaLabelGoForward: "Ідзі наперад",
      ariaLabelPagination: "Перайсці на наступную старонку",
      ariaLabelClosedSuccess: "Закрыць паведамленне",
      ariaLabelDialogOpen: "Адкрыць мадальнае акно",
      ariaLabelDialogClosed: "Зачыніць мадальнае акно",
      ariaLabelCopyLink: "Скапіяваць спасылку на прадукт",
      ariaLabelReduceQuantity: "Зменшыць колькасці",
      ariaLabelIncreaseQuantity: "Павялічыць колькасці",
      ariaLabelRemoveItemFromCart: "Выдаліць тавар з кошыка",
      ariaLabelScrollToTop: "Пракруціць уверх"
   }
 }