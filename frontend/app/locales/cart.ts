export const cartTranslations: Record<LocaleCode, {
   title: string
   description: string
   visuallyHidden: string
   ariaLabelBasket: string
   cartEmpty: string
   cartEmptySub: string
   cartEmptyCta: string
   total: string
   warningLocale: string
   recommendTitle: string
 }> = {
   ru: {
     title: 'Корзина',
     description: 'Страница корзины сайта',
     visuallyHidden: 'Корзина товаров и оформление заказа',
     ariaLabelBasket: 'Перейти в корзину товаров',
     cartEmpty: 'Ваша корзина пока пуста',
     cartEmptySub: 'Но это легко исправить! Загляните в каталог или присмотритесь к товарам со скидкой',
     cartEmptyCta: 'Перейти в каталог',
     total: 'Всего товаров:',
     warningLocale: 'Для просмотра описания товара, переключите язык на:',
     recommendTitle: 'С этим заказывают'
   },
   be: {
     title: 'Кошык',
     description: 'Старонка кошыка сайта',
     visuallyHidden: 'Кошык тавараў, афармленне замовы',
     ariaLabelBasket: 'Перайсці ў казіну тавараў',
     cartEmpty: 'Ваш кошык пакуль пусты',
     cartEmptySub: 'Але гэта лёгка выправіць! Загляніце ў каталог ці звярніце ўвагу на тавары са зніжкай',
     cartEmptyCta: 'Перайсці ў каталог',
     total: 'Усяго тавараў:',
     warningLocale: 'Для прагляду апісання тавару, пераключыце мову на:',
     recommendTitle: 'З гэтым замаўляюць'
   }
 }
