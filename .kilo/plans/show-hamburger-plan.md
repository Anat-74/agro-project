# План: ShowHamburger — desktop-режим (каталог-панель)

> **Режим:** удалённая работа. **Правило:** ни шага без одобрения, после каждого шага — отчёт.
> **Реализация:** только в **не пиковые часы** (7–9 и 13–4 МСК), как в AGENTS.md.
> Дата: 2026-08-26. Связанное: `1778783966963-style-guide.md` (раздел 13 dialog, раздел 14 Popover/Anchor).

---

## Контекст и подтверждённые решения

| # | Решение |
|---|---|
| Брейкпоинт | Разделение на **> `$mobile` (767.98px)** и **≤ mobile**: выше — новый desktop-режим; ≤768 — как сейчас (full-screen оверлей `100dvw/100dvh`, телепорт в `<body>`) |
| Телепорт | **Только ≤768** (mobile и ниже). Выше — диалог in-place, без телепорта |
| Позиционирование | **Anchor Positioning** (style-guide §14): `anchor-name` на `.hamburger-menu`, `position-anchor` + `position-area: bottom span-right` на диалоге → «строго под кнопкой», вместо `left: 15px; top: calc(100% + 22px)` |
| Ширина | **Единый источник — CSS-переменная `--catalog-width`**, заполняется миксином: `@include adaptiveValue("--catalog-width", 320, 235)` в `:root` (styles.scss). Диалог: `width: var(--catalog-width)`; контент: `margin-inline-start: var(--catalog-width)` |
| Открыт по умолчанию | На desktop (>768) при загрузке — открыт (SSR, как у ShowShopFilter: `initialOpen` + `:open="isOpen"`). На ≤768 — закрыт, открывается по кнопке |
| Сдвиг контента | Через глобальный `isOpen` (паттерн HeroGrids/USocials): класс на первом блоке → `margin-inline-start: var(--catalog-width)` + `transition`. **Открытие → контент вправо, закрытие → влево** |
| Что сдвигается | **Только первый блок** (`.hero-slider` на главной; первый section на остальных страницах) — диалог по высоте ≈ блоку |
| Страницы | Новый режим — **на всех страницах** |
| Grayscale | Desktop-панель **НЕ** затемняет контент (своё состояние); mobile-оверлей затемняет как сейчас (`HeroGrids`/`USocials` читают mobile-состояние) |

---

## Недочёты/баги, которые чиним

1. **Дубликат id** `hamburgerDialog`/`dialogHamburger` (AppHeader рендерит два инстанса) → в `useDialogState.ts` последний зарегистрированный элемент перезаписывает первый → на desktop кнопка открывает скрытый мобильный диалог, desktop-диалог не получает `[open]`.
2. **Tablet (768–1024):** телепорт активен + dropdown-стили `@media (min-width: $mobile)` → `top: calc(100% + 22px)` от `body` = окно за вьюпортом (822px).
3. **a11y:** `.dialog-hamburger { display: grid }` перебивает UA `dialog:not([open]){display:none}` → закрытый диалог остаётся в дереве доступности.
4. **Рассинхрон границ:** CSS `$tablet` 1023.98 vs JS `isTablet <= 1024` (после перехода на `$mobile` — выровнять).
5. **`useViewport` не SSR-safe** (`width = 0` на сервере) — мешает «open by default».

---

## Шаги реализации

### Шаг 1. Разделение id и состояний инстансов
- Уникальные id диалогов через проп: `dialog-hamburger-desktop` / `dialog-hamburger-mobile`.
- Отдельные ключи состояния `useDialog`: `hamburgerCatalogDesktop` (desktop-панель) и `hamburgerDialog` (mobile-оверлей, как сейчас).
- `HeroGrids`/`USocials` (grayscale) остаются на `hamburgerDialog` (mobile).

### Шаг 2. `useDialogState.ts` — локальный ref
- `open()`/`close()` работают с **локальным** `dialogElement` (переданным в вызов), а не с глобальным `dialogElementMap` (map оставляем только для id-only читателей `isOpen`).
- Тест `useDialog.spec.ts` — дополнить случаем «два элемента, один id».

> ✅ **Реализовано 08.26:** шаг 1 и 2 — проп `dialog-id` (desktop/mobile), ключи разведены, `open/close` на локальном ref (`dialogElementMap`/`optionsMap` удалены). Проверено: desktop-кнопка открывает СВОЮ панель (раньше — скрытый mobile-диалог).

### Шаг 3. Breakpoint > `$mobile`
- Dropdown-ветка диалога (`@media (min-width: $mobile)`, 320→235, под кнопкой) — **уже соответствует** новому разбиению: применяется на всех экранах >768 (включая прежний tablet-диапазон 768–1024 — теперь это desktop-режим, без телепорта).
- Full-screen оверлей — базовые стили (≤768); телепорт в `<body>` — **только** `isMobile = width <= 768`.
- `useViewport`/детект: заменить `isTablet (<=1024)` на `isMobile (<=768)`; выровнять границу JS/CSS.

### Шаг 4. Anchor Positioning
```scss
.hamburger-menu { anchor-name: --hamburger-menu; }
.dialog-hamburger {
  position-anchor: --hamburger-menu;
  position-area: bottom span-right;
  margin-block-start: toRem(22);
  position-try-fallbacks: flip-block;
}
```
(в desktop-ветке)

### Шаг 5. `--catalog-width` (единый источник)
```scss
:root { @include adaptiveValue("--catalog-width", 320, 235); }
.dialog-hamburger { width: var(--catalog-width); }
```

### Шаг 6. SSR-open на desktop
- SSR-safe детект desktop (дефолт «desktop» на сервере — безопасно, desktop-инстанс скрыт `hidden-tablet` на мобильных).
- `useDialog("hamburgerCatalogDesktop", ..., { useShowMethod: true, initialOpen: isDesktop })` + `:open="isOpen"` + сброс `isOpen.value = isDesktop` при SPA-перемонтировании.

### Шаг 7. Сдвиг контента по `isOpen`
- Класс-модификатор на первом блоке страницы: `margin-inline-start: var(--catalog-width)` + `transition`.
- `isCatalogOpen` из `useDialog("hamburgerCatalogDesktop")` (id-only).

> ✅ **Реализовано 08.26:** `useCatalogPanel.ts` (id-only чтение `hamburgerCatalogDesktop`); применено на главной — `.hero-slider_catalog-open { margin-inline-start: var(--catalog-width) }` (выше `$tablet`). Открытие → hero вправо, закрытие → влево (плавно, проверено: 306→0). **Продуктовая страница (простой вариант):** карточки `.products-page__content` сдвигаются на `--catalog-width`, breadcrumbs и top-bar уходят в блюр (blur 3px) — они и фильтр-сайдбар намеренно перекрываются панелью. Проверено: открыто → карточки x=615, закрыто → x=309, блюр включается/снимается.

### Шаг 8. a11y
```scss
.dialog-hamburger { &:not([open]) { display: none; } }
```

> ✅ **Реализовано 08.26 (шаги 3–8):**
> - **Шаг 3:** телепорт — только `isMobile (≤768)`; `:disabled="!isMobile || isDesktopInstance"` (desktop-инстанс не телепортируется — иначе после телепорта в body открытая панель видна на mobile).
> - **Шаг 4:** `anchor-name: --hamburger-menu` на `.hamburger-menu`; на диалоге (desktop-ветка) `position-anchor + position-area: bottom span-right + margin-block-start: 22px + inset: auto`. Проверено: панель x=15, w=306 — ровно под кнопкой (кнопка x=15, w=306).
> - **Шаг 5:** `--catalog-width` в `:root` (styles.scss), `width: var(--catalog-width)` у кнопки и панели, сдвиг контента — `var(--catalog-width)`.
> - **Шаг 6:** SSR-open — `initialOpen: isDesktopInstance` + `:open="isOpen"` + сброс при SPA-ремонтировании; на mobile desktop-диалог закрыт/скрыт (родитель `hidden-tablet`).
> - **Шаг 8:** `&:not([open]) { display: none }` + задержка display (exit-анимация видна, затем панель уходит из a11y-дерева).

---

## Активные ссылки и изображения подкатегорий (details-аккордеон)

### Шаг 9. Подсветка активных ссылок
- Активность по текущему маршруту (`useRoute()`), сравнение `route.path` с путём ссылки:
  - товар: `route.path === getProductLink(prod)`
  - подкатегория: `route.path === '/' + locale + '/' + cat.slug + '/' + sub.slug`
  - категория (summary, опционально): `route.path === '/' + locale + '/' + cat.slug`
- Модификатор `.accordion__product-link_is-active` → `color: var(--danger-color)` + `font-weight` (акцент как у открытого details и кнопки «Каталог»).
- Применить и в секции «Акция» (товары со скидкой).

### Шаг 10. Изображения подкатегорий
- Поле `image` у `api::subcategory.subcategory` существует (проверено).
- В fetch категорий (`ShowHamburger.vue:52`) добавить populate: `subcategories: { populate: { image: { fields: [...] } } }`.
- Рендер в подкатегории: `<UImage>` 32×32 слева (как у товаров), `v-if` на наличие (fallback — без картинки).
- **Данные:** подкатегории локально в статусе draft; заполнить `image` на проде через Content API (токен `ai-assistant`).

> ✅ **Реализовано 08.26 (шаги 9–10):** активные ссылки по `route.path` (категория в summary — `_is-active`, подкатегории/товары — `accordion__product-link_is-active`, цвет `--danger-color` + вес 700, включая секцию «Акция»); изображения подкатегорий — populate `subcategories.image` + `<UImage>` 32×32. Проверено на `/ru/zelen`: активна «Зелень», «Петрушка» (подкатегория) с картинкой.

---

## Escape (записан ранее, style-guide §13)
Реализация Escape для `show()`-диалогов (слушатель на `document` с guard по `isOpen`) — уже в `1778783966963-style-guide.md`.

---

## SSR/SEO для панели каталога (реализовано 08.26)
- **Категории** (`categoryKey`): `server: false` убран → данные на сервере (SSR) + в payload, гидратация без повторного запроса.
- **ClientOnly убран** — диалог рендерится в SSR: проверено `curl /ru` — в HTML присутствуют `dialog-hamburger-desktop` и все категории (Бобовые, Зелень, Корнеплоды, Овощи, Орехи, Фрукты, Ягоды, Петрушка).
- **Акции** (`cart-discount-${locale}`, общий кэш с корзиной) — оставлены `server: false` (не нужны для SEO, продукты индексируются своими страницами); подгружаются на клиенте (проверено: 8 ссылок).
- Desktop/mobile поведение не сломалось: панель открыта по умолчанию + сдвиг hero, mobile-оверлей по тапу; новых ошибок гидратации нет (прежний mismatch — pre-existing).

---

## Формат работы
- Реализация **строго в не пиковые часы** (7–9, 13–4 МСК). В пиковые — не начинать.
- Каждый шаг — только после одобрения, после каждого — краткий отчёт.
- Проверка — MCP Spyglass (dev-сервер через `background_process`), не `npm run build`.
