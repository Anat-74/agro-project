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
