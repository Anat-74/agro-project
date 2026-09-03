# Nuxt 4: правила работы с `useAsyncData` / `useFetch` (data-fetching)

> Зафиксировано 03.09.2026. Источник: [Nuxt 4 docs — useAsyncData](https://nuxt.com/docs/4.x/api/composables/use-async-data).

## 1. Статусы запроса — вместо `pending` используем `status`

`useAsyncData` возвращает `status: Ref<'idle' | 'pending' | 'success' | 'error'>`:

| Статус | Когда |
|---|---|
| `idle` | функция ещё не вызывалась (`immediate: false` или `server: false` на SSR) |
| `pending` | запрос в полёте |
| `success` | функция вернула значение |
| `error` | функция бросила ошибку |

`pending` (boolean) остаётся для совместимости, но **не различает `idle`**. Используем `status` — он позволяет ловить состояния, которые нужно сглаживать/корректировать:

```vue
<ul v-if="status === 'success' && products.length">…</ul>
<span v-else-if="status === 'success'">Пусто</span>
<ULoader v-show="status === 'idle' || status === 'pending'" />
<!-- + при необходимости ветка status === 'error' -->
```

**Паттерн:** контент рендерим только на `success`, лоадер — на `idle`/`pending`, ошибку — отдельно. Это исключает «мигание» недозагруженных состояний.

## 2. Реактивный ключ (`key` = computed / ref / getter-функция)

`key: MaybeRefOrGetter<string>` — ключ может быть строкой, ref'ом, `computed` или getter-функцией.
**При изменении ключа запрос перезапускается АВТОМАТИЧЕСКИ** (встроенный watch ключа).

→ Если в ключ включить ВСЕ зависимости запроса, отдельные `watch + refresh()` не нужны:

```ts
const productsKey = () =>
  `shop-products-${locale}-${category}-${sort}-${priceMin}-${priceMax}-${tags}-${page}`

const { data, status } = useAsyncData(productsKey, handler)
// изменился category / page / … → ключ другой → авто-запрос
```

## 3. Встроенный `watch`

`options.watch: MultiWatchSources` — массив реактивных источников для авто-обновления (когда ключ хранит не всё или нужны «побочные» источники).

## 4. Abort-сигнал в `handler`

Handler получает `(nuxtApp, { signal })`. Передаём `signal` в `$fetch`, чтобы устаревшие запросы отменялись (`dedupe: 'cancel'` по умолчанию, `clear()` тоже отменяет). Это решает гонки (дёрганье от ответов «позднего» запроса).

## 5. Полезные опции

`server`, `lazy`, `immediate`, `default`, `transform`, `pick`, `watch`, `getCachedData`, `timeout` (v4.2), `dedupe: 'cancel' | 'defer'`, `enabled` (v4.5), `serialize` (v4.6), `deep`. Все опции могут быть ref/computed — обновляются автоматически.

## 6. Единообразие опций при одном ключе

Если несколько вызовов используют один ключ — **должны совпадать**: `handler`, `deep`, `transform`, `pick`, `getCachedData`, `default`. **Могут отличаться**: `server`, `lazy`, `immediate`, `dedupe`, `watch`, `enabled`, `serialize`.

## 7. `clear()` и `useNuxtData`

`clear()` → data=undefined, error=undefined, status=idle, отменяет запрос. Состояние по ключу доступно приложению через `useNuxtData(key)`.

---

## Проект: `useCachedAsyncData`

- Файл: `frontend/app/composables/useCachedAsyncData.ts` — TTL-обёртка над `useAsyncData` (модульный кэш Map, лимит 200, sweep 60s; на клиенте отдаёт SSR-payload при первом рендере).
- Прокидывает: `server`, `immediate`, `lazy`, `watch` + свой `getCachedData` (кэш/TTL). Опции расширяемы при необходимости (`transform`, `enabled`, `timeout`…).

## Применение (эталон): страница продуктов `pages/[lang]/products/index.vue`

```ts
const productsKey = () => `shop-products-${currentLocale.value}-${category.value}-${sort.value}-${priceMin.value}-${priceMax.value}-${tags.value.join(",")}-${page.value}`

const { data: productsData, status } = useCachedAsyncData(productsKey, async () => { … }, { ttl: 600_000 })

// Сброс страницы при смене фильтров (сам запрос перезапускает реактивный ключ):
watch([category, sort, priceMin, priceMax, tags], () => { page.value = 1 })
// Пагинация из query (смена page → ключ → авто-запрос):
watch(() => route.query.page, (newPage) => { page.value = newPage ? +newPage : 1 })
```

Шаблон: лоадер — `status === 'idle' || status === 'pending'`; список — `status === 'success'`; пусто — `status === 'success'` без товаров. Ручные `refresh()` убраны — их работу выполняет реактивный ключ.
