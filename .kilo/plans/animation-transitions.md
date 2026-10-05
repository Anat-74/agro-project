# Анимации переходов между страницами — ✅ РЕАЛИЗОВАНО

> Статус (05.10.2026): реализовано. Детали — история git. Файл оставлен как справка по конвенциям.

## Что работает

- `nuxt.config.ts`: `experimental.viewTransition: true`, `app.viewTransition: false` (глобально VT выкл),
  `app.pageTransition = { name: "page-fade", mode: "out-in" }`.
- Стили переходов — `app/assets/scss/base/_view-transitions.scss` (подключён в `styles.scss`).
- Middleware отключает Vue-транзишен **только** на VT-страницах (`to.meta.viewTransition`).
- Opt-in VT — `definePageMeta({ viewTransition: {...} })` на лёгких CSR-страницах (корзина и т.п.).

## Конвенции (соблюдаем)

- **SSR-страницы с async-данными — только Vue-транзишен.** VT замораживает DOM при async-данных
  (известная проблема Nuxt) — на SSR-страницах не включаем.
- **VT — только лёгкие CSR-страницы** без тяжёлых async-данных.
- Каждый page-компонент — с **единым корневым элементом** (иначе `out-in` не монтирует новую страницу).
- Браузеры без VT API (FF/Safari) — автоматический fallback на Vue-транзишен, доп. код не нужен.
- `prefers-reduced-motion` — Nuxt сам не применяет VT; `_animations.scss` отключает анимации.

## Риск (проверять при изменениях)

- `.dark-mode { filter: brightness(95%) }` создаёт stacking context — влияет на снимки VT.
