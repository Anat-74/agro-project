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

## Статус плана (02.11.2026, вечер)

Сделано:
- ✅ **sharp 0.34 → 0.35.5** (`3424306`) — вне очереди: дерево было **invalid**
  (`@nuxtjs/seo`/`nuxt-og-image` требуют `sharp ^0.35.5`, а корневой стоял 0.34.5).
  Теперь `npm ls sharp` чистый, сборка проходит.
- ✅ **@iconify-json/mingcute 1.2.8 → 1.2.9** (`96df028`).
- ⏸ **@nuxt/icon 1.10.3 → 2.6.2** (`5b3ee1a`) — **откатили** (`c22635c`): с v2 на **всех**
  страницах `Hydration node mismatch` (сервер отдаёт комментарий вместо корня страницы),
  A/B подтверждён: v2 → warning есть, 1.15.0 → warning нет. Остаёмся на **1.15.0**.
  Вернуться к v2 после разбора причины (возможно, вместе с Nuxt-обновлением).
- ✅ **@nuxtjs/color-mode 3.5.2 → 4.1.0** (`7f55b49`). v4 убрал дефолтный `classSuffix`
  (`-mode`), а в `styles.scss` классы `.light-mode/.dark-mode/.custom-mode` → добавили
  `classSuffix: "-mode"` в nuxt.config. Проверено: классы `light-mode`/`dark-mode`/`custom-mode`,
  фон меняется (белый/тёмно-синий), сборка OK (2m23s).
- ✅ **@types/node 24 → 26.6.6**, **happy-dom 20 → 21.0.4**, **dotenv 17 → 18.0.9** (`08f2418`).
  Проверено: `vitest run` — 21/21 тестов, `nuxt typecheck` — 0 ошибок, сборка OK (1m59s).
- ✅ **vitest 4 → 5.1.0** (`a65e213`) — @nuxt/test-utils 4.3.4 официально поддерживает
  `vitest ^5`. Проверено: 21/21 тестов, typecheck 0.
- ✅ **@nuxtjs/mdc 0.17 → 0.23.2** (`f3002f7`) — сборка OK; на посте блога MDC рендерится
  (h2/h3/strong на месте), ошибок в браузере нет.
- ✅ **pinia 3 → 4.1.0 + @pinia/nuxt 1.0.3 + persistedstate 4.7.1** (`eafc821`) —
  тесты 21/21, typecheck 0, сборка OK; корзина: «+» → счётчик 1, после перезагрузки
  остаётся 1 (localStorage `cart`).
- ⏭ **h3 1 → 2 — пропускаем сейчас.** Nuxt 4.6.3 работает на Nitro 2 + h3 v1; h3 v2
  приедет вместе с Nitro 3 (иначе в проекте два несовместимых Event-объекта).
- ⏸ **Backend: react 19 / react-router-dom 7 — отложены.** `@strapi/strapi@5.60.0` в
  peerDependencies требует `react ^18.0.0` и `react-router-dom ^6.30.3`. Обновление
  сломает админку → ждём Strapi 6 (или официальной поддержки).
- ⏸ **Backend: typescript 7 — отложен.** Сборка админки Strapi идёт своим тулингом;
  TS 7 (нативный компилятор) сначала проверить в отдельной ветке на `strapi build`.

Осталось (по плану): `@nuxtjs/color-mode` 4, `h3` 2, `vitest` 5, `dotenv`/`happy-dom`/`@types/node`,
`@nuxtjs/mdc` 0.23, `pinia` 4 + `@pinia/nuxt` 1, backend: `react` 19, `react-router-dom` 7, `typescript` 7.

Наблюдение: `Hydration node mismatch` на всех страницах появляется **только с @nuxt/icon v2**
(на 1.15.0 его нет; на проде со старой сборкой тоже нет). Если вернёмся к v2 — разбирать
первым делом.

