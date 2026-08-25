# Страница «Все товары» — статус работ

> **Режим:** удалённая работа. **Правило:** ни шага без одобрения, после каждого шага — отчёт.
> **Данные:** mcp-strapi — основной инструмент; локальный Strapi на `127.0.0.1:1337`.

## Готово ✅

- **Страница** `/[lang]/products`: `<section class="products-page">` + скрытый H1, breadcrumbs (фон на всю ширину, ссылки в контейнере), top-bar (USelect сортировки, кнопка «Фильтр» зелёная, количество), body: сайдбар + сетка `ProductCard` + `UPagination`.
- **Сайдбар (`ShowShopFilter`)**: категории (UInput `radio`), цена (UInput `range-dual`), теги (UInput `checkbox`+`pill`) — **все инпуты централизованы в UInput**; секции со скрытыми заголовками; баннер — `<section>` (заголовок-бейдж); товары со скидкой с `mainImage`; рассылка удалена.
- **UInput**: типы `radio`, `range-dual` (модель-кортеж), `pill` (массив-модель); фикс дубля label.
- **Карточки**: контейнер `card product / inline-size`, 2 в ряд на мобильном (container-query), `UImage type="product"`.
- **Данные**: фильтры (категория, цена), сортировка, пагинация, «Найдено: N».
- **SEO**: локализованный `useSeoMeta` (title/desc/og*, ogImage из фона breadcrumbs).
- **Breadcrumbs**: `UBreadcrumbs` использует `UBackground` (webp/avif из Strapi `global.breadcrumbs`).
- Hero-ссылка → `/ru/products`.

## TODO / открытые вопросы 🔜

- **Диалог фильтров**: поведение/позиционирование на мобильном — перерабатывается отдельно.
- **Breadcrumbs на других страницах** (about/services/contacts/blog/news): добавить поле `breadcrumbs` (свой фон) в каждый контент-тип и подключить `UBreadcrumbs`.
- **Статический JSON-LD** (`ItemList`/`WebSite`) — отдельная задача.
- **Прод**: деплой + **перезапуск приложения в Plesk вручную** (deploy.mjs не перезапускает).
