# Hydration node mismatch / пустой SSR страниц

Дата: 03.11.2026. Коммит фикса: `4f931ef`.

## Симптом

- `[Vue warn]: Hydration node mismatch` на всех страницах:
  сервер отдаёт `#comment` (`<!---->`) там, где клиент ждёт корень страницы
  (`<section class="products-page">` / `<div>`), родитель — `MAIN.page-main`.
- В SSR-HTML вместо страницы пустой комментарий, в `__NUXT_DATA__` нет данных страницы.
- В серверной сборке нет чанков страниц (`HeroSection`, `products-page` и т.д.).

## Причина

В `nuxt.config` были routeRules:

```ts
"/**/cartshopping": { ssr: false },
"/**/auth/**": { ssr: false },
"/**/cabinet/**": { ssr: false },
```

В Nuxt 4.6 алгоритм разметки страниц под routeRules помечает такими правилами
**ВСЕ страницы** (в серверном `entry.mjs` у всех 26 маршрутов
`component: () => Promise.resolve(_spaOnlyPageStub)`). Итог: страницы не рендерятся
на сервере вообще (CSR), а клиент рендерит их → hydration mismatch.

Проверено и исключено: версия `@nuxt/icon`, `pageTransition` (с `mode: out-in`
и без), `experimental.viewTransition`, `VitePwaManifest` в `app.vue`,
`body min-width`, тестовая страница без данных (рендерилась — значит механизм SSR жив).

## Фикс

1. Удалить `ssr: false` из routeRules (`/**`-паттерны в Nuxt 4.6 ломают разметку страниц).
2. На конкретных CSR-страницах (auth, cabinet, cartshopping) — `definePageMeta({ ssr: false })`.

## Проверка

- `/ru`, `/ru/products`, `/ru/kontakty` рендерятся на сервере (в `<main>` реальный контент).
- Hydration-предупреждений — 0 на этих страницах.
