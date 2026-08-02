# Handoff: модалка товара в корзине (ShowModalProduct)

> Файл для новой сессии. Дата: 2026-08-02. Текущий коммит: `bde1e9d`.

## Задача

В **пустой корзине** (slide-out диалог) при клике на акционную карточку должно открываться **превью товара** — модалка `ShowModalProduct` (как в личном кабинете в истории заказов).

**Сейчас НЕ работает:** клик по акционной карточке в корзине ничего не открывает.

---

## Архитектура (как переиспользуется модалка)

`ShowModalProduct` — универсальная модалка предпросмотра товара. Используется в 3 местах:

| Место | Файл | Способ | Статус |
|---|---|---|---|
| Главная (карточки «Горячего предложения») | `components/DiscountProduct.vue` | Встроенный триггер (кнопка-глаз), свой инстанс на карточку | ✅ работает |
| Личный кабинет (история заказов) | `components/auth/OrderHistory.vue` | `ref.openModal()` по клику на миниатюру заказа | ✅ работает |
| Корзина (пустое состояние) | `Header.vue` ← `ShowModalCartDialog` | `@preview` → `openPreview()` → `ref.openModal()` | ❌ НЕ работает |

### Ключевые файлы

- **`components/show-modal/ShowModalProduct.vue`** — сама модалка
  - Пропсы: `product: Product | null`, `hideTrigger?: boolean`
  - `defineExpose({ openModal })` — открытие извне
  - `useDialog("product-" + documentId, dialogElement, { useShowMethod: false })` → `showModal()`
  - `useAsyncData(detailsKey /* computed по documentId */, ...)` — загрузка деталей
  - `openModal()`: guard `if (!props.product) return`; затем `open?.()` + `execute()`
- **`components/Header.vue`** — владеет модалкой для корзины
  ```html
  <ShowModalCartDialog ref="cart-dialog" @preview="openPreview" />
  <ShowModalProduct ref="preview-modal" :product="previewProduct" hide-trigger />
  ```
  ```ts
  const previewProduct = ref<Product | null>(null)
  const previewModalRef = useTemplateRef<...>('preview-modal')
  function openPreview(product) {
    previewProduct.value = product
    nextTick(() => previewModalRef.value?.openModal?.())
  }
  ```
- **`components/show-modal/ShowModalCartDialog.vue`** — корзина (сама `<dialog>` showModal)
  - Карточка акции: `<button @click="emit('preview', prod)">`
  - `defineEmits<{ preview: [product: Product] }>`
  - НЕ содержит ShowModalProduct (поднят в Header)
- **`components/auth/OrderHistory.vue`** — эталонный рабочий паттерн (тот же ref.openModal)

---

## Что уже сделано (фиксы)

Коммит **`bf38b09`** (в составе `bde1e9d`):
1. Header: убран `v-if="previewProduct"` с ShowModalProduct → инстанс **всегда смонтирован**, ref всегда доступен (устранение гонки `v-if`+`nextTick`+ref)
2. `product: Product | null` + guard в `openModal`
3. Реактивный ключ `detailsKey` (computed) — при смене товара детали перезапрашиваются
4. Optional chaining в шаблоне (`product?.name` и т.д.)

---

## Диагностика (актуальное состояние)

### Подтверждено
- Локальный build компилируется: `cd frontend && nuxi build` → `✨ Build complete!`
- **Сборка/деплой на Plesk РАБОТАЕТ** — пользователь изменил фон primary-кнопки (`var(--color)` → `var(--primary-color)`), задеплоили, изменение **применилось** на живом сайте (тест commit `bde1e9d`)
- Исходник на сервере = `bf38b09` (Plesk Git: ветка master → /httpdocs, «12:41 always-mount ShowModalProduct»)

### Загадка (главная)
Проверка живого DOM (mobile 390px, через браузер):
```js
headerChildren: [HEADER, cart-dialog, checkout-dialog, MAIN, FOOTER]  // нет product-modal!
productModalTotal: 9
headerHasProductModal: false
```
- В DOM **9** `dialog.product-modal` — ВСЕ с триггером (карточки «Горячего предложения» на главной)
- **Header'ского** `dialog.product-modal` (без триггера, `hide-trigger`) **НЕТ в DOM**
- SSR тоже отдаёт 9 (не 10)

Это противоречит тому, что `bf38b09` жив (убран `v-if` → Header'ская модалка должна рендериться всегда). **Нужно выяснить, почему Header'ский ShowModalProduct не рендерит свой `<dialog>` в DOM, несмотря на код без v-if.**

### Вероятные причины (для проверки новой сессией)
1. **Runtime-ошибка в ShowModalProduct при `product: null`** — рендер именно Header'ского инстанса падает (при product set всё ок — главная работает). Проверить консоль браузера при загрузке страницы.
2. **Деплой/сборка доставляет старый Header** — перепроверить: сейчас (после теста кнопки) билд точно живой, значит переснять DOM и убедиться, появился ли Header'ский product-modal.
3. **Конфликт `useDialog`** — `dialogId = "product-" + (props.product?.documentId ?? "preview")`. У Header'ского инстанса id = `"product-preview"`. В `useDialog` глобальный `dialogElementMap` по id. Проверить, что `open()` находит свой элемент (`showModal()` молча пропускается, если `storedElement` null — см. useDialogState.ts:47-59).
4. **`useTemplateRef` + всегда-смонтированный компонент** — возможно ref не привязывается, `openPreview` вызывается, но `previewModalRef.value` null.

---

## Команды для работы

```bash
# локальный build (проверка компиляции)
cd frontend && nuxi build

# деплой (запускает build на Plesk)
node scripts/deploy.mjs

# перезапуск приложения (после завершения build)
node scripts/restart.mjs
```

## Plesk (инфраструктура)
- App root: `/httpdocs/frontend`
- Start: `.output/server/index.mjs`
- Build: `npm run build` (через «Выполнить команды Node.js»)
- Git: репозиторий `agro-project`, ветка `master`, авто-деплой в `/httpdocs`

---

## Важно
- Коммит `bde1e9d` содержит **тестовое** изменение кнопки primary (`var(--color)` → `var(--primary-color)`) — это диагностика деплоя. Решить: оставить или откатить.
- Правила проекта: не пушить/деплоить без явной команды; при удалённой работе отвечать в .md.
- Связанные планы: `.kilo/plans/1778783966963-style-guide.md` (раздел `<dialog>`), `header-refactor.md`.
