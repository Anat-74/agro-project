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

1. Убрать из routeRules шаблоны с `/**` в начале.
2. CSR-страницы перечислить **явными путями с локалью** (ru/be):
   `/ru/cartshopping`, `/ru/auth/**`, `/ru/cabinet/**` и то же для `be`.
3. Дополнительно на CSR-страницах стоит `definePageMeta({ ssr: false })` (безвредно, дублирует правило).

## Проверка

Dev:
- `/ru`, `/ru/products`, `/ru/kontakty` рендерятся на сервере (в `<main>` реальный контент);
- hydration-предупреждений — 0;
- `/ru/cartshopping` отдаёт SPA-шелл (`<div id="__nuxt"></div>`) — CSR работает.

Прод-сборка (node .output/server, порт 3200):
- `/ru` — 483 КБ, страница в SSR;
- `/ru/products` — 552 КБ, страница в SSR;
- `/ru/cartshopping` — 14,8 КБ, SPA-шелл;
- hydration mismatch — 0 на `/ru`, `/ru/products`, `/ru/kontakty`.

## Почему Spyglass и DevTools молчали

Spyglass логирует ошибки/варнинги, а здесь **ничего не падает**: Nuxt намеренно
подставляет `_spaOnlyPageStub` (страница «пустая» по правилам) — это не ошибка.
Признак виден только в артефактах сборки: `.output/server/chunks/virtual/entry.mjs`
(у всех маршрутов `component: () => Promise.resolve(_spaOnlyPageStub)`) и в пустом
`<main>` серверного HTML. DevTools показывает уже отрендеренное дерево (на клиенте
страница есть), поэтому причину тоже не покажет.

