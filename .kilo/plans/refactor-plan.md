# План рефакторинга — Agro Market (вёрстка + стилизация)

> **Режим:** удалённая работа (без npm install / nuxi module add)
> **Правило:** ни шага без одобрения, после каждого шага — отчёт



## [НИЗКИЙ ПРИОРИТЕТ] Шаг 5. useBrowser + @container style(--browser-*)

### 5.1 Создать useBrowser.ts

**Файл:** composables/useBrowser.ts

- Определение Chrome/Firefox/Safari/Edge по User-Agent
- SSR-safe (useRequestHeaders + navigator.userAgent)

### 5.2 CSS-переменные --browser-safari и др.

**Файл:** app.vue

- Добавить в containerVars

### 5.3 Браузерные фиксы через @container style()

По компонентам — если в тестировании проявятся проблемы:
- Safari font rendering
- Firefox scrollbar
- Chrome autofill
- и т.д.

---

## [TODO] Шаг 6. Fix hydration mismatch в ChatAssistantButton

**Симптом (консоль браузера, любая страница при SSR):**

```
[Vue warn]: Hydration children mismatch on JSHandle@node
Server rendered element contains fewer child nodes than client vdom.
  at <ChatAssistantButton variant="close" ...>
  at <ChatAssistantButton type="submit" variant="send" is-disabled=true ...>
  at <ChatAssistant> at <AppHeader> ...
[ERROR] Hydration completed but contains mismatches.
```

**Гипотеза:** SSR отдаёт кнопку `chat-btn` с меньшим числом дочерних узлов, чем клиент. Дочерние узлы кнопок — `<Icon>` (nuxt-icon): сервер рендерит svg не так, как клиент (гидратация иконок), либо контент чата зависит от клиентского состояния (история из localStorage) и SSR-разметка расходится.

**Кандидаты:**
- `components/chat-assistant/ChatAssistantButton.vue` — блок `<Icon v-if="variant === 'send'" ... /> ... <slot v-else />`
- `components/chat-assistant/ChatAssistant.vue` — использование кнопок (строки ~275, 306–320)

**Решение (по убыванию предпочтительности):**
1. Обернуть `<ChatAssistant>` (или его шапку с кнопками) в `<ClientOnly>` — чат чисто клиентская фича, SSR-контент не критичен.
2. Либо зафиксировать SSR-рендер иконок (проверить server-bundle Nuxt Icon), чтобы сервер и клиент рендерили одинаково.
3. Диагностика: открыть /ru, в консоли увидеть предупреждение, сравнить серверный/клиентский vdom узла.

**Критерий готовности:** 0 hydration-ошибок/предупреждений в консоли браузера на /ru (вьюпорты desktop и tablet/mobile).

**Приоритет:** низкий (не ломает функциональность, только ошибка в консоли).
