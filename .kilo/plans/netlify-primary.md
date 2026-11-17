# Netlify как основной сервер (план)

Статус: согласовано 16.11.2026, к исполнению после авторизации в Netlify.

## Роли
- **Netlify** — основной сервер (витрина магазина, все функции: заказы, AI-чат, sitemap).
- **Plesk** (`https://vh324.by3020.ihb.by`) — резервный вариант на случай проблем с доступом к Netlify.
- **Strapi** один для обоих: `https://api.vh324.by3020.ihb.by` (проверено: 200, 33 товара, CORS `*`).

## Ветки (3)
| Ветка | Куда | Как попадает код |
|---|---|---|
| `master` | никуда (разработка) | рабочие коммиты |
| `netlify` | **Netlify (Production branch)** | релиз: `git checkout netlify && git merge master && git push` |
| `plesk` | хостинг | релиз: то же самое, затем `node scripts/deploy.mjs` (кнопка «Развернуть» в Plesk) |

Почему так: пуш в `master` (ежедневная работа) **не палит лимиты Netlify** и ничего не деплоит;
пуш в `plesk` не триггерит Netlify; Netlify собирается только при релизе в ветку `netlify`.

Страховка в `netlify.toml`: `ignore = "test \"$BRANCH\" != \"netlify\""` — даже если в UI
production branch случайно станет `master`, сборка для других ветвей будет пропущена.

## Правки кода
1. `frontend/nuxt.config.ts`:
   `nitro.preset: process.env.NETLIFY ? "netlify" : "node-server"` — Netlify собирается своим
   пресетом (zero-config), Plesk продолжает получать node-server.
2. `frontend/netlify.toml` — переписать:
   ```toml
   [build]
     base = "frontend/"
     command = "npm run build"
     publish = "dist"
     ignore = "test \"$BRANCH\" != \"netlify\""

   [build.environment]
     NODE_VERSION = "22"
     NUXT_PUBLIC_STRAPI_URL = "https://api.vh324.by3020.ihb.by"
     NUXT_STRAPI_URL = "https://api.vh324.by3020.ihb.by"
     SITE_URL = "https://lustrous-medovik-a82e20.netlify.app"
   ```
   Удалить `[[redirects]] /* → /.netlify/functions/server` (путь старого layout Netlify Functions,
   у nitropack 2.13.5 выход — `.netlify/v1/functions`).
3. Удалить **все GitHub Actions workflow** — они шаблонные, ничего не деплоят и шлют письма о падении:
   - `.github/workflows/frontend-deploy.yml` (push в `frontend/**` → `npm ci` + `npm run build` на **Node 18**;
     Nuxt 4.6.3 требует `^22.22.3 || ^24.15.0 || >=26.0.0` → exit 1 → письма «All jobs have failed»;
     шаг «деплой» — просто `echo`);
   - `.github/workflows/backend-deploy.yml` (то же для `backend/**`, деплой — `echo`);
   - `.github/workflows/full-deploy.yml` (условие `contains(head_commit.modified, 'frontend')` всегда false);
   - `frontend/.github/workflows/nuxthub.yml` (неудачный деплой в NuxtHub на каждый push).
   Причина удаления: только тратят минуты Actions и шлют письма. Позже, отдельным шагом, можно добавить один
   осмысленный CI (Node 22: `npm ci` + `npm run test` + lint на pull request).
4. `NODE_VERSION` на Netlify — **22** (Netlify ставит последнюю 22.x, это ≥ минимальных 22.22.3 из engines Nuxt);
   Node 20 и ниже для этого проекта не годятся.
5. Домен пока технический: `https://lustrous-medovik-a82e20.netlify.app` (переезд домена — позже,
   отдельной задачей).

## Netlify: настройки (автоматизирую через CLI/API)
- Production branch = `netlify`; Branch deploys = **None**; Deploy Previews = **off**.
- Env vars (значения беру из локального `.env`, без вывода в чат):
  `NUXT_PUBLIC_STRAPI_URL`, `NUXT_STRAPI_URL`, `SITE_URL`, `NUXT_APP_SECRET`,
  `DEEPSEEK_API_KEY`, `SITEMAP_GENERATION_TOKEN`, `NUXT_STRAPI_TOKEN` (если используется сервером).
- Publish dir `dist`, build command `npm run build`, base `frontend/` (перекрывается `netlify.toml`).

## Порядок работ
1. Ветка `netlify` + правки 1–3 (коммит в `master`, затем релиз в `netlify`).
2. Локальная проверка: `NETLIFY=true npx nuxi build` → есть `dist/_redirects` и
   `.netlify/v1/functions/server`.
3. Авторизация Netlify (один раз, см. блокер) → привязка сайта, env, branch settings.
4. Первый деплой → проверка: `curl -s https://lustrous-medovik-a82e20.netlify.app/ru | grep -c 'product-card'`
   (ожидание: 12), `code=200`, в HTML названия товаров из Strapi.
5. `scripts/netlify-check.mjs` — повторяемая проверка прода (код, наличие данных, отсутствие 404).
6. Ветка `plesk` + `scripts/release.mjs netlify|plesk` — релизы одной командой.

## Критерии приёмки
- Пуш в `master` или `plesk` **не создаёт** сборок на Netlify.
- Пуш в `netlify` → сборка → сайт 200, SSR-HTML содержит товары Strapi, 404 нет.
- Plesk после правок собирается и работает как раньше (node-server, домен прежний).
- AI-чат и sitemap на Netlify рабочие (env заданы).

## Блокер
Нужна однократная авторизация в Netlify: `netlify login` (откроется браузер — подтвердить)
либо personal access token. Без этого нельзя менять branch settings и env, а также смотреть логи
сборки. После авторизации всё дальнейшее — скриптами без ручных шагов в UI.

## Риски
- CSS/шрифты/иконки на Netlify могут отличаться от Plesk (CDN, IPX) — проверить визуал после первого деплоя.
- Медленный прод-API (иногда ~8 с) → на Netlify возможны таймауты функций; при проблемах — кеш/ретраи.
- Лимиты Netlify (build minutes): релизы только через ветку `netlify`.
