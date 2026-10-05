# refactor-plan — общие компоненты / рефакторинг

> Статус (05.10.2026): шаги 6 и 7 закрыты. Оставлен только отложенный шаг 5.

## ✅ Закрыто

- **Шаг 6 — hydration mismatch в `ChatAssistantButton`.** Решено: `ClientOnly` вокруг `ChatAssistant`
  в `AppHeader` (см. `agro-calculator.md`, п.10). Проверено: mismatches = 0.
- **Шаг 7 — унифицированная таблица значений `UValueTable`.** Реализовано:
  `app/components/UValueTable.vue` (`rows`, `caption`, `labelWidth`, `variant` `muted | plain`;
  значения по левому краю). Применён в `CalcSection` (`plain`) и `ProductCharacteristics` (`muted`);
  подписи — `<th scope="row">`, скрытый `<caption>`. Текущий вид утверждён (01.10).

## ⏸ Отложено (по необходимости)

- **Шаг 5 — `useBrowser` + `@container style(--browser-*)`.** Низкий приоритет. Делать только если
  проявятся браузерные баги (Safari font rendering, Firefox scrollbar, Chrome autofill).
  Внятной спецификации пока нет — не начинать без конкретного симптома.
