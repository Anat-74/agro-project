# Chat Assistant Fixes — 2026-07-17

## Баги

### Bug 1: `callStrapiTool` gate `&& query` блокирует isDiscount/maxPrice/minPrice/inStock
**Файл:** `frontend/server/api/chat-assistant.post.ts:66`
**Проблема:** `if (operation === "search" && query)` — при запросах "со скидкой" AI не передаёт `query`, только `isDiscount: true`. Условие ложно → функция возвращает заглушку с пустым массивом товаров.
**Фикс:** Убрать `&& query`.

### Bug 2: `$startsWith` не находит товары, чьи названия не начинаются с запроса
**Файл:** `frontend/server/utils/product-search.ts:62`
**Проблема:** Запрос "орехи" → `$startsWith=Орехи`. Товар "Грецкий Орех" не начинается на "Орехи" → 0 результатов.
**Фикс:** Заменить `$startsWith` на `$containsi` (case-insensitive contains).

### Bug 3: Нет `locale` в параметрах поиска Strapi
**Файл:** `frontend/server/utils/product-search.ts:83`
**Проблема:** Запросы к Strapi не содержат `locale`. При i18n это может привести к поиску в неверной локали.
**Фикс:** Добавить `"locale": locale` в params, принимать `locale` как параметр функции.
