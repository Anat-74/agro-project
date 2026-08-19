# Frontend / Backend — правила данных и логики

> Отдельный файл от style guide: здесь только логика, данные и интеграции.
> Разметка и стили — в `1778783966963-style-guide.md`.

---

## 1. Типы Strapi (shared/types)

Все типы Strapi — в `frontend/shared/types/`, авто-импортируются, не дублировать.

## 2. Data flow Strapi: global и home-page получают populate из middleware

Публичные данные (`api::global.global`, `api::home-page.home-page`) **не** populate-ятся на фронте —
всё, что нужно, подставляет **backend-middleware Strapi** (только если фронт НЕ передал свой `populate`):

| Endpoint | Middleware | Что подставляет |
|---|---|---|
| `GET /api/global` | `backend/src/api/global/middlewares/default-global-populate.ts` | footer(+logo), socials(+icon), legal, phones, email, header(+navigation), background(+imageAvif/imageWebp/thumbnail) |
| `GET /api/home-page` | `backend/src/api/home-page/middlewares/default-home-populate.ts` | heroSlider(+image, backgroundImage), heroGrids(+icons), featuredProducts(+products: mainImage/image/category/subcategory) |

**Правило для фронта:** запрашивать global/home-page **без** `populate` (`find("global", { filters: { locale } })`) —
иначе middleware выключится (условие `!originalPopulate`), и Strapi вернёт только populate-поля (footer/legal/phones пропадут → SSR упадёт с `companyName`).

Связанные композаблы: `useStrapi().find()`, `useAsyncData` с ключом `global-${locale}` / `home-page-${locale}`.

## 3. shared/utils — автоимпорт

Утилиты — в `frontend/shared/utils/`, авто-импортируются (как и типы). Настроено в `nuxt.config.ts`:
```ts
imports: { dirs: ["shared/types/**", "shared/utils/**"] },
```
Импорт через alias `#shared/utils/...` (например `#shared/utils/visibility`).

## 4. UBackground — два режима (статический / динамический)

Компонент `components/UBackground.vue` имеет два режима:

| Режим | Триггер | Для чего | Источник данных |
|---|---|---|---|
| **Статический** | `src` / `retinaSrc` | Фон **секций** (Hero, Featured, Sale) | `home-page` → `slide.backgroundImage`, `featuredProd.backgroundImage` |
| **Динамический** | `backgroundOptions` (массив) | Фон **страниц** (блог, новости) — пользователь может менять | `global` → `background.options` |

- **Статический** — просто фон: `image-set(webp 1x, avif 2x)`, без переключателя.
- **Динамический** — при наличии `backgroundOptions`: читает выбор из `localStorage('selectedBackground')`, fallback на `isDefault`, рендерит `image-set`, показывает `BackgroundPopover` (поповер с `USlider`, см. ниже).
- В layout `default.vue` динамический UBackground с `global.background.options` оборачивает `<slot />` → глобальный фон страниц. Секции главной (Hero/Featured) перекрывают его своим статическим фоном.
- Данные фонов приходят из middleware `default-global-populate` (см. §2), заполнены в Strapi (Hero/Featured/Sale, avif+webp из Media Library).

## 4.1 BackgroundPopover — поповер выбора фона

- `components/popover/BackgroundPopover.vue` — переключатель фонов (не `<dialog>`): **Popover API** (`popover="auto"`), открытие по `popovertarget` на `UButton variant="icon"`, закрытие кликом вне/Escape нативно.
- Внутри — `USlider` (вариант `background`): компактная горизонтальная карточка, превью фона + название, кнопки prev/next по бокам, свайп — нативный `scroll-snap`.
- Имя с суффиксом `Popover` — консистентно с `ColorModePopover`, `ContactsPopover`, `MoreMenuPopover`.
- `usePopover(id, ref)` синхронизирует `isOpen`; выбор фона → `emit('select')` + `close()`.

## 4.2 Локализация текстов — два источника

Правило разделения (дублирует rules.md, зафиксировано здесь для планов):

| Текст | Где локализуется |
|---|---|
| **Приходит из Strapi** (title фонов, названия товаров/категорий, тексты секций) | **В Strapi** (i18n, локаль ru/be) — заполнить значение для каждой локали |
| **Не из Strapi** (кнопки, заголовки UI, aria-метки, заголовок поповера «Выберите фон») | Каталог `frontend/app/locales/*.ts` (обязательно все локали) |

- Названия превью фонов (`background.background-option.title`) — **данные Strapi**, локализуются в CMS: `PUT /api/global?locale=ru|be` (через Content API, токен `ai-assistant`).
- НЕ дублировать названия фонов в `locales/background.ts` — это данные CMS, каталог locales только для UI-текстов.

## 5. Идентификация данных (Strapi v5)

- **`id` не используется.** Везде применяется `documentId` (ключи `v-for`, корзина, `isInCart`) или `slug` (ссылки, маршруты).
- `fields: ["id"]` в запросах — **только** для проверки наличия/пагинации, **не** для рендера данных.
- В ответах Strapi v5 поля приходят напрямую (без `.data.attributes` — старый формат не применяется).

## 6. Ссылки на товары — только через `useProductLink`

- `frontend/app/composables/useProductLink.ts` — **единая точка** построения URL товара:
  - товар с подкатегорией → `/{locale}/{cat}/{subcat}/{slug}`
  - товар с категорией напрямую → `/{locale}/{cat}/products/{slug}`
  - fallback → `/{locale}`
- Учитывает, что у товара `category` может быть `null`, а категория лежит в `subcategory.category`.
- Используется в: `ProductCard.vue`, `ShowHamburger.vue`, `DiscountProduct.vue`.
- **Правило:** все новые ссылки на страницы товаров — через `useProductLink`, а не вручную.

## 7. Каталог: маршруты и страницы

```
/[lang]                                  — главная (секции: Hero, Featured, Sale)
/[lang]/[categorySlug]                   — категория (подкатегории ИЛИ товары напрямую)
/[lang]/[categorySlug]/[subcategorySlug] — подкатегория (товары + фильтры/пагинация)
/[lang]/[categorySlug]/products          — список товаров категории (сортировка)
/[lang]/[categorySlug]/[subcategorySlug]/[productSlug] — карточка товара
/[lang]/[categorySlug]/products/[productSlug]          — карточка товара (без подкатегории)
```

- **У товара может не быть подкатегории** — тогда он рендерится прямо в категории
  (например «Бобовые», «Орехи и сухофрукты»).
- Страница категории выбирает режим через `displayMode`: `subcategories` | `products` | `empty`.

## 8. Редактирование данных на проде Strapi

- Прод Strapi: `https://api.vh324.by3020.ihb.by` (отдельная БД от локальной — данные не синхронизируются).
- Для заполнения/обновления контента — **Content API** (`/api/*`) с прод-токеном `ai-assistant`
  (Full access, работает на проде; Admin API Token не нужен для контента).
- Публикация происходит автоматически при PUT/POST (в отличие от admin-панели, где нужен publish).
- Медиа указываются по **id файла** из `GET /api/upload/files` (id на проде отличаются от локальных).
- Токены/пароли локальной Strapi (из AGENTS.md) на проде **не работают**.

## 9. Select — base-select (обновлённый нативный) в `_utils.scss`

- Единый класс `.select` + `.select-wrapper`: **fallback** (appearance:none + стрелка `::before/::after`) для Firefox/Safari<27, **base-select** (`@supports`) для Chrome/Edge/Opera/Safari 27+.
- В `@supports`: `appearance: base-select`, глобальные `::picker(select)` / `:open::picker(select)` / `@starting-style` + `:root { interpolate-size: allow-keywords }` (анимация открытия, как в блоге), `::picker-icon` (стрелка), скрытие кастомной стрелки wrapper.
- **Ограничения base-select:** `option` рендерится нативно (top-layer) — только текст, `::before`/HTML/`::checkmark` кастомизация **не работает**. Иконки/эмодзи — прямо в тексте option (`{{ icon }} {{ label }}`).
- **Анимация пикера работает в Chrome (десктоп и Android); на Firefox/Safari — fallback без анимации** (нативный дропдаун).
- Шрифт select: **Comic Neue** (google) — Comic Sans MS локальный недоступен на мобильных.

## 10. Фон по типам страниц + попап

- `shared/utils/backgroundKey.ts` → `getBackgroundKey(path)`: home/catalog/blog/news/cart/auth/cabinet/static.
- Выбор фона и размера хранится **per-type**: `localStorage('selectedBackground:<type>')`, `('backgroundSize:<type>')`. Приоритет размера: выбор пользователя > пропс родителя.
- Кнопка-палитра (`UBackground` → `BackgroundPopover`): **без фона/бордера**, только жёлтая иконка (`--yellow-color`), `variant="palette"` в UButton.
- `BackgroundPopover`: `popover="auto"`, `usePopover`; **обёртке `pointer-events: none`, попапу/кнопке `auto`** (иначе клик уходит сквозь → light-dismiss закрывает). id попапа: `bg-popover-${useId()}` (префикс обязателен — useId совпадает с ColorModePopover).
- `optionKey` нужен для `:key` миниатюр; `:slide-key="'id'"` (строка, не функция) в USlider.

---

## Формат работы

Каждый шаг — только после одобрения. После каждого — краткий отчёт.
