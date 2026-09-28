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

---

## [TODO] Шаг 7. Унифицированная таблица «подпись → значение» (`UValueTable`) — 28.09.2026

**Идея (согласовано 28.09):** вынести пары «подпись → значение» в один компонент — все стили таблицы
в одном месте. Под каждую конкретную таблицу — свой набор пропсов (как в остальных `U`-компонентах).
Где caption не нужен визуально — скрывать утилитарным классом `.visually-hidden`
(`app/assets/scss/base/_utils.scss`).

### Эталон внешнего вида — таблица характеристик товара (`ProductCharacteristics.vue`)

Утверждено 28.09: вид берём с таблицы характеристик товара (скриншот страницы товара), она
устраивает. Значения — **по левому краю** (как там). Текущий вариант в «Посадке» (значения справа,
отдельная вертикальная линия по колонке) — **отменяется**.

Что копируем из эталона (текущие стили `ProductCharacteristics.vue`):

```scss
&__table { width: 100%; }
&__row {
  border-bottom: 1px solid var(--light-color);
  background-color: var(--whitesmoke-color);
  &:last-child { border-bottom: none; }
}
&__param { width: 60%; padding-inline: toEm(8); padding-block: toEm(8); font-weight: 600; }
&__value { padding-inline: toEm(8); }
```

- реальная `<table>` + `<tbody>` + `<tr>` + `<td>`, `width: 100%`;
- фон строки — `--whitesmoke-color`, разделитель строк — `1px solid var(--light-color)`,
  последняя строка без бордера;
- колонка подписи ~60%, паддинги 8px (block/inline), подпись — `font-weight: 600`;
- значения выровнены по левому краю (по умолчанию, без `text-align: right`).

### Бордеры и линии — без псевдоэлементов (уточнено 28.09)

`<table>` сам бордеры не рисует — их задаёт CSS. В эталоне вид дают:
- **горизонтальные линии** — `border-bottom: 1px solid var(--light-color)` у `tr` (у последней строки снят);
- **фон строки** — `--whitesmoke-color`;
- **тонкие вертикальные просветы между колонками** — `border-collapse: separate` + дефолтный
  `border-spacing: 2px` (в эталоне `border-collapse: collapse` закомментирован, поэтому зазоры между
  ячейками сохранены).

→ **Псевдоэлементы (`::before`) и box-shadow-«канавки» не нужны.** Текущая реализация в
`HamburgerGarden` (grid + `display: contents`-строки + `border-inline-start` + тени) при переводе
удаляется целиком — остаётся обычная таблица со стилями эталона.

### Размеры и отступы блока «Посадка» — не меняем (уточнено 28.09)

В разделе «Посадка» все размеры/отступы блока расчёта остаются как есть; к виду эталона приводится
только сама таблица (фон/бордеры/выравнивание/паддинги ячеек).

### Компонент

- **Пропсы (черновик):** `rows: { label; value }[]`, `caption?`, `captionHidden?` (скрытый caption),
  `labelWidth?` (по умолчанию 60%), `dense?`, при необходимости — слот для сложного значения.
- **Семантика:** `table` + скрытый `<caption>` и подписи в `<th scope="row">` (значения — `<td>`);
  это одновременно закрывает тех.долг таблицы характеристик (см. ниже).
- **Визуальные варианты — не плодить:** базовый вид = эталон выше; отличия (если понадобятся)
  задавать пропсом, а не копией стилей.

### Применение (в двух местах) и порядок

- **Кандидаты:** расчёт в `show-modal/HamburgerGarden.vue` (`&__result`) и характеристики товара
  (`ProductCharacteristics.vue`).
- **Порядок:** делать **в непиковые часы**; после перевода обоих мест старую разметку/стили в них
  удалить (в `HamburgerGarden` — `display: contents`-строки, `border-inline-start`-«канавки» и т.п.).
- Перед реализацией — сверить мелкие детали вида (щели/границы колонок, поведение на узких экранах)
  по факту рендера.

**Попутный тех.долг (`ProductCharacteristics.vue`):** сейчас подписи лежат в `<td>`, `th`/`caption`
нет. При переводе на `UValueTable` — подписи в `<th scope="row">` + скрытый `<caption>`
(локализация ru/be).
