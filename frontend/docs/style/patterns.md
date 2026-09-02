# Паттерны реализации (style patterns)

Принятые в проекте подходы «задача → реализация» с фокусом на **минимальную нагрузку на CPU**
(анимации на GPU/композиторе, без JS-замеров и циклов).

> Стек: Nuxt 4, Vue 3, SCSS (BEM), Strapi v5.

---

## 1. Класс-биндинги (реактивный класс вместо watch)

**Задача:** менять стиль по состоянию (открыт/закрыт, видимость блока) без лишнего JS.

**Правило:** состояние читаем из глобального `useDialog(id)` (id-only) — тот же ref, что у диалога.
Статичный класс + условные модификаторы — в одном `:class` массиве:

```vue
<!-- любой компонент, которому нужно состояние диалога -->
<script setup>
const { isOpen } = useDialog("shopFilterDialog")
</script>

<template>
  <header :class="['header', { 'header_filter-open': isOpen }]">
</template>
```

- Никаких `watch`/`onMounted` для стилей — реактивность класса это делает сама (минимальный CPU).
- Один источник состояния — `useDialog` хранит `isOpen` в глобальном `Map` по id.

**Альтернатива (когда нужен template-ref):** только если нужен вызов метода дочернего компонента
(например `toggle()` у диалога):

```vue
const shopFilterRef = useTemplateRef<InstanceType<typeof ShowShopFilter>>("shopFilter")
<!-- кнопка: -->
<UButton @click="shopFilterRef?.toggle()" :aria-expanded="shopFilterRef?.isOpen" />
```

Но для **классов** используем `useDialog` (template-ref на SSR = null и не работает вне родителя).

## 2. GPU-анимации (transform/opacity) + CSS-only раскладка

**Задача:** блок плавно исчезает/появляется, соседний контент занимает место — без дёрганья.

**Правило:**
- **transform / opacity** анимируются на GPU/композиторе (`translate`, `translateY`, `opacity`, `visibility`).
- **height/width** — layout (CPU), анимируются аккуратно (или через `interpolate-size`).
- **display** — дискретно: задерживаем `display: none` до конца exit-анимации
  (`transition: display 0s var(--transition-duration) allow-discrete`).

**Пример — шапка исчезает, breadcrumbs + top-bar остаются** (страница товаров, mobile):

```scss
// AppHeader.vue — шапка уезжает вверх (GPU) и освобождает место
.header {
  @media (max-width: $mobile) {
    interpolate-size: allow-keywords;
    transition:
      height var(--transition-duration),
      transform var(--transition-duration);

    &_filter-open {
      height: 0;
      overflow: hidden;
      transform: translateY(-100%);
    }
  }
}
```

```scss
// products/index.vue — страница становится колонкой высотой во вьюпорт:
// breadcrumbs + top-bar в потоке, body (flex:1) заполняет остаток
.products-page {
  // Мобильный flex: зона контента (container-body) заполняет клампнутый вьюпорт
  @media (max-width: $mobile) {
    display: flex;
    flex-direction: column;

    .products-page__header { flex-shrink: 0; }
    // __container-body — flex-ребёнок колонки → авто-маржу [class*="__container"]
    // нейтрализуем (вьюпорт < 1420, центрировать нечего)
    .products-page__container-body {
      flex: 1; min-height: 0;
      margin-inline: 0;
    }
  }
}
```

```scss
// ShowShopFilter.vue — диалог заполняет body, вход снизу вверх (GPU)
.show-shop-filter {
  @media (max-width: $mobile) {
    position: absolute;
    inset: 0;
    z-index: 9999;
  }

  &__dialog {
    translate: 0 100%;               // закрыто — снизу
    opacity: 0;
    transition:
      translate var(--transition-duration),
      opacity var(--transition-duration);

    &[open] { translate: 0; opacity: 1; }
  }
}
```

**Ключевое:** никаких JS-замеров высоты (`getBoundingClientRect`) — раскладка на flex
сама подстраивается под любую высоту breadcrumbs/top-bar. Минимум CPU.

## 3. Container Queries + миксин `containerParent`

**Задача:** компонент адаптируется к ширине своего контейнера, а не вьюпорта.

**Правило:** `@include containerParent(<имя(имена)>, inline-size)`. Имён может быть несколько
через пробел (SCSS-список):

```scss
// ProductCard.vue — карточка = контейнер с двумя именами
.product-card {
  @include containerParent(card productImage, inline-size);
  // card         — свои @container card (max-width: 210px) → front/back
  // productImage — UImage внутри применит свои @container productImage
}
```

```scss
// products/index.vue — контейнер cards на САМОМ списке (ul).
// ul — block-грид: ширина от родителя, поэтому container-type его не схлопывает
// (в отличие от flex-ленты, ширина которой от контента).
.products-page__card-list {
  @include containerParent(cards, inline-size);
}
// Высоту карточки (li) задаёт сам ProductCard.vue через containerAdaptive,
// реагируя на ширину этого контейнера (cqw → ближайший контейнер-предок = ul).
// «2 колонки» на телефонах — медиа-запросом (self-query на ul невозможен):
@media (max-width: $mobileSmall) {
  .products-page__card-list { grid-template-columns: repeat(2, 1fr); }
}
```

Брейкпоинты в `@container` — в пикселях (см. UImage.vue: `@container product (max-width: 256px)`).

## 4. Body-lock при открытом оверлее

**Задача:** при полноэкранном диалоге страница не должна скроллиться.

**Правило:** глобальный `body:has(...)` в `_globals.scss` (только mobile):

```scss
body:has(
  .dialog-hamburger[open]:not(.hidden-tablet .dialog-hamburger),  // скрытый desktop-инстанс исключаем
  .show-shop-filter__dialog[open],
  .chat-assistant__modal[open],
  .cart-dialog[open]
) {
  @media (max-width: c.$mobile) { overflow: hidden; }
}
```

## 5. Синхронный сдвиг контента (анимация ширины)

**Задача:** при сворачивании колонки соседний контент едет **синхронно**, без задержки.

**Правило:** ширина анимируется (`width var(--transition-duration)`), а не «держится и прыгает»
(`width 0s var(...)`); закрытое состояние — явный `width: 0`:

```scss
.show-shop-filter {
  transition:
    display 0s var(--transition-duration) allow-discrete,
    width var(--transition-duration);

  &:has(.show-shop-filter__dialog[open]) { width: var(--filter-width); }

  &:not(:has(.show-shop-filter__dialog[open])) {
    display: none;
    width: 0;   // desktop: плавное схлопывание
  }
}
```
