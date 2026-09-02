# План отложенных работ

## 1. Шапка пропадает при первой загрузке главной (SSR-утечка useDialog)

**Статус:** реализовано (коммит `794ac77`, 31.08.2026).

**Симптом:** при первой загрузке сайта на главной странице шапки нет; при возврате на главную через SPA-навигацию шапка появляется.

**Причина (подтверждена):**
- `app/composables/useDialogState.ts` хранил `isOpen` всех диалогов в module-синглтоне `isOpenMap = new Map<string, Ref<boolean>>()`.
- `ShowShopFilter` (страница товаров) в setup безусловно делал `isOpen.value = true` (фильтр открыт по умолчанию).
- На SSR module-Map живёт между запросами в одном Node-процессе: после SSR `/ru/products` состояние `shopFilterDialog.isOpen` оставалось `true`, и следующий SSR главной рендерил `<header class="header header_filter-open">` → на мобильном шапка скрыта.
- SPA-переход работал, т.к. `onBeforeRouteLeave` закрывал диалог перед уходом со страницы товаров.

**Фикс (проверен, работает):**
```ts
// Вместо module-Map:
//   const isOpenMap = new Map<string, Ref<boolean>>();
// использовать SSR-safe useState (per-request на сервере, единое на клиенте):
const isOpen = useState<boolean>(`dialog-${id}`, () => Boolean(initialOpen));
```
- Сервер: состояние per-request — утечка между запросами исчезает.
- Клиент: состояние единое, согласовано с SSR через payload.
- SPA-навигация не ломается (`onBeforeRouteLeave` продолжает закрывать диалог).

**Проверка фикса:** после загрузки `/ru/products` свежая загрузка `/ru` — класс `header_filter-open` отсутствует, шапка видима; на `/ru/products` диалог открыт.

---

## 2. Плавность появления контента после закрытия фильтра (mobile)

**Статус:** открытый вопрос, требует тестирования за ПК.

**Симптом:** после закрытия диалога фильтра контент страницы появляется не плавно («ничего не изменилось» после серии фиксов дёрганья).

**Контекст:** фиксы дёрганья открытия/закрытия (устранение overshoot, отказ от `display: none`, единый фейд) проверены по кадровым замерам — движение монотонно. Ощущение «рывка» контента после закрытия, вероятно, связано с мгновенным снятием клампа высоты страницы (`100dvh → auto`) — анимация высоты была убрана ради устранения overshoot при открытии. Две цели частично конфликтуют; нужна точная картина поведения на реальном устройстве.

---

## 3. Страница продуктов: анимация открытия/закрытия фильтра через `transform` (JS-вариант) + aria-label header

**Статус:** спланировано 02.09.2026, **не реализовано**. Реализация — только в не пиковые часы, после одобрения.

### 3.1. Проблема

Анимация `height` шапки (AppHeader `166 → 0` через `interpolate-size`) — **layout-свойство**: каждый кадр браузер пересчитывает layout шапки И всей страницы ниже (12 карточек + грид + CQ) → просадки кадров на телефоне → «дёрганье». Плюс хрупкость: `interpolate-size` работает только в Chromium 129+.

### 3.2. Решение — движение только `transform` (GPU), высоту шапки мерит JS

**CSS — шапка (AppHeader.vue), mobile:**
```scss
@media (max-width: $mobile) {
  transition: transform var(--transition-duration-fast);
  &_filter-open {
    transform: translateY(-100%);   // уезжает на 100% СВОЕЙ высоты (transform % = от себя)
  }
}
```
Высоту шапки НЕ трогаем (нет `height: 0`) → контент ниже не рефлоутится.

**CSS — страница (products/index.vue), mobile:**
```scss
&_filter-open {
  transform: translateY(calc(-1 * var(--header-h, 0px)));  // подъём на высоту шапки (GPU)
  transition: transform var(--transition-duration-fast);
}
```

**JS — products/index.vue (watcher на уже существующий `filterDialogOpen`):**
```ts
watch(filterDialogOpen, (open) => {
  if (!open) return
  const header = document.querySelector<HTMLElement>(".header")
  if (!header) return
  document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`)
})
```

Кламп `height: 100dvh` + `overflow: hidden` остаётся (1 reflow в момент открытия — не по кадрам). Итог: только `transform` + `opacity` = плавно на любом устройстве.

### 3.3. `offsetHeight` — суть

- Read-only свойство любого HTML-элемента: **фактическая отрисованная высота** (контент + padding + border, БЕЗ margin), целое число в px.
- Значение берётся из layout: чтение при «грязном» layout вызывает синхронный пересчёт — здесь чтение одноразовое (на открытие), накладные расходы ничтожны.
- Не учитывает `transform` (в отличие от `getBoundingClientRect().height` — а шапка уже уезжает при slide) → корректно для расчёта подъёма страницы.
- Без JS нельзя: высота шапки `auto` (адаптивные дети), чистым CSS её в переменную не вытащить.

**Нюанс тайминга:** `--header-h` должна быть установлена ДО старта transform-перехода (иначе старт с фоллбэка). Решение: `flush: 'sync'` в watcher ИЛИ держать переменную актуальной заранее (onMounted + слушатель resize).

### 3.4. aria-label для `<header class="products-page__header">`

При реструктуризации (header страницы продуктов, уже в разметке) header остался **без aria-label** — добавить, **с локализацией** (правило: aria-атрибуты локализуются):

- Новый ключ в `frontend/app/locales/visuallyHidden.ts` (или подходящий файл) — напр. `productsPageHeader`. ВНИМАНИЕ: уже есть `productPageHeader` («Шапка страницы товара» — страница ОДНОГО товара), нужен ОТДЕЛЬНЫЙ ключ для страницы «Все товары».
- ru: «Шапка страницы продуктов»
- be: «Шапка старонкі прадуктаў»
- В шаблоне: `:aria-label="vh.productsPageHeader"` (или в `Locales`-переменную страницы `t.*`, по конвенции используемой на странице).
