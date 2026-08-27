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

---

## Диалог фильтров — details-секции (решения 08.26)

**Файлы:** `frontend/app/pages/[lang]/products/index.vue` (кнопка, top-bar), `frontend/app/components/show-modal/ShowShopFilter.vue` (секции).

1. **Кнопка «Фильтр»** (top-bar): фон `--green-color`, текст и иконка — `--light-color`; hover — затемнение (colorMix). Убрать верхний бордер на всю ширину под кнопкой (`.top-bar` → `border-bottom`).
2. **Три секции** (категории / цена / теги) → обернуть в `<details open>` + `<summary>`:
   - summary: название слева + иконка `mingcute:down-line` справа (**шеврон**, как в ShowHamburger), анимация `rotate` при open/close; контент — `grid-template-rows: 0fr→1fr` (паттерн ShowHamburger, ничего нового).
   - font-size summary: `toEm(22)` (как ShowHamburger).
   - Заголовки секций: «Все категории» (`categoriesTitle`), «Цена» (`priceTitle`), «Популярные теги» (`tagsTitle`) — существующие ключи локали.
   - Название + иконка — **под бордером вверху секции** (текущие бордеры секций сохраняем).
   - **Открытое состояние реактивно**: `ref(true)` + `:open` на каждом details (переживает ре-рендер при смене фильтров; статичный `open` переоткрывал бы секции).
3. **Семантика/a11y**: у `<section>` заголовок обязателен, `<summary>` его не заменяет → оставляем `visually-hidden` h2 + `aria-labelledby`; `<summary>` добавляет видимый заголовок (дубль текста допустим).
4. **Последние две секции** (баннер с изображением, товары со скидкой) — **без details**, как есть.
5. **Все details открыты** изначально.

> ✅ **Реализовано 08.26:** кнопка зелёная (`--green-color`, текст/иконка `--light-color`, hover через colorMix), бордер top-bar убран; 3 details-секции (категории/цена/теги) со summary + `mingcute:down-line` (rotate −90°), контент `grid 0fr→1fr`, `:open` реактивно + **синхронизация по `@toggle`** (иначе ре-рендер переоткрывал секции); баннер и акции без details.

### Исправления по фидбеку (08.26, итерация 3)
- **Анимация закрытия диалога**: родитель держит `display:flex`+ширину с задержкой (`transition: display/width 0s var(--transition-duration) allow-discrete`) — диалог слайд-фейд влево до схлопывания; диалог `display:block` всегда (перебивает UA `dialog:not([open])`), `overflow:hidden` на колонке.
- **Details-анимация**: `grid-template-rows: minmax(0, 0fr→1fr)` — иначе внутри `<details>` auto-минимум трека не давал 0fr схлопнуться.
- **Summary**: убран outline/фон/радиус (без рамки), шрифт `toEm(18)`/weight 500, `margin-block-end: 8px`, иконка `toEm(14)` (меньше текста). Заголовок акций — то же.
- **Ползунок цены**: паддинги `.shop-filters__price` (inline 8px, block-end 6px) — ручки 16px не обрезались `overflow:hidden`.
- **Бордер «втиснение»**: усилен — `rgba(0,0,0,.3)` + `inset 0 -1px rgba(0,0,0,.08)` + белый блик `.6` (виден на светлом фоне).
- Проверено: закрытие слайдит x 15→−1113 с фейдом, открытие влетает слева; details gt анимируется 32→0; ручки слайдера в границах; скролла нет.

### Страница — правки по фидбеку (08.26, итерация 4)
- **Breadcrumbs**: отступ вниз `toEm(25)`; шрифт элементов +4px (item 18, сепаратор 17; mobile 17/16, mobileSmall 16/15); ссылки/текущий наследуют размер item (убраны дубли `toEm` — иначе em-каскад давал 19.8px).
- **Top-bar**: кнопка «Фильтр» и чип «Найдено: N» = высоте select (30px, `height` + `padding-block: 0`); select на 6px уже — desktop `toEm(147)` (mobile `toRem(145)` сохранён — иначе текст «Сначала дешевле» снова обрежется).
- **Диалог**: ширина на 20px меньше — `adaptiveValue("width", 280, 180)`.
- **Секция «Товары со скидкой» на mobile — НЕ рендерим данные**: ответ на вопрос «можно ли не тянуть Strapi» — да, `display:none` данные всё равно тянет, поэтому запрос отключается: `server:false + immediate:false` + `watch(width)` → `refresh()` только при `w > 767.98`; на mobile секции нет (0 карточек), на desktop подгружается. Дополнительно `@media (max-width:$mobile){display:none}` — страховка на resize desktop→mobile.
- Проверено (1280/375): высоты 30/30/30; select 129px; диалог 264px; крошки 17.6px едино; mobile-свежая загрузка — сейл-карточек 0, desktop — 5; скролла нет.
- **Решение (08.26):** SSR для сейл-блока НЕ нужен — данные не играют роли для SEO (товары индексируются через свои страницы), а `server:false` снимает запрос к Strapi с SSR. UA-детект не делаем. На desktop запрос выполняет клиент (кэш 10 мин), на mobile — нет запроса.

---

## Диалог фильтров — доработки (решения 08.26, 2-я итерация)

6. **Заголовок секции «Товары со скидкой»** (`saleTitle`): сделать **видимым** h2 со стилем summary (тот же `toEm(22)`, вес 600, `--primary-color`); класс `shop-filters__sale-title` вместо `visually-hidden`. Баннер-секцию не трогаем.
7. **Бордеры секций — эффект «втиснение»** (паттерн `BannerLayouts.vue:61-62, 69-79`): тёмная линия + светлый блик снизу, вместо `1px solid var(--border-color)`:
   ```scss
   .shop-filters__section {
     border-bottom: toRem(1) solid rgba(0, 0, 0, 0.25);
     box-shadow: 0 toRem(1) 0 rgba(255, 255, 255, 0.4);
   }
   ```
8. **Радио «Все товары»** — первый пункт списка категорий, `value=""` (совпадает с `category = ref("")`, отмечен по умолчанию):
   ```html
   <li class="shop-filters__category">
     <UInput type="radio" name="shop-category" value="" :model-value="category"
             :label="t.allProducts"
             @update:model-value="emit('update:category', $event)" />
   </li>
   ```
   Новый ключ локали: `allProducts` — ru «Все товары», be «Усе тавары».
9. **Фикс фильтрации подкатегорий** (баг: выбор «Зелень» не показывает товары её подкатегорий). Причина: у товара `category` и `subcategory` — независимые связи, товары подкатегорий часто имеют `category: null`. Решение — `$or` в `products/index.vue:60-61`:
   ```js
   if (category.value) {
     filters.$or = [
       { category: { slug: { $eq: category.value } } },
       { subcategory: { category: { slug: { $eq: category.value } } } },
     ]
   }
   ```
   Тот же `$or` применить на странице категории (`[lang]/[categorySlug]/index.vue:61`) для консистентности.
10. **Счётчики категорий** (`categoryCount`, `ShowShopFilter.vue:62`): сейчас считают только `cat.products` (прямые товары) → числа занижены. Добавить `subcategories.products` (id) в populate категорий и считать сумму:
    ```js
    const categoryCount = (cat) =>
      (cat.products?.length ?? 0) +
      (cat.subcategories?.reduce((n, s) => n + (s.products?.length ?? 0), 0) ?? 0)
    ```
11. **Секция Цена**: числа стоимости выше над инпутом на 5px:
    ```scss
    .shop-filters__price-values { margin-block-end: toRem(5); }
    ```
12. **Секция «Акционные товары»**: переиспользовать **`DiscountProduct`** (не `SaleProductSection` — у него маркетинг-блок `hot-sale`, абсолютный заголовок и scroll-анимация, не подходящие сайдбару). Родитель секции — `@include containerParent(sale, inline-size)`; через `@container sale` + `:deep(.discount-card)` задать компактную (узкую) раскладку карточек. Видимый заголовок секции (п.6) остаётся. Данные — текущие `saleProducts` (`Product[]`), `DiscountProduct` принимает `product: Product` напрямую.

> ✅ **Реализовано 08.26:** видимый заголовок «Товары со скидкой» (toEm(22)); бордеры «втиснение» (`rgba(0,0,0,.25)` + блик); радио «Все товары» (`allProducts`); `$or`-фильтр (продукт в категории или в её подкатегории) на странице продуктов и категории; `categoryCount` считает товары подкатегорий (populate `subcategories.products`); цена +5px над инпутом; секция акций = `DiscountProduct` + `containerParent(sale)` + `@container`-компактная раскладка. Проверено в браузере (1280/375): «Зелень» → 3 товара включая «Петрушка Обычная», счётчик (3), toggle+ре-рендер сохраняют закрытую секцию, скролла нет.

### Фон Breadcrumbs не на всю ширину (фикс UBackground, 08.26)

**Причина:** `.app-bg` получает класс `bgfx-press` **безусловно** (`UBackground.vue:55-57`: `BG_EFFECTS = ["press","zoom","focus"]`, `bgEffectIndex = ref(0)`) → `transform: scale(0.95)` + `filter: brightness(0.7)` (`UBackground.vue:392-394`). Фон по CSS `inset:0` занимает всю ширину `nav`, но scale(0.95) ужимает его (зазоры ~25px на 1034, ~47px на 1920). Затрагивает все фоны (крошки, страницы, hero) — заодно затемняет на 30%.

**Фикс:** эффекты по умолчанию «нет», включаются только по тапу:
```ts
const BG_EFFECTS = ["none", "press", "zoom", "focus"] as const
// bgEffectClass: для "none" класс не добавляем ("")
```
Побочно: `.breadcrumbs__container` — `width:100%` + `box-sizing: content-box` + padding даёт лёгкое переполнение (1049 > 1019) → `box-sizing: border-box` или убрать `width: 100%`.

> ✅ **Реализовано 08.26:** `UBackground.vue` — `BG_EFFECTS` с `"none"` по умолчанию, `bgEffectClass` возвращает `""` для none. `UBreadcrumbs.vue` — `width:100% + box-sizing:border-box` (убрать ширину нельзя — контейнер схлопывается и центрируется, крошки должны быть слева).

### Top-bar на мобильном — одна строка (фикс 08.26)

**Проверено в браузере (375px):** кнопка 94px + select ~96px + результаты ~66px = ~282px < 351px доступных → **влезают в одну строку**. Ломают строку:
- `.top-bar__results { flex-basis: 100% }` (`products/index.vue:349-352`) → счётчик падает на новую строку;
- `.top-bar__right { flex-direction: column }` на `$mobileSmall` (359-368) → блок складывается в колонку;
- фиксированная ширина select `toEm(112)` на mobile (`USelect.vue:115`) — текст «Сначала дешевле» обрезается.

**Фикс:**
1. `.top-bar__right` на mobile: остаётся **row**, `align-items: center`; убрать `flex-direction: column` на mobileSmall.
2. `.top-bar__results`: убрать `flex-basis: 100%`, `white-space: nowrap`.
3. `.top-bar__sort`: не давать select сжиматься ниже контента; select на mobile — ширина, вмещающая самую длинную опцию (через `:deep(.select)` в контексте top-bar: `toEm(150)` или `min-width: fit-content`). На очень узких (320px) — допустим wrap как fallback.

> ✅ **Реализовано 08.26:** в одну строку; gap ужат 12→8, чип 8→6 (иначе 375px не влезает в 336px контейнера); select на mobile `toRem(145)` (текст «Сначала дешевле» 118px + паддинги + picker-icon; `max-content` на нативном select не работает — ставим фикс. ширину).

### Счётчик «Найдено: N» — бордер «втиснение»
`.top-bar__results` — чип с recessed-бордером (паттерн BannerLayouts):
```scss
.top-bar__results {
  white-space: nowrap;
  padding-inline: toRem(10);
  padding-block: toRem(4);
  border-radius: toRem(6);
  border: toRem(1) solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 toRem(1) 0 rgba(255, 255, 255, 0.4);
  background-color: var(--light-color);
}
```

---

### Страница товаров — сдвиг карточек + mobile-оверлей (решение 08.27)

**Desktop (>$mobile):**
- Диалог фильтров в потоке слева, открыт по умолчанию (как сейчас).
- Открыт → карточки справа от диалога.
- Закрыт → карточки сдвигаются влево на ширину диалога (структурно через flex) и заполняют контейнер, центрированный во вьюпорте.
- **Breadcrumbs / top-bar — НЕ трогаем** (без сдвига и блюра).
- Ширина сдвига = адаптивная ширина сайдбара (280→180); ввести `--filter-width` (не путать с `--catalog-width`).

**Mobile (≤$mobile):**
- Диалог **открыт по умолчанию** (как на desktop) — суть страницы в фильтрах.
- **Полноширинный оверлей ПОД top-bar** (якорь `.products-page__body`): `position: absolute; inset-block-start: 0; inset-inline: 0; width: 100%` — top-bar НЕ перекрывает (диалог в своём положении под ним). Высота — **по контенту** (не 100dvh).
- **Body-lock** на mobile: в `_globals.scss` `body:has(...)` добавлен `.show-shop-filter__dialog[open]` → `overflow: hidden` при открытии (разблокируется при закрытии).
- Фон диалога = ShowHamburger: `background-color: transparent; backdrop-filter: blur(22px)`.
- top-bar `z-index` НЕ нужен (диалог под ним).
- **Внутренний скролл** `.shop-filters` на mobile — как `.dialog-hamburger__items` в ShowHamburger: `overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--success-color) var(--whitesmoke-color); max-height: 100dvh` (контент скроллится, если выше видимой области; body-lock остаётся).

**Кнопка «Фильтр» — состояние по положению окна:**
- Окно **открыто** → иконка плавно меняется на крестик (`mingcute:close-line`), цвет кнопки → `--danger-color`.
- Окно **закрыто** → иконка `mingcute:filter-line` (текущая), цвет → зелёный (`--green-color`).
- Плавность: `transition: background-color` на кнопке + смена иконки через `<Transition>` (opacity/rotate).
- Привязка к `shopFilterRef?.isOpen`.

**Details-анимация (копия ShowHamburger, без нововведений):**
- Структура: content — **сосед `<details>`** (`[open] + .content`), а не внутри.
- `grid-template-rows: 0fr→1fr` + `transition: grid-template-rows 0.3s` + item `overflow: hidden`.

> ✅ Утверждено 08.27: mobile-диалог открыт по умолчанию (полширины, оверлей); центрирование = контейнер 1420 + flex-заполнение; вводим `--filter-width`; кнопка — иконка/цвет по состоянию окна.

> ✅ **Реализовано 08.27:**
> - `--filter-width` (280→180) в `:root`; `.show-shop-filter:has([open]) { width: var(--filter-width) }`.
> - **Mobile (≤768):** сайдбар `position:absolute` (якорь `.products-page__body` position:relative), `width: min(50vw, var(--filter-width))`, `backdrop-filter: blur(22px)` на диалоге — оверлей, контент на всю ширину сзади.
> - **Кнопка «Фильтр»:** `_is-open` → `--danger-color` + иконка `mingcute:close-line`; закрыта → зелёная + `mingcute:filter-line`; плавно (`transition: background-color` + `<Transition name="filter-icon" mode="out-in">` с поворотом/opacity). Привязка к `shopFilterRef?.isOpen`.
> - **Details-анимация:** точная копия ShowHamburger — content вынесен в СЛУЖЕБНЫЙ сосед `<details>`, `[open] + .content { grid-template-rows: 1fr }`, base `0fr`, `> * { overflow: hidden }` (убраны minmax/min-height).
> - Проверено (1280/390): desktop сайдбар в потоке (264px), карточки справа, кнопка danger↔green + иконки меняются; mobile оверлей 185px (полэкрана), blur(22px), контент сзади, toggle убирает, body не заблокирован, details 13→6px плавно; скролла нет; новых ошибок нет.
