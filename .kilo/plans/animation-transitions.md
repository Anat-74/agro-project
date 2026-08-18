# План: анимации переходов между страницами (Vue Transitions + View Transitions)

> **Режим:** удалённая работа
> **Правило:** ни шага без одобрения, после каждого шага — отчёт

---

## Итоговая стратегия

| Страница | Анимация | Включение |
|---|---|---|
| SSR-страницы с данными (главная, каталог, товар, блог) | Vue Transitions (кроссфейд) | глобально, дефолт |
| Лёгкие CSR-страницы (корзина, избранное, настройки) | View Transitions (слайд) | opt-in через `definePageMeta` |
| Браузеры без VT API | Vue Transitions везде | fallback автоматический |

**Решение по диалогам:** компонент `TransitionLink.vue` из диалога 3 НЕ использовать — Nuxt нативно реализует VT через `experimental.viewTransition` + `definePageMeta`, покрывает все переходы (NuxtLink, router.push). Ручной `startViewTransition` даёт двойной переход, теряет types и не работает при программной навигации.

---

## Реализация

### Шаг 1. `nuxt.config.ts` — глобальные настройки

```ts
export default defineNuxtConfig({
  experimental: {
    viewTransition: true,      // разрешить VT (флаг обязателен для definePageMeta)
  },
  app: {
    viewTransition: false,     // глобальный дефолт VT — ВЫКЛ, включаем точечно
    pageTransition: {
      name: 'page-fade',
      mode: 'out-in',
    },
  },
})
```

### Шаг 2. CSS переходов — `assets/scss/base/_view-transitions.scss`

Подключить в `styles.scss` (css-entry).

```scss
// Vue Transitions (глобальный fade)
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

// View Transitions (CSR-страницы)
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}

html:active-view-transition-type(slide-forward) {
  &::view-transition-old(root) { animation: slide-out-left 0.3s ease-in-out; }
  &::view-transition-new(root) { animation: slide-in-right 0.3s ease-in-out; }
}
html:active-view-transition-type(slide-back) {
  &::view-transition-old(root) { animation: slide-in-right 0.3s ease-in-out; }
  &::view-transition-new(root) { animation: slide-out-left 0.3s ease-in-out; }
}
```

### Шаг 3. Middleware — отключение Vue-транзишена только на VT-страницах

`middleware/disable-vue-transitions.global.ts`:

```ts
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server || !document.startViewTransition) return
  if (to.meta.viewTransition) {
    to.meta.pageTransition = false
    to.meta.layoutTransition = false
  }
})
```

Отличие от доков Nuxt: отключаем НЕ глобально, а только когда у целевой страницы включён VT (иначе SSR-страницы остаются без анимации в браузерах с VT).

### Шаг 4. Opt-in на лёгких CSR-страницах

```ts
// pages/cart.vue (пример)
definePageMeta({
  viewTransition: {
    enabled: true,
    types: ['slide-forward'],
  },
})
```

Навигация вперёд/назад — через `fromTypes`/`toTypes` (или функции на основе маршрута, Nuxt 4.4+).

### Шаг 5. Fallback и ограничения

- Браузеры без VT (FF/Safari): `startViewTransition` отсутствует → middleware молчит, Vue-transition работает. Ничего дополнительно.
- SSR-страницы: VT не включаем (заморозка DOM при async-данных — известная проблема Nuxt).
- `prefers-reduced-motion`: Nuxt сам не применяет VT при reduced (`experimental.viewTransition: true`, не `'always'`); `_animations.scss` уже отключает анимации.

---

## Риски (проверить при внедрении)

1. ✅ **Единый корневой элемент — РЕАЛИЗОВАНО (08.18):** страницы-фрагменты ломали SPA-навигацию при глобальном `pageTransition` (`Component inside <Transition> renders non-element root node`, `out-in` не монтировал новую страницу — данные не видны до перезагрузки). Обёрнуты в единый `<div>`: `[lang]/index.vue`, `[lang]/blog/[slug].vue`, `[lang]/news/[slug].vue`, `[lang]/[categorySlug]/index.vue`, `[lang]/[categorySlug]/products/index.vue`, `[lang]/[categorySlug]/products/[productSlug]/index.vue`, `[lang]/[categorySlug]/[subcategorySlug]/index.vue`, `[lang]/[categorySlug]/[subcategorySlug]/[productSlug]/index.vue`. Проверено локально: главная→товар, главная→категория — контент рендерится при SPA-переходе.
2. `.dark-mode { filter: brightness(95%) }` создаёт stacking context — проверить позиционирование снимков VT.
3. Кандидаты на VT: только страницы без тяжёлых async-данных (корзина, избранное и т.п.).

---

## Формат работы

Каждый шаг — только после одобрения. После каждого — краткий отчёт.
