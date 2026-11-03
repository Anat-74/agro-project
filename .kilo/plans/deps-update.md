# Обновление зависимостей — правила

Зафиксировано по реальному обновлению 01.11.2026 (Node 22 → 26, Strapi 5.48 → 5.60, `@nuxtjs/seo` 3 → 6).

## Что учесть на будущее

1. **После мажорного апгрейда Node** — сразу пересобрать/переустановить **нативные** пакеты
   (`better-sqlite3`, `sharp` и т.п.). Иначе падение `NODE_MODULE_VERSION`:
   старый Node = 127, новый — своё число; бинарь собирается под конкретный ABI.
   - `better-sqlite3` 11.x **не имеет prebuilt** под Node 26 → ставим 13.x (есть prebuilt);
   - `npm rebuild` без тулчейна (node-gyp) на Windows падает — проще поставить версию с prebuilt.
2. **Перед `npm install` обновить сам npm** — баг `Cannot read properties of null (reading 'edgesOut')`
   в npm 11.5 ломает разрешение дерева; лечится `npm i -g npm@latest` (12.x).
3. **Останавливать dev-процессы перед установкой** — иначе `EBUSY` на DLL/файлах
   (`sharp/libvips-*.dll` и т.п. держатся запущенными Strapi/Nuxt).
4. **npm 12 блокирует install-скрипты** (`allowScripts`) — нативному пакету нужен
   `npm install-scripts approve <pkg>`, иначе не выполнится `prebuild-install`.
5. **Проверять требования по Node** у новых мажоров (`engines`). Пример: `@nuxtjs/seo@6` и
   `nuxt-og-image@7` требуют Node ≥22.22.3.
6. **После обновления — обязательно `npm run build`** (frontend) и **запуск Strapi** (backend),
   а не только `npm ls`. «Пакет установился» ≠ «проект собирается».
7. **Правило разделения:** minor/patch — можно пачкой (`npm update`); **мажоры — по одному**,
   с проверкой breaking-изменений и сборки.

## Порядок обновления (проверенный)

1. `node -v` — сравнить с `engines` нужных пакетов.
2. Остановить dev-серверы.
3. `npm i -g npm@latest`.
4. `npm update` (minor) или `npm i <pkg>@latest` (мажор, по одному).
5. Для нативных: `npm install-scripts approve <pkg>` → при необходимости смена версии на ту, что с prebuilt.
6. `npm run build` (frontend), `npm run dev` (backend) — убедиться, что стартует.
7. Коммит с версиями (lock в репозиторий), затем деплой.

## Актуальные версии после обновления (01.11.2026)

- Node: **26.13.0** (локально), на хостинге 22.23.4 (совместимо);
- **Strapi: 5.60.0**, `better-sqlite3`: 13.0.3;
- `@nuxtjs/seo` 6.0.1, `nuxt-og-image` 7.0.7 (**satori удалён из дерева**);
- `@nuxt/fonts` 1.2.0, `@nuxtjs/mcp-toolkit` 0.24.3;
- Nuxt 4.6.3, Vue 3.5.44 (актуальные).

## План мажорных обновлений (по одному) — 02.11.2026

Правило: **один пакет (или одна связанная группа) за итерацию**.
После каждого шага: установка → `npm run build` → проверка затронутых страниц → коммит.
При поломке — откат **только этого шага**, не всей пачки.

### Frontend (от меньшего риска к большему)
1. `@iconify-json/mingcute` (minor) — иконки.
2. `@nuxt/icon` 1.15 → 2.6 — иконки (проверить набор `@iconify-json/*` и тему).
3. `@nuxtjs/color-mode` 3.5 → 4.1 — тема/яркость (переключатель в хедере).
4. `h3` 1.15 → 2.0 — server routes/нитро.
5. `sharp` 0.34 → 0.35 — нативный (пересборка под Node).
6. `vitest` 4.1 → 5.0 — тесты.
7. `dotenv`, `happy-dom`, `@types/node` — мелкие мажоры.
8. `@nuxtjs/mdc` 0.17 → 0.23 — markdown (статьи/рецепты).
9. `pinia` 3 → 4 + `@pinia/nuxt` 0.11 → 1.0 — store API (корзина, фильтры).

### Backend (Strapi)
10. `react` / `react-dom` 18 → 19 (+ `@types/react`) — админка (сборка админки, вход).
11. `react-router-dom` 6 → 7 — роутинг админки.
12. `typescript` 5.9 → 7 (+ `@types/node` 26) — тулинг/сборка (делать последним).

### Критерий приёмки шага
- `npm run build` без ошибок;
- страницы, затронутые пакетом, открываются и работают;
- для backend — `npx strapi build` + успешный старт.

## Статус плана (обновлено 03.11.2026)

### Сделано
- ✅ **sharp 0.34 → 0.35.5** (`3424306`) — вне очереди: дерево было **invalid**
  (`@nuxtjs/seo`/`nuxt-og-image` требуют `sharp ^0.35.5`). Сейчас `npm ls sharp` чистый.
- ✅ **@iconify-json/mingcute 1.2.8 → 1.2.9** (`96df028`).
- ✅ **@nuxt/icon 1.10 → 2.6.2** (`eeb8ae1`) + `provider: "server"`, `serverBundle: "local"`.
  Проверено: 12 карточек, 208 svg (207 с path), сборка OK (1m57s).
- ✅ **@nuxtjs/color-mode 3.5.2 → 4.1.0** (`7f55b49`). v4 убрал дефолтный `classSuffix`
  (`-mode`) → добавлен `classSuffix: "-mode"`. Проверено: `light-mode`/`dark-mode`/`custom-mode`,
  фон меняется, сборка OK.
- ✅ **@types/node 24 → 26.6.6**, **happy-dom 20 → 21.0.4**, **dotenv 17 → 18.0.9** (`08f2418`).
- ✅ **vitest 4 → 5.1.0** (`a65e213`) — `@nuxt/test-utils` 4.3.4 поддерживает `vitest ^5`.
- ✅ **@nuxtjs/mdc 0.17 → 0.23.2** (`f3002f7`) — блог рендерится (h2/h3/strong), ошибок нет.
- ✅ **pinia 3 → 4.1.0 + @pinia/nuxt 1.0.3 + persistedstate 4.7.1** (`eafc821`) —
  корзина: «+» → счётчик 1, после перезагрузки сохраняется.

Итоговые проверки блока: `vitest run` — 21/21; `nuxt typecheck` — 0 ошибок;
`npm run build` — успешно.

### Отложено (объективные причины)
- ⏸ **h3 1 → 2** — Nuxt 4.6.3 работает на Nitro 2 + h3 v1; h3 v2 приедет с Nitro 3
  (иначе два несовместимых Event-объекта).
- ⏸ **react 19 / react-router-dom 7** — `@strapi/strapi@5.60.0` требует `react ^18.0.0`
  и `react-router-dom ^6.30.3`; обновление сломает админку. Ждём Strapi 6.
- ⏸ **typescript 7** — сборка админки Strapi идёт своим тулингом; проверять отдельно
  на `npx strapi build`, лучше в отдельной ветке.

### Что ещё открыто
- **Гидрейшн-mismatch / пустой SSR — решено (03.11.2026).** Причина: routeRules вида
  `"/**/auth/**": { ssr: false }` в Nuxt 4.6 помечали как SPA **все** страницы
  (`_spaOnlyPageStub`). Фикс: явные пути с локалью (`4f931ef`). Разбор —
  `.kilo/plans/ssr-hydration.md`. На сборке: 0 заглушек страниц, hydration mismatch — 0.
- **bridge.js / `.md` — реализовано** (`text/plain` через Bot API), мост перезапущен.
  Детали — `.kilo/plans/bridge-md-mime.md`.

Действующих пунктов по обновлению зависимостей не осталось: всё, что можно было
обновить без смены Strapi/Nitro, обновлено и проверено.


