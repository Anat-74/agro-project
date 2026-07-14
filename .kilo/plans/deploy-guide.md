# Strapi — деплой на Plesk + перенос данных

---

## 1. Подготовка Strapi к деплою

### 1.1 Создан `server.js` (точка входа для Plesk)

**Файл:** `backend/server.js`

```js
const strapi = require("@strapi/strapi");
const app = strapi.createStrapi({ distDir: "./dist" });
app.start();
```

### 1.2 Добавлен корневой `server.js` (прокси)

**Файл:** `server.js` (корень репозитория)

```js
require('./backend/server.js');
```

Нужен, чтобы Plesk мог запускать Strapi без смены корневой папки приложения.

### 1.3 Добавлен `mysql2` в `package.json`

`mysql2` не был в зависимостях — после `npm install` на сервере он пропадал. Добавлен в `backend/package.json`.

### 1.4 Настроен `.gitignore`

Исключены артефакты `backend@0.1.0`, `strapi` (пустые файлы).

---

## 2. Настройка Plesk

### 2.1 Подключён Git-репозиторий

- URL: `https://github.com/Anat-74/agro-project.git`
- Ветка: `master`
- Режим: автоматический деплой

### 2.2 Node.js настройки

- **Корневая папка приложения:** `/api.vh324.by3020.ihb.by`
- **Файл запуска:** `server.js`
- **Переменные окружения:** удалены (Strapi использует `.env` на сервере)

### 2.3 Post-deploy хуки

После каждого `git push` сервер выполняет:

```bash
cd backend
npm install
npm run build
```

---

## 3. Перенос данных (экспорт → импорт)

### 3.1 Экспорт локально

```bash
cd C:\agro-project\backend
npm run strapi export -- --file agro-data --key 123
```

Результат: `backend/agro-data.tar.gz.enc`

### 3.2 Загрузка на сервер

Через Plesk → **Файлы** → загрузить `agro-data.tar.gz.enc` в `/api.../backend/`

### 3.3 Импорт на сервере

Через Plesk → **Node.js** → **Выполнить команды Node.js**:

```bash
cd backend && npm run strapi import -- --file agro-data.tar.gz.enc --key 123 --force
```

---

## 4. Netlify — деплой Nuxt 4 (не завершён, остановлен)

### 4.1 Проблема

Nuxt 4 + Netlify оказались сложны в настройке. Основные причины:

| № | Проблема | Подробности |
|---|----------|-------------|
| 1 | **Publish directory** | Nuxt 4 с Netlify preset кладёт файлы в `.output/public/`. Netlify по умолчанию ищет `dist/`. Если указать не тот путь — 404 на JS/CSS. |
| 2 | **Переменные окружения** | `NUXT_PUBLIC_STRAPI_URL` должна быть задана явно в Netlify Dashboard (или `netlify.toml`). Без неё Nuxt стучится в `localhost:1337`. |
| 3 | **SSR таймаут** | Netlify Functions (бесплатный тариф) имеют лимит 10 сек. Strapi может отвечать дольше → SSR падает. |
| 4 | **Лимиты билд-минут** | Бесплатный тариф закончился после 15+ неудачных сборок. |
| 5 | **PWA / Workbox** | `@vite-pwa/nuxt` кеширует старую версию страницы, из-за чего обновления не применяются (даже при смене env vars). |

### 4.2 Что пробовали

| Попытка | netlify.toml | Publish | Результат |
|---------|-------------|---------|-----------|
| 1 | `publish = ".output/public"` | `.output/public` | ❌ Директория не существует на Netlify |
| 2 | `publish = "dist"` | `dist` | ❌ 404 на JS/CSS |
| 3 | Без publish | авто | ❌ 75 файлов без `_nuxt/` |
| 4 | `[[redirects]]` к функции | авто | ❌ Сборка падала |
| 5 | `public/_redirects` файл | авто | ❌ Не помогло |
| 6 | `NITRO_PRESET` env var | — | ❌ Конфликт с `nuxt.config.ts` |
| 7 | PWA отключено | `dist` | ❌ Не помогло |

### 4.3 Выводы по Netlify

- Для Nuxt 4 на Netlify нужен **платный тариф** (SSR таймауты, билд-минуты)
- PWA сервис-воркер мешает обновлениям — нужно чистить кеш после каждого деплоя
- Проще деплоить Nuxt на свой сервер (Plesk), чем на Netlify
- Если возвращаться к Netlify — использовать `nuxi generate` для статики, а SSR на отдельном сервере

### 4.4 Для возврата к Netlify (агентам)

Если проект снова будет деплоиться на Netlify:

1. Вернуть `nitro.preset = "netlify"` в `nuxt.config.ts`
2. В `nuxt.config.ts` удалить `nitro.output.publicDir`
3. В `netlify.toml` указать `publish = ".output/public"`
4. В `netlify.toml` добавить `[[redirects]]` для функции SSR
5. Удалить PWA (`@vite-pwa/nuxt`) временно для отладки
6. В Netlify Dashboard задать `NUXT_PUBLIC_STRAPI_URL=https://api.vh324.by3020.ihb.by`
7. Чистить кеш билдов (Clear cache and deploy)
8. Тестировать в инкогнито (чтобы service worker не кешировал)

---

## 5. Текущий статус проекта

| Компонент | Статус |
|-----------|--------|
| Strapi на хостинге (api.vh324.by3020.ihb.by) | ✅ Работает, Git-деплой через Plesk |
| Nuxt фронтенд (vh324.by3020.ihb.by) | ✅ Работает, Git-деплой через Plesk. SSR включён. |
| Netlify | ❌ Закончились кредиты, нужен платный тариф |

### 5.1 Финальная конфигурация Nuxt на Plesk

| Параметр | Значение |
|----------|----------|
| **Корневая папка приложения** | `/httpdocs/frontend` |
| **Файл запуска** | `.output/server/index.mjs` |
| **Nitro preset** | `node-server` |
| **Переменные окружения Plesk** | удалены (все через `.env` в `frontend/.env`) |
| **.env файл** | скопирован из корня (`/httpdocs/.env`) в `/httpdocs/frontend/.env` |
| **Post-deploy хуки** | не настроены (npm не найден) — ожидание поддержки хостинга |

### 5.2 Порядок деплоя (после git push)

1. **Plesk → Git** — дождаться, что репозиторий обновлён
2. **Plesk → Node.js → Выполнить команды Node.js**:
   ```bash
   cd frontend && npm install && npm run build
   ```
3. **Plesk → Node.js → Перезапустить приложение**
4. Подождать 15-20 секунд (Passenger инициализация)
5. Открыть `vh324.by3020.ihb.by`

---

## 6. Планы (следующие шаги)

### 6.1 Доработка фона (BackgroundSwitcher + UBackground)

Возобновить Шаг 4 из `refactor-plan.md`:
- Создать `BackgroundSwitcher.vue`
- Обновить `UBackground.vue` (динамический режим)
- Создать компоненты в Strapi (background-option, background-options)

### 6.2 Перенос новых Strapi-компонентов на сервер

После пуша изменений Strapi обновится через Git. Если структура БД изменилась — сохранить через Content-Type Builder.

### 6.3 Тестирование с телефона

- Через эмуляцию в Chrome (F12 → Device Toolbar)
- Или настроить `--host` после фикса `crypto.randomUUID`
