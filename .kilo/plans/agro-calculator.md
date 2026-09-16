# План: Агро-раздел «Всё для посадки и урожая» + калькулятор (семена/рассада/удобрения)

> **Режим:** удалённая работа. Ни шага без одобрения; после каждого шага — отчёт.
> **Реализация:** только в не пиковые часы (7–9, 13–4 МСК).
> Дата: 2026-09-11. Связанное: `show-hamburger-plan.md` (табы/Меню/поиск), `frontend/docs/style/patterns.md`.

## Цель
Добавить в магазин **один смысловой раздел** для выращивания: **семена + рассада + удобрения**,
объединённые культурой (растением) и **калькулятором посадок**. Раздел расширяемый (грунт, инвентарь,
теплицы, полив и т.д.). Раздел = **категория каталога + хаб-страница**.

---

## Принятые решения (11.09)
1. **Начинаем с C (Агро)** — семена/рассада/удобрения (не с заготовок B).
2. Слово **«Культура» в UI НЕ используем** → «Что сажаем?» / «Растение». Внутреннее имя модели — `crop`.
3. **`crop.category`** (опциональная привязка к категории) — **делаем**.
4. Ввод в калькуляторе: **площадь / длина грядки / число растений** (как предложено).
5. Раздел: **категория каталога + хаб-страница** — подтверждено.
6. Название раздела (в навигации): **«Всё для посадки и урожая»**; H1 хаба: **«Собери свою грядку»**.
7. Слаг хаба/категории: **`/{locale}/posadka-i-urozhay`** (ru/be — локализуется в Strapi). Альтернатива-«зонтик» на будущее: `sad-i-ogorod` (со 301-редиректом).
8. Вход: **только в «Меню»** панели (на первом этапе). — ❗**ОТМЕНЕНО 15.09** (см. п.9)
9. **(15.09) Раздел — отдельная ВКЛАДКА (слайд) в панели `ShowHamburger`**, а не пункт «Меню».
   Панель ≤ `$tablet` становится **трёхслайдовой**: **`Категории | Посадка | Меню`** (+ 3 точки).
   - Таб-лейбл: **«Посадка»**; внутри слайда — полное «Собери свою грядку» / «Всё для посадки и урожая».
   - Слайд — `HamburgerGarden.vue`: «Что сажаем?» (растения из `crop`) → калькулятор + товары
     (Семена/Рассада/Удобрение) + статьи; ссылка на хаб-страницу.
   - Desktop ≥1024 — без изменений (только каталог).
10. **(15.09)** Ссылку на раздел в «Меню» **не добавляем** (есть таб). На планшете **допускается
    расширить панель** (узкой `--catalog-width` под 3 таба + поиск может не хватить).
11. **(15.09) Процесс:** реализация **строго по шагам** — сделали логический пункт → **проверка** →
    если ошибок/недочётов нет, продолжаем. Без спешки, по плану.

---

## 1. Модель данных Strapi

Переиспользуем существующий компонент **`seo.seo`** (`metaTitle`, `metaDescription`, `structuredData`).
Новые компоненты — группа **`calc`**.

### Collection types

**`api::crop.crop` — Растение (культура)** (i18n, draftAndPublish)
| Поле | Тип | Комментарий |
|---|---|---|
| `name` | string (localized, required) | Томат, Огурец… |
| `slug` | uid → name | |
| `image` | media (single) | |
| `shortDescription` | text (localized) | карточка |
| `description` | richtext (localized) | контент/SEO |
| `planting` | component `calc.planting` | параметры **семян** |
| `seedling` | component `calc.seedling` | параметры **рассады** |
| `fertilizing` | component `calc.fertilizing` | параметры **удобрения** |
| `sowing` | component `calc.sowing` | сроки (текстом) |
| `seo` | component `seo.seo` | |
| `category` | relation manyToOne → `api::category.category` | (опц.) «где свежее» |
| `products` | relation manyToMany → `api::product.product` | семена/рассада/удобрения/свежее |
| `blogs` | relation manyToMany → `api::blog.blog` | статьи по растению |
| `isActive` | boolean (default true) | |

**`api::preserve-recipe.preserve-recipe` — Рецепт заготовки** (ветка B, позже)
`name`, `slug`, `image`, `description`; `unit` enum `l/kg/jar`; `yieldRatio` decimal;
`ingredients` component `calc.ingredient` (repeatable: product-relation + amount);
`crop` manyToOne; `products` M2M; `seo`.

### Single types

**`api::calculator-page.calculator-page`** (i18n)
`heroTitle`, `heroSubtitle`, `intro`; `defaults` component `calc.defaults`;
`faq` component `calc.faq-item` (repeatable); `cta` component `layout.link`;
`sections` dynamiczone (`sections.featured-products`); `showCalculator` boolean; `seo`.

### Компоненты (группа `calc`)
- **`calc.planting`**: `rowSpacing` см · `plantSpacing` см · `seedsPerHole` шт · `seedRatePerSqM` г/м² ·
  `seedRatePerPlant` г · `germination` % · `seedingDepth` см
- **`calc.seedling`**: `plantsPerSqM` шт · `growingDays` дней · `sowingPeriod` · `transplantPeriod`
- **`calc.fertilizing`**: `ratePerSqM` г/м² · `applications` шт · `npk` string · `kind` enum `mineral/organic`
- **`calc.sowing`**: `sowingPeriod` · `transplantPeriod` · `harvestPeriod`
- **`calc.defaults`**: `units` enum `sqm/are` · `defaultArea` · `defaultRowSpacing` · `defaultPlantSpacing`
- **`calc.faq-item`**: `question` · `answer` (richtext)
- **`calc.packaging`** (для `product`, repeatable): `label` («0,5 г») · `amount` · `unit` enum `g/kg/pcs`

### Изменения в `api::product.product`
| Поле | Тип | Зачем |
|---|---|---|
| `purpose` | enum `seeds/seedlings/fertilizer/fruitveg/other` | тип товара |
| `crop` | relation oneToOne → crop | привязка к растению |
| `packaging` | component `calc.packaging` (repeatable) | фасовки → число пачек в расчёте |

---

## 2. Раздел «Всё для посадки и урожая»

- **Категория каталога** «Всё для посадки и урожая» (top-level) с подкатегориями:
  **Семена**, **Рассада**, **Удобрения** (позже: Грунт, Инвентарь).
- **Хаб-страница** `/{locale}/posadka-i-urozhay`:
  - блок **«Что сажаем?»** (выбор растения) → **калькулятор**;
  - товары растения: семена / рассада / удобрение;
  - статьи блога по растению;
  - **FAQ + JSON-LD** (`FAQPage`, `HowTo`);
  - CTA «Собери свою грядку».
- **Вход:** пункт в табе **«Меню»** (позже — возможно в шапку).
- **Примечание:** хаб может быть реализован как **та же страница категории** (расширенная
  калькулятором) — тогда отдельный роут не нужен. Решить при реализации.

---

## 3. Калькулятор

**Логика (единый источник):** `server/utils/calc.ts` — считает потребность:
- семена: `площадь → растений (схема) → граммы (норма/всхожесть) → пачки (фасовка)`;
- рассада: `площадь → растений`;
- удобрение: `площадь × норма → граммы → пачки`.
> **Важно:** культура и товар **могут не совпадать** — считаем по **нормам растения** даже без товаров;
> «В корзину» доступно только при наличии подходящего товара (иначе «расчёт есть, товара нет»).

**UI:** `dialog`; **desktop = страница**, **≤ планшета = модалка**; SEO-связка по паттерну
`.visually-hidden` + реальная `<NuxtLink>` (как `DiscountProduct.vue`).

**Корзина:** хранит **целые** кг (`useCartStore`) → результат округляем вверх до целого.
**Доставка:** отдельным блоком **в корзине** (простые правила; позже — Strapi).

---

## 4. Чат-ассистент
Уже есть tool-calls (`server/api/chat-assistant.post.ts`) — добавляем инструменты:
- **`calcPlanting({ cropSlug, areaSqm | bedLengthM, mode })`** → считает по данным `crop`, возвращает
  числа + ссылки на товары;
- **`getCropInfo({ cropSlug })`** → описание/сроки/уход;
- **`findBlog({ query | cropSlug })`** → статьи.
Общая логика — из `server/utils/calc.ts`. Ответ чата: числа + «добавить в корзину» + статьи.

---

## 5. Блог и SEO
- **`blog ↔ crop` (M2M):** на странице растения — «Статьи», в статье — «Калькулятор».
- **JSON-LD** (через `seo.structuredData`): `FAQPage`, `HowTo`, `BreadcrumbList`.
- **Перелинковка:** растение ↔ статья ↔ товар. **hreflang** (i18n ru/be). Проверить **sitemap**.

---

## 6. Этапы (пошагово, каждый шаг → проверка)

**Шаг 1. Strapi-схема «ядро растений»**
`calc.planting` (компонент) + коллекция `crop` (name/slug/image/planting/seo/i18n).
Проверка: Strapi поднимается, тип виден (MCP `list_content_types` / `get_content_type_schema`).

**Шаг 2. Данные растений**
Создать 3–5 растений с примерными нормами (ru/be). Проверка: REST возвращает записи.

**Шаг 3. `calculator-page` + компоненты** `calc.defaults` / `calc.faq-item`.
Проверка: single type виден, поля на месте.

**Шаг 4. Расширение `product`:** `purpose` (enum), `crop` (relation), `packaging` (repeatable).
Проверка: схема продукта обновлена, каталог не сломан.

**Шаг 5. Логика расчёта:** `server/utils/calc.ts` (площадь → растения → граммы → пачки).

**Шаг 6. Слайд «Посадка»:** `HamburgerGarden.vue` + 3-й таб + 3-я точка (≤ `$tablet`).
Проверка: 3 слайда, свайп/табы/точки синхронны, desktop не изменён.

**Шаг 7. Чат-инструмент** `calcPlanting` (+ `getCropInfo`, `findBlog`).

**Шаг 8. Хаб-страница** `/{locale}/posadka-i-urozhay` (SEO, JSON-LD) + связка со слайдом.

**Позже:** `seedling`/`fertilizing` + корзина, `blog ↔ crop`, `preserve-recipe`.

---

## Открытые вопросы
- Хаб = отдельная страница или расширенная страница категории — решить при реализации.
- Точные нормы (seedRate/germination) — заполняются контентом; для MVP допустимы примерные.
