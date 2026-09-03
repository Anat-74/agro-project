# План работ

## Реализовано (история, по коммитам)

- `794ac77` — `useDialog` → `useState` (SSR-утечка: шапка пропадала на главной после SSR продуктов).
- `75401a4` — реструктуризация страницы продуктов; анимация фильтра только `transform` (JS `--header-h`, GPU, без reflow); aria-label header. Этим закрыта тема «плавности контента при открытии/закрытии» (двойной layout-reflow высот шапки+страницы).
- `48a10ee` — высота карточки через `containerAdaptive` (в ProductCard), контейнер `cards` на `ul`.
- `83858df` — удалена обёртка `.products-page__content` (пагинация вне потока, absolute); ULoader самопозиционирующийся (fixed, центр вьюпорта); data-fetching на Nuxt 4 `status` + реактивный ключ (без ручных `refresh()`); карточки-высоты/классы чистка.
- `7b36f5b` — select без эффекта углубления; счётчик results с inset-эффектом.

---

## Открытые задачи

_Остались только конвенции/справка ниже. O2 реализован 03.09.2026 (не закоммичено): ShowShopFilter стартует закрытым (initialOpen:false, без авто-открытия/close на маунте); products/index.vue открывает панель на desktop один раз после `status === 'success'` (`useViewport` > mobile). Проверено: mobile — вход закрыт без клампа (нет флипа), кнопка открывает; desktop — открывается после данных.

---

## 2. Конвенции адаптива: range-медиазапросы, toEm, containerAdaptive (справка)

### 2.1. Range-медиазапросы (Media Queries Level 4)

Проверка двух границ одной строкой вместо `@media (min-width: A) and (max-width: B)`:

```scss
@media ($mobileSmall <= width <= $tablet) { ... }
// эквивалент «больше-равно» (тоже валидно):
@media ($tablet >= width >= $mobileSmall) { ... }
```

- Значения — переменные из `_settings.scss` (`$mobile`, `$mobileSmall`, `$tablet` — уже в `toEm`).
- Поддержка: Chrome 104+, Firefox 102+, Safari 16.4+.
- Пример в проекте: `@media ($tablet <= width <= toEm(1250))` (FeaturedProductsSection).

### 2.2. «Три кита» адаптива + toEm

Container queries (блок-ширина) + `clamp` (непрерывность) + media queries (вьюпорт). Все значения/брейкпоинты — через `toEm()`/`toRem()` (без «голых» px).

### 2.3. Миксин `containerAdaptive`

```scss
@mixin containerAdaptive(
  $property, $startSize, $minSize,
  $containerFrom, $containerTo,
  $unit: "cqw"
)
```

- Генерирует `clamp(min, calc(yIntercept + slope·cqw), max)` — непрерывная интерполяция по ширине контейнера (в отличие от дискретных `@container`).
- Fallback без CQ — та же кривая по `vw`.
- Использование: высота карточки в `ProductCard.vue` — `containerAdaptive("height", 320, 250, 1000, 360)`; реагирует на ближайший контейнер-предок (`cards` на `ul`), иначе на вьюпорт.

---

## Nuxt 4 data-fetching — отдельный файл правил

`frontend/docs/nuxt-async-data.md` — статусы (`status` вместо `pending`), реактивные ключи, `watch`, abort-сигнал, опции, эталон на странице продуктов.
