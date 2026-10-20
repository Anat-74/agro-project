# DeepSeek Search & Fetch — интеграция в агента и проект

Статус: **РЕАЛИЗОВАНО (19.10)**: MCP-сервер создан, подключён, проверен. Осталось — использовать в работе.
Источник: https://api-docs.deepseek.com/guides/search/

## Что это

Два JSON-эндпоинта на `https://api.deepseek.com` с той же авторизацией, что и DeepSeek API
(`Authorization: Bearer <key>`, `Content-Type: application/json`):

| API | Endpoint | Назначение |
|---|---|---|
| Search | `POST /v1/tools/search` | Веб-поиск на своём движке DeepSeek |
| Fetch | `POST /v1/tools/fetch` | URL → `{ title, content }`, content в Markdown |

Search: `query` (1–128), `count` (1–50, деф. 10), `ori_question`, `localization` (IP), `need_content`.
Операторы: `site:`, `-site:`, `-`, `"фраза"`, `-"фраза"`, `lang:`, `after:`, `before:`.
Результат: `title`, `url`, `snippet` (100–200), `summary` (600–800, под модель), `content`, `date`,
`site_name/icon`, `rerank_score` 0–3 (≥1.5 — качественный), `authority` 0–4 (≥3 — авторитетный).

Fetch: `url` (≤8192, http/https, без креденшелов). Отдаёт Markdown; SPA/paywall/блокировки → 403/404.

Ограничения: read-only; QPS 100 (Search) / 25 (Fetch) на аккаунт + лимит на домен для Fetch.
Цена: **$0.75 за 1000 успешных запросов** (≈ $0.00075/запрос); ошибки/пусто/таймауты не тарифицируются.
Бесплатный период с 01.11.2026 — только для server-side тулов DeepSeek Harness / Claude Code / Codex;
Kilo Code в список не входит → платно с первого вызова.

## Зачем (для Kilo Code)

- Сейчас у агента нет **поиска**: `webfetch` требует известный URL, MCP есть только для Nuxt/Vue
  (Strapi MCP — это инстанс, не документация).
- Search закрывает discovery; `summary` экономит контекст (сначала сводки, `content`/Fetch — только для 1–2 источников).
- Полезно: свежие версии/changelog, конкретные ошибки и GitHub issues, статьи, новости, агро-контент.

## План внедрения

1. **MCP-обёртка** `deepseek-search` (Node, ~100 строк):
   - `search(query, count=5, need_content=false, site?, lang?, after?)`;
   - `fetch(url)`;
   - ключ из env `DEEPSEEK_API_KEY` (уже есть в `.env`), никогда не логировать;
   - кэш ответов 10–30 мин; обработка 402/429/5xx (retry с backoff для 408/429/5xx).
2. Прописать сервер в MCP-конфиге проекта; проверить на 3–5 запросах:
   доки Nuxt/Strapi, реальная ошибка из логов, агро-факт.
3. Оценить качество выдачи (rerank/authority) и стоимость; решить, оставлять ли.
4. **Опционально (продукт):** заземлить `/api/chat-assistant` на Search/Fetch (свежие источники + ссылки),
   с кэшем и лимитами; не отправлять во внешний поиск персональные данные.

## Правила использования

- Сначала специализированные MCP (Nuxt/Vue) → потом Search → потом Fetch.
- `count` 5–10, `need_content` только когда нужен полный текст.
- Предпочитать `rerank_score ≥1.5`, `authority ≥3`, свежие `date`; ссылки — в ответ.
- Не отправлять: внутренние адреса, заказы/клиентов, токены, приватный код.

## Риски

- Качество своего движка ≠ Google/Bing — нужна проверка на типовых запросах.
- Fetch не берёт JS-страницы и сайты с политикой блокировки.
- Лимит на домен: параллельный Fetch многих страниц одного сайта → 429.

## Реализация (19.10)

- **Код:** `mcp-servers/deepseek-search/server.mjs` (SDK `@modelcontextprotocol/sdk`, как у vue-docs).
- **Инструменты:** `search` (query, count, need_content, site, lang, after) и `fetch` (url).
- **Ключ:** `DEEPSEEK_API_KEY` из env, иначе из `frontend/.env` (без дублирования в конфиге).
- **Кэш:** 15 минут, до 100 записей. **Ретраи:** 408/429/5xx — 3 попытки с backoff; 4xx не повторяем.
- **Лимиты вывода:** `content` в search — 6 000 симв., `fetch` — 30 000 симв.
- **Регистрация:** `.kilo/kilo.json` → `mcp.deepseek-search` (local, `node .../server.mjs`, `enabled: true`).
- **Активация:** инструменты появятся в новой сессии Kilo (MCP читается при старте).

### Проверка (реальные запросы)

| Запрос | Результат |
|---|---|
| `Nuxt 4 app manifest` + `site:nuxt.com` | 3 результата, authority 3, rerank 2.2–2.3 (доки Nuxt) |
| `Strapi 5 documentId filters` + `site:docs.strapi.io` | 3 результата, authority 3 — закрывает пробел (MCP доков Strapi нет) |
| `хранение урожая картофеля` + `lang:ru` | authority 4 (Россельхознадзор), свежие даты — полезно для контента |
| `fetch` raw-дока Nuxt | Markdown получен (raw .md приходит с экранированием — для HTML-страниц чисто) |

Стоимость проверки: 4 успешных запроса ≈ $0.003.
