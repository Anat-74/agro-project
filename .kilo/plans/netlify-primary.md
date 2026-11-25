# Netlify как основной сервер (план)

Статус: согласовано 16.11.2026, к исполнению после авторизации в Netlify.

## Роли
- **Netlify** — основной сервер (витрина магазина, все функции: заказы, AI-чат, sitemap).
- **Plesk** (`https://vh324.by3020.ihb.by`) — резервный вариант на случай проблем с доступом к Netlify.
- **Strapi** один для обоих: `https://api.vh324.by3020.ihb.by` (проверено: 200, 33 товара, CORS `*`).

## Стратегия деплоя: A (сейчас) / B (позже)

| Критерий | **A. Деплой из CLI** | **B. Интеграция с GitHub** |
|---|---|---|
| Лимиты сборки Netlify | **не тратятся** (сборка локальная) | 3–5 мин за сборку (free = 300 мин/мес) |
| Что запускает деплой | только моя команда | пуш/merge в отслеживаемую ветку |
| Зависимость от GitHub OAuth | **нет** (только токен Netlify) | есть (сейчас сломан на телефоне) |
| Обратная связь | деплой ~30–60 с | 3–5 мин |
| Аудит «какой коммит в проде» | нет привязки (manual deploy) | каждый деплой = коммит |
| Откат | передеплой вручную | «Deploy previous» |
| Reproducibility | моя машина (Node 26) | чистый Linux + фиксированный Node |
| Секрет | токен Netlify локально | не нужен (доступ через GitHub App) |

**Решение:** начинаем с **A** — разблокирует сегодня, не тратит лимиты, не зависит от GitHub-OAuth.
**B добавляем позже**, когда вход GitHub заработает на ПК: включаем автосборку только для ветки `netlify`
(Production branch = `netlify`, Branch deploys = None, Deploy Previews = off). Варианты совместимы,
переключение без потерь; `ignore` в `netlify.toml` уже готов под B.

## Ветки (3)
| Ветка | Куда | Как попадает код |
|---|---|---|
| `master` | никуда (разработка) | рабочие коммиты |
| `netlify` | **Netlify** | релиз: `git checkout netlify && git merge master` → сборка/деплой из CLI (при B — пуш) |
| `plesk` | хостинг | релиз: то же самое, затем `node scripts/deploy.mjs` (кнопка «Развернуть» в Plesk) |

Почему так: пуш в `master` (ежедневная работа) **не палит лимиты Netlify** и ничего не деплоит;
пуш в `plesk` не триггерит Netlify; Netlify обновляется только при релизе ветки `netlify`.

Страховка в `netlify.toml`: `ignore = "test \"$BRANCH\" != \"netlify\""` — нужна при включении B,
чтобы случайная настройка production branch не запускала сборки с других ветвей.
При варианте A репозиторий к Netlify не привязан — автосборок нет в принципе.

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
- **Вариант A (сейчас):** репозиторий к сайту **не привязываем**, branch settings не нужны —
  деплой `netlify deploy --prod --dir=dist` из локальной сборки.
- **Вариант B (позже):** Production branch = `netlify`; Branch deploys = **None**; Deploy Previews = **off**.
- Env vars (значения беру из локального `.env`, без вывода в чат):
  `NUXT_PUBLIC_STRAPI_URL`, `NUXT_STRAPI_URL`, `SITE_URL`, `NUXT_APP_SECRET`,
  `DEEPSEEK_API_KEY`, `SITEMAP_GENERATION_TOKEN`, `NUXT_STRAPI_TOKEN` (если используется сервером).
- Publish dir `dist`, build command `npm run build`, base `frontend/` (перекрывается `netlify.toml`).

## Порядок работ
1. Ветка `netlify` + правки 1–3 (коммит в `master`, затем релиз в `netlify`).
2. Локальная проверка: `NETLIFY=true npx nuxi build` → есть `dist/_redirects` и
   `.netlify/v1/functions/server`.
3. Токен Netlify в файле `C:\kilo-bridje\netlify.token` (см. блокер) → `npx netlify sites:list`,
   привязка к сайту `lustrous-medovik-a82e20`, env через `netlify env:set`.
4. Первый деплой из CLI (`netlify deploy --prod --dir=frontend/dist`) → проверка:
   `curl -s https://lustrous-medovik-a82e20.netlify.app/ru | grep -c 'product-card'`
   (ожидание: 12), `code=200`, в HTML названия товаров из Strapi.
5. `scripts/netlify-check.mjs` — повторяемая проверка прода (код, наличие данных, отсутствие 404).
6. Ветка `plesk` + `scripts/release.mjs netlify|plesk` — релизы одной командой
   (для `netlify`: merge → сборка → CLI-деплой; для `plesk`: merge → `deploy.mjs`).

## Критерии приёмки
- Пуш в `master` или `plesk` **не создаёт** сборок на Netlify (при A — автосборки отсутствуют).
- Деплой на Netlify → сайт 200, SSR-HTML содержит товары Strapi, 404 нет.
- Plesk после правок собирается и работает как раньше (node-server, домен прежний).
- AI-чат и sitemap на Netlify рабочие (env заданы).
- Минуты сборки Netlify не расходуются (сборка локальная).

## Блокер
Нужен **personal access token** Netlify: вход в Netlify на ПК (Google/email, без GitHub-OAuth) →
`User settings → Applications → New access token`. Сохранить в файл `C:\kilo-bridje\netlify.token`
(не в чат; файл добавить в `.gitignore`). GitHub-OAuth (device verification) на телефоне падает
с «What?!» — для варианта A он не нужен. После получения токена всё дальнейшее — скриптами.
Для варианта B позже: подключить GitHub из Netlify на ПК, в одной вкладке, без переключения в почту
(или включить 2FA с приложением).

## Plesk (резерв): ограничения и способ деплоя

Ответ поддержки 17.11.2026:
- зависших процессов сборки/npm нет (чисто);
- **максимальное время выполнения скрипта для сайта увеличено** — вероятная причина прошлого
  падения (`.output/server/index.mjs` не создавался) устранена;
- **SSH не предоставляется** на виртуальном хостинге;
- **Plesk REST API — только с постоянного IP**; при динамическом IP недоступен.

Следствия:
- Автоматизация через Plesk API невозможна → единственный путь — UI-автоматизация Playwright
  (`scripts/deploy.mjs`: git pull → «Развернуть» → проверка). От IP не зависит.
- Серверные логи смотреть нечем (нет SSH) → диагностика через UI-лог сборки и результат на сайте.
- Резервный способ, если сборка на сервере снова не уложится в лимит: собрать локально
  (`NETLIFY` не задан → node-server), загрузить `.output` + `package.json` по FTP и перезапустить
  приложение через UI. Для этого нужно починить локальную прод-сборку (IPX/пререндер + локальный Strapi).

## Кэширование Nuxt на Netlify (анализ 24.11.2026)

В проекте уже есть два уровня кэша:
1. **`useCachedAsyncData`** — модульный `Map` с TTL (по умолчанию 5 мин), лимит 200 записей, вытеснение,
   подстановка SSR-payload в `getCachedData` (защита от hydration mismatch).
2. **`routeRules`** — prerender для about/contacts/services, `swr: 300` для blog/news, CSR для корзины/кабинета,
   **каталог намеренно без SWR** («данные кэширует композабл 1 мин, SSR дешёвый»).

| Окружение | `useCachedAsyncData` | `routeRules` |
|---|---|---|
| Один Node-сервер (ISPmanager/Plesk) | ✅ Map общий между запросами процесса — работает | ✅ работает |
| **Netlify (serverless)** | ⚠️ ненадёжно: модуль живёт только в «тёплом» контейнере, контейнеры не делят память | ✅ **CDN** кэширует по `swr`/`cache` — главный слой |

**Вывод:** на постоянном сервере схемы достаточно. На Netlify кэш приложения нестабилен → работает CDN,
а каталог сейчас **без SWR** → каждая страница товара/категории рендерится и на холодном запросе идёт в Strapi.

**Что сделать при переключении фронта на Netlify (без Redis):**
1. Добавить **короткий SWR каталогу**: `/ru/products`, `/be/products`, `/**/products/**`, категории → `swr: 30–60`
   (цены/остатки устаревают ≤1 мин — приемлемо для магазина, нагрузка на Strapi падает в разы).
2. Не кэшировать пользовательское — корзина/кабинет уже `ssr: false`.
3. Опционально: Strapi-вебхук `entry.publish/unpublish` → Netlify Build Hook / purge CDN (инвалидация без TTL).
4. Клиентский кэш (`Map` в SPA-сессии) оставить — он не зависит от сервера.
5. `/_ipx/...` кэшируется CDN по неизменяемому URL — специально ничего не нужно.

**Redis не требуется** ни на сервере (хватает `Map`), ни на Netlify (хватает CDN). Нужен только при появлении
нескольких инстансов Nuxt/Strapi с общим кэшем или сессиями.

## Риски
- CSS/шрифты/иконки на Netlify могут отличаться от Plesk (CDN, IPX) — проверить визуал после первого деплоя.
- Медленный прод-API (иногда ~8 с) → на Netlify возможны таймауты функций; при проблемах — кеш/ретраи.
- Вариант A: деплой не привязан к коммиту — деплоить только из чистой ветки `netlify` (merge `master` → сборка → деплой),
  иначе в проде может оказаться локальное состояние, которого нет в git.
- Лимиты Netlify (build minutes): при B — релизы только через ветку `netlify`; при A не расходуются.

## Индексация превью (25.11.2026)

Добавлен `frontend/server/middleware/noindex.ts`: если Host заканчивается на `.ihb.by`, `.netlify.app`,
`.netlify.com` или это localhost — ставится `X-Robots-Tag: noindex, nofollow`. На реальном домене заголовок
не добавляется (индексация обычная). Проверено: `localhost` → `noindex, nofollow`, `Host: example.com` → заголовка нет.

## Состояние на 25.11.2026 (что готово к Netlify)

**Сделано и проверено:**
- Фронт переключён на новый API: `env/prod-api.env`, `image.domains`, `netlify.toml` → `https://u34165-8120.by5010.ihb.by`.
  Проверка страницы товаров: **378** ссылок на новый хост, **0** на старый; 12 карточек, 0 битых картинок.
- API работает по HTTPS: `https://u34165-8120.by5010.ihb.by/api/products` → 200 (`total: 33`), `/admin` → 200, `/_health` → 204.
- `.github/workflows/ci.yml` — единый CI (Node 22 + pnpm, lint/test/build) вместо четырёх мёртвых workflow.
- `server/middleware/noindex.ts` — превью на `*.ihb.by` / `*.netlify.app` / localhost не индексируются.
- Локальные dev-серверы: `pnpm dev:prod` (боевой API) / `dev:local` (локальный Strapi).

**Осталось до первого деплоя (код):**
- `frontend/netlify.toml`: убрать легаси-редирект `/* → /.netlify/functions/server`, `publish = "dist"`,
  `NODE_VERSION = "22"`, guard `ignore` по ветке; проверить `PNPM_FLAGS` (devDependencies на Netlify).
- Добавить `swr` каталогу в `routeRules` (раздел «Кэширование» выше).

**Блокер:** нет доступа к аккаунту Netlify (personal access token). Без него нельзя `netlify sites:list`,
привязать сайт, задать env и деплоить.

**Как получить токен:** app.netlify.com → вход по **email/Google** (не GitHub — OAuth с телефона падает) →
аватар → **User settings** → **Applications** → **Personal access tokens** → **New access token** →
имя (например `kilo-agent`), срок действия → **Generate token** → скопировать (показывается один раз).
Токен положить в файл `C:\kilo-bridje\secrets\netlify.token` или прислать файлом `.txt` (не в чат;
если прислан в чат — после настройки отозвать и создать новый).

**После токена:** `netlify sites:list` → привязать/создать сайт → `netlify env:set` (API-URL, SITE_URL,
NUXT_APP_SECRET, DEEPSEEK_API_KEY, SITEMAP_GENERATION_TOKEN) → `netlify deploy --prod --dir=frontend/dist`
(вариант A из плана) → проверка: 200 + товары + 0 битых картинок.

## Токен Netlify: срок действия (важно)

- **Создан:** 25.11.2026, срок — **90 дней** → **истекает ~23.02.2027**.
- Хранится: `C:\kilo-bridje\secrets\netlify.token` (вне репозитория).
- Если `api.netlify.com` начнёт отвечать **401** — первым делом проверить срок токена; новый выпускается в
  app.netlify.com → User settings → Applications → Personal access tokens.
- Данные аккаунта: `web7anat@gmail.com`, айди аккаунта `6afbf1ed3764c339b7bf5664`,
  сайт **`agro-proj`** (`https://agro-proj.netlify.app`, site_id `c48250af-d820-4f31-ba63-7d9e1b1d97eb`),
  репозиторий не привязан → деплой через CLI/API.

## noindex для стенда: вариант 3 (25.11.2026)

Реализовано через переменную сборки `NUXT_PUBLIC_NOINDEX=1` (в `netlify.toml` → `[build.environment]`):
- `nuxt.config.ts`: `app.head.meta` добавляет `<meta name="robots" content="noindex, nofollow">`;
- `routeRules` для `/ru`, `/ru/**`, `/be`, `/be/**` ставят `X-Robots-Tag` в SSR-ответах;
- `@nuxtjs/robots` переведён на `header: false` (он перебивал `X-Robots-Tag` своим `index, follow`);
- на боевом домене переменная не выставляется — индексация обычная, код не меняется.

Почему не `[[headers]]` в netlify.toml: они применяются к статике, а SSR-ответы формирует функция —
заголовок до страницы не доходил.
