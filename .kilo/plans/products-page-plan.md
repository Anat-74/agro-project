# План: страница «Все товары» с фильтрами

> **Режим:** удалённая работа (без npm install / nuxi module add)
> **Правило:** ни шага без одобрения, после каждого шага — отчёт
> **Приоритет данных:** mcp-strapi (основной инструмент), Strapi локально на `127.0.0.1:1337`

## Цель

Новая страница каталога со всеми товарами из Strapi. Переход на неё — из секции hero
(кнопка «Купить сейчас» / «За покупками»; сейчас ведут на `/ru/contacts`).
Слева — панель фильтров (сайдбар), справа — сетка товаров с сортировкой и пагинацией.

**Исключение:** фильтр **«Рейтинг» НЕ реализуем** (в проекте нет поля рейтинга у товаров).

## 1. Маршрут и структура

- **Маршрут:** `/[lang]/products` → файл `app/pages/[lang]/products/index.vue`
- **Композиция страницы:**
  - шапка: заголовок + кнопки назад/вперёд (паттерн `products-section` у категории);
  - сайдбар фильтров (слева, адаптив — на мобильном раскрывается);
  - основная область: сортировка + сетка `ProductCard` + `UPagination`.

## 2. Данные (Strapi v5)

```ts
find("products", {
  filters: {
    locale: { $eq: currentLocale },
    category: { slug: { $eq: selectedCategory } },   // при выборе
    subcategory: { slug: { $eq: selectedSub } },      // при выборе
    isAvailable: { $eq: true },                       // «В наличии»
    isDiscount: { $eq: true },                        // «Со скидкой»
    price: { $gte: min, $lte: max },                  // диапазон цены
    name: { $contains: search },                      // поиск
  },
  sort: sortOption,                 // name:asc | price:asc | price:desc
  pagination: { page, pageSize: 12 },
  populate: { image: { fields: ["url", "alternativeText"] } },
})
```

- Запросы: `useStrapi().find` + `useCachedAsyncData` (паттерн `[categorySlug]/products`).
- Все фильтры — в **URL-query** (`?category=...&priceMin=...&page=2`) → шаринг, «назад», SEO.
- Проверка данных/структуры — через **mcp-strapi** (`get_entries`, схемы).

## 3. Сайдбар фильтров (слева)

| Группа | Поле Strapi | Элемент |
|---|---|---|
| Категория (7 шт.) | `category.slug`, `category.image` | радио-чипы / карточки с иконкой |
| Подкатегория | `subcategory.slug` | зависит от выбранной категории |
| В наличии | `isAvailable` | чекбокс |
| Со скидкой | `isDiscount` | чекбокс |
| Цена | `price` | диапазон (`min`/`max`) |
| Поиск | `name` | текстовое поле |

- Верстка/стили — по **style guide** (BEM, `toRem`/`toEm`, `adaptiveValue`, `@include hover`, миксины в конце).
- Локализация всех текстов — `app/locales/*.ts` (ru/be).
- На мобильном сайдбар скрыт/раскрывается (решение — после получения макета).

## 4. UInput — расширение

`UInput` уже имеет: `text`, `search`, `checkbox`, `range`, `number` и др.
Вероятно понадобится **новый тип `radio`** (одиночный выбор категории/подкатегории).
Рейтинг — не добавлять.

## 5. Переиспользуемое

- `ProductCard` — карточка товара;
- `UPagination` — пагинация по `?page=`;
- select сортировки + `products-section__card-list` (миксин `gridCards`);
- `useProductLink` — ссылки на товары;
- `useCachedAsyncData` + `useStrapi` — запросы с кэшем;
- `useSeoMeta` — SEO (title/description);
- `UButton`, `UInput`, `ULoader`.

## 6. Шаги

1. Получить структуру страницы из макета (от пользователя).
2. Реализовать **сайдбар** (только сайдбар, исходя из стиля и данных проекта).
3. Реализовать основную область (сетка + сортировка + пагинация).
4. Подключить данные из Strapi (фильтры + query-параметры).
5. Перенаправить hero-кнопку на новый маршрут.
6. Локализация + SEO + проверка (spyglass) + коммит/деплой по команде.

## 7. Хлебные крошки (переиспользуемые)

- **Strapi:** компонент `layout.breadcrumbs` (вложенный `background.background-image` — `baseBgImageWebp` + `retinaBgImageAvif`). Поле `breadcrumbs` добавлено в **`global`** (для продуктовой страницы — нет контент-типа).
- **Фронт:** `app/components/Breadcrumbs.vue` — `image-set(url(webp) 1x, url(avif) 2x)`, «Главная» через `useLocale`. Заголовок текущей страницы — из данных страницы (`page.title`), не из Strapi-компонента.
- **TODO (подключить на каждой странице):** `about-page`, `services-page`, `contacts-page`, `blog`, `news` — добавить поле `breadcrumbs` (со своим `background-image`) в каждый контент-тип и использовать `<Breadcrumbs>` на страницах.
- **Временный фон:** сейчас используются существующие изображения Hero (webp 456 + avif 442). Когда пользователь подготовит свои два формата — заменить в админке (загрузить через mcp-strapi `upload_media`).

## 8. SEO страницы «все товары»

- **Реализовано:** `useSeoMeta` с локализованными title/description/ogTitle/ogDescription/ogImage (фон breadcrumbs из Strapi)/ogUrl (siteUrl + fullPath). Без `useHead` — у страницы нет контент-типа, нет `structuredData`.
- **TODO (отдельная задача):** если позже захотим статический JSON-LD (например, `ItemList` товаров или `WebSite`), добавить `useHead` с вручную составленным объектом — сейчас данных для разметки нет.
- **TODO (проверка/доработка):** страницы навигации (about/services/contacts/blog/news) — SEO должно быть как на динамических страницах (useSeoMeta + useHead со `structuredData` из Strapi). Проверить и привести к единому виду.
