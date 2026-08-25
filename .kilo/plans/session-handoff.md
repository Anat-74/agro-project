# Передача сессии: что нужно знать AI-ассистенту

> Актуально для работы над agro-project (Nuxt 4 фронтенд + Strapi v5 backend).
> Дата: 2026-08-25. Прочитай также: `.kilo/plans/products-page-plan.md` (статус), `AGENTS.md`, `rules.md`.

## 1. Удалённая работа (основной режим)

- **Канал** — Telegram-бот (Kilo Bridge). Ответы — в формате **.md** (заголовки/списки/код).
- **Ни одного действия без явного одобрения**; после каждого шага — краткий отчёт.
- **Долгие операции запрещены удалённо**: `npm install`, `nuxi module add`, `nuxt upgrade` — только когда пользователь за ПК.
- **НЕ запускать `npm run build` для проверки** — сборку делает деплой на Plesk. Проверка ошибок — через **MCP Spyglass** (нужен запущенный dev-сервер через `background_process`).
- **Пиковые/не пиковые часы** (в AGENTS.md): не пиковые 7–9 и 13–4 (МСК) — стоимость токенов ×2 ниже; объёмные работы — туда, в пик — мелкие правки.
- Освобождать ресурсы после проверок (dev-серверы, браузер), кроме серверов, запущенных пользователем.

## 2. Деплой (автоматизация)

- **Фронтенд:** `node scripts/deploy.mjs` (домен по умолчанию `vh324.by3020.ihb.by`).
- **Strapi backend:** `node scripts/deploy.mjs api.vh324.by3020.ihb.by`.
- Скрипт логинится в Plesk, делает git «Получить/Развернуть», запускает build (кнопка «Запустить»). **Логи билда не видны.**
- **⚠️ ВАЖНО: после сборки прод обновляется ТОЛЬКО после «Перезапустить приложение» в Plesk** (Passenger держит старый билд; deploy.mjs перезапуск НЕ делает). Скрипт перезапуска: `node scripts/restart-app.mjs`.
- **Build-скрипт (`frontend/package.json`): `"build": "nuxt build"`** — рабочий. **НЕ менять**
- Проверка прода: хеш entry-CSS (`/_nuxt/entry.*.css`) должен смениться. Пользователь может видеть старое из-за **PWA-сервис-воркера** — нужен hard-refresh.
- Прод-домены: Nuxt `vh324.by3020.ihb.by`, Strapi `api.vh324.by3020.ihb.by`, Plesk `:8443`. Детали — в `.kilo/plans/deploy-guide.md`.

## 3. Strapi

- **Локально:** `127.0.0.1:1337`. Поднимать `npm run dev` в `backend/` через `background_process`.
- **Zombie-процесс:** если `/_health` отвечает, а `/api/*` нет (000) — убить процесс на порту 1337 (`netstat -ano | grep :1337 | grep LISTEN` → `taskkill //PID ... //F`) и поднять заново.
- **mcp-strapi — основной инструмент** для данных (схемы, CRUD, медиа). Не работает, если локальный Strapi не запущен («Not authenticated»).
- **Создано:** компонент `layout.breadcrumbs` (вложенный `background.background-image`); поле `breadcrumbs` в `global` (опубликовано; фон — временные webp 456 / avif 442).

## 4. Текущий статус страницы «/ru/products»

**Готово:** страница (section + скрытый H1), breadcrumbs (UBreadcrumbs → UBackground), top-bar (USelect, зелёная кнопка «Фильтр», количество), сайдбар (все инпуты через UInput: radio/range-dual/pill), сетка ProductCard (container queries, 2-в-ряд на мобильном), фильтры/сортировка/пагинация, SEO, hero-ссылка → /products.

**TODO:** диалог фильтров на мобильном; breadcrumbs на about/services/contacts/blog/news; свой фон breadcrumbs от пользователя; статический JSON-LD; финальный деплой + перезапуск приложения.

**Ключевые компоненты:** `USelect.vue`, `UInput.vue` (radio, range-dual, pill), `UBreadcrumbs.vue`, `ShowShopFilter.vue`, `ProductCard.vue` (container `card product`), `UImage.vue` (`@container product`).
