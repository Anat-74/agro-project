# План работ (frontend)

> Расположение документов: временные планы — `.kilo/plans/*`; `frontend/docs/*` — постоянные правила
> (`style/patterns.md`, `nuxt-async-data.md`, `ai-assistant*.md`).
> Статус (05.10.2026): очищено от исторических отладок — оставлены актуальные задачи и справка.

## Открытые задачи

### 1. Типизация (`vue-tsc --noEmit`)

- **Состояние:** ~37 предсуществующих ошибок TS (в новых агро-файлах — 0).
- **Топ:** `blog.vue`, `blog/[slug].vue`, `news.vue`, `news/[slug].vue`, страницы about/contacts/services.
- **Причины:** `find`/`useAsyncData` без обобщений (`data` выводится как `{}`); фильтры (`$eq`,
  `StrapiPrimitiveOperators<unknown>`); `PaginationMeta` (нужен `page` вместе с `pageSize`); единично
  `useCachedAsyncData`.
- **Подход:** генерики (`find<Product>` и т.п.), тип `PaginationMeta`, точечно `filters as any`;
  ввести `nuxi typecheck` в проверку.
- **Запуск:** `npx -y -p vue-tsc -p typescript vue-tsc --noEmit`.

### 2. Локализация ru → be

- Отдельный **сквозной** этап: аудит всех content types/компонентов на полноту `be`.
- Включая `be`-локали растений (блокер: `PUT /api/crops/…?locale=be` → 403, нужны права на `Crop`),
  новых категорий/товаров.
- Каталог в `be` неполный (у части категорий нет `be`).

### 3. Скролл к верху при смене страницы пагинации (07.09, открыто)

- **Файл:** `pages/[lang]/[categorySlug]/products/index.vue`.
- Сейчас есть `watch(route.query.page)` → `refresh()`, но **`scrollTo` нет** (проверено 05.10) →
  при клике на пагинацию страница не поднимается к верху.
- **Что сделать:** прокрутить к верху по факту смены страницы (учесть `route.query.page`, не конфликтовать
  со сбросом `page=1` при смене фильтров и с SSR).

### 4. Прочее — в профильных планах

- Каталог/калькулятор/разделы — `agro-calculator.md`, `preserves-section.md`, `crop-pages.md`.
- ShowHamburger (anchor-positioning, 2-й этап калькулятора заготовок, `addToCart(quantity)`) —
  `show-hamburger-plan.md`.
- Чат-ассистент — `chat-assistant-garden.md`.

## Справочно (конвенции)

- **Nuxt 4 data-fetching:** `frontend/docs/nuxt-async-data.md` — `status` вместо `pending`, реактивные
  ключи, `watch`, abort-сигнал, эталон на странице продуктов.
- **Адаптив — «три кита»:** container queries (блок-ширина) + `clamp` (непрерывность) + media queries
  (вьюпорт). Все значения/брейкпоинты — через `toEm()`/`toRem()` (без «голых» px).
- **Range-медиазапросы (MQ Level 4):** `@media ($mobileSmall <= width <= $tablet) { … }`
  (Chrome 104+, FF 102+, Safari 16.4+). Пример: `FeaturedProductsSection`.
- **`containerAdaptive($property, $start, $min, $from, $to, $unit: "cqw")`** — `clamp(...)` по ширине
  контейнера + fallback по `vw`. Пример: высота карточки в `ProductCard.vue`
  (`containerAdaptive("height", 320, 250, 1000, 360)`).

## История (по коммитам)

- `794ac77` — `useDialog` → `useState` (SSR-утечка: шапка пропадала на главной после SSR продуктов).
- `75401a4` — реструктуризация страницы продуктов; анимация фильтра только `transform`; aria-label header.
- `48a10ee` — высота карточки через `containerAdaptive` (контейнер `cards` на `ul`).
- `83858df` — убрана обёртка `.products-page__content`; ULoader самопозиционирующийся; data-fetching на
  Nuxt 4 `status` + реактивный ключ.
- `7b36f5b` — select без эффекта углубления; счётчик results с inset-эффектом.
