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