# Переход npm → pnpm (план)

Статус: **не начато**, записано по просьбе пользователя 13.11.

## Зачем

- скорость установки и диск (content-addressable store + хардлинки);
- строгий `node_modules` (симлинки) — ловит «фантомные» зависимости, которых нет в `package.json`;
- компактный `pnpm-lock.yaml` (YAML, читаемые диффы);
- pnpm 10+ по умолчанию **не запускает install-скрипты** (защита от supply-chain), разрешения — явным списком;
- первый шаг к workspace-режиму (`workspace:*`, `--filter`), если фронт и бэк когда-то объединят.

## Что в проекте npm-специфично (проверено)

- `package.json` (корень): скрипт `"install": "cd backend && npm install"` — при pnpm это ломает установку.
- `backend/package.json`: `engines: { npm: ">=6.0.0" }` — упоминание npm.
- Два независимых пакета: `frontend/`, `backend/` (без workspace).
- Нативные зависимости: `sharp` (frontend), `better-sqlite3` (backend) — их build-скрипты pnpm 10 блокирует
  по умолчанию → нужен `onlyBuiltDependencies` / `pnpm approve-builds`.
- **Деплой — Plesk Node.js**: сборку/установку на сервере запускает сам Plesk. Нужно поменять
  install/build команды приложения на `pnpm i --frozen-lockfile` / `pnpm build` и поставить pnpm на сервер.

## Шаги

1. `corepack enable` + `packageManager: "pnpm@x.y.z"` в обоих `package.json`.
2. `pnpm import` (конвертирует `package-lock.json` → `pnpm-lock.yaml`), затем `pnpm install`.
3. `.npmrc`: `auto-install-peers=true`; для нативных: `only-built-dependencies[]` или `pnpm approve-builds`
   (sharp, esbuild, better-sqlite3 и что попросит).
4. Убрать npm-скрипт `install` из корня, поправить `engines` бэка.
5. Проверка: `pnpm lint`, `pnpm test`, `pnpm build` в обоих пакетах; dev-сервер.
6. Plesk: установить pnpm на сервер, поменять команды приложения (install/build), проверить деплой.
7. Обновить AGENTS.md (команды npm → pnpm) и этот план.

## Результат миграции (20.11.2026)

Сделано в ветке `pnpm-migration` (тег `pre-pnpm`), **бэкенд оставлен на npm**.

- `frontend`: pnpm 10.34.9, `pnpm-lock.yaml`, `packageManager`, `pnpm.onlyBuiltDependencies`
  (`sharp`, `@parcel/watcher`, `esbuild`, `unrs-resolver`), `.npmrc` с `node-linker=hoisted`.
- Корень: убран ломающий pnpm скрипт `install`; `playwright` закреплён точно (1.65.1).
- ESLint: добавлены `ignores` для `.tmp/**`, `.data/**`.
- Бэкенд: `better-sqlite3@13` на Windows/Node 26 из исходников не собирается (MSVC), pnpm-попытка
  откачена; npm-раскладка работает (в `prebuilds/` есть `win32-x64.node`).

Проверки: `pnpm lint` чисто, `pnpm test` 30/30, `pnpm install --frozen-lockfile` 12.7 с,
страница товаров — 12 карточек, 0 битых изображений, без горизонтального скролла.

### Верификация по источникам (важно на будущее)

1. **pnpm 10 читает `package.json#pnpm`**, а **pnpm 11 переносит настройки в `pnpm-workspace.yaml`**
   (`nodeLinker`, `onlyBuiltDependencies` → `allowBuilds`) и перестаёт читать `package.json#pnpm`
   ([pnpm.io/migration](https://pnpm.io/migration)). Перед апгрейдом на 11 — выполнить их codemod.
2. `approve-builds` (`pnpm approve-builds`, v10.1+) пишет разрешения в `pnpm-workspace.yaml`.
   В v10 допустима и наша форма в `package.json#pnpm`.
3. `node-linker=hoisted` — официально рекомендован для инструментов, несовместимых с симлинками
   ([pnpm settings](https://pnpm.io/settings)).
4. **Netlify + pnpm**: поддержка «из коробки» через Corepack, достаточно `pnpm-lock.yaml`
   ([blog](https://www.netlify.com/blog/how-to-use-pnpm-with-netlify-build/)). Известные грабли:
   - старый Corepack падает на проверке ключей → `COREPACK_INTEGRITY_KEYS=0`;
   - Netlify ставит зависимости с `NODE_ENV=production`, и pnpm 10 тогда **пропускает devDependencies** →
     если сборке нужны devDeps (`sass` и т.п.), добавить `PNPM_FLAGS = "--frozen-lockfile --prod=false"`
     в `[build.environment]` netlify.toml. **Проверить на первом деплое.**
5. Lock-файлы сосуществуют: npm игнорирует `pnpm-lock.yaml`, pnpm — `package-lock.json`.

## Риски и откат

- Фантомные зависимости → ошибки «Cannot find module»: добавлять пакеты явно (`pnpm add`).
- Симлинки ломают некоторые инструменты → временно `node-linker=hoisted` (поведение как у npm).
- Нативные модули не собрались → `pnpm rebuild` / approve-builds.
- **Основной риск — деплой (Plesk)**: без pnpm на сервере прод не соберётся. Делать в отдельной ветке,
  проверить локально и только потом менять настройки Plesk.
- Откат: вернуть `package-lock.json` из git, удалить `pnpm-lock.yaml`/`node_modules`, вернуть команды в Plesk.

## Оценка безопасности для проекта

Код приложения не меняется (это только менеджер пакетов) — риск средний и локализован:
1) деплой/Plesk (главное), 2) нативные сборки, 3) возможные фантомные зависимости.
После проверки локально и на тестовой сборке — безопасно.
