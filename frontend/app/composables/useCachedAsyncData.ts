import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter, MultiWatchSources } from 'vue'

// Общий TTL-кэш для useAsyncData.
// - На сервере Map общий между запросами (в рамках процесса) → меньше обращений к Strapi.
// - На клиенте Map живёт в рамках SPA-сессии → повторные навигации/переоткрытия из кэша.
// Свежесть регулируется TTL; при истечении — снова запрос к Strapi.
const cache = new Map<string, { data: unknown; expiresAt: number }>()

// Предохранители от неограниченного роста памяти.
const MAX_CACHE_SIZE = 200
const SWEEP_INTERVAL = 60_000

// Удаляет просроченные записи; если размер всё ещё превышает лимит —
// вытесняет самые старые (Map хранит ключи в порядке вставки).
const sweepCache = () => {
  const now = Date.now()
  for (const [key, entry] of cache) {
    if (entry.expiresAt < now) {
      cache.delete(key)
    }
  }
  if (cache.size > MAX_CACHE_SIZE) {
    for (const key of cache.keys()) {
      if (cache.size <= MAX_CACHE_SIZE) break
      cache.delete(key)
    }
  }
}

// Периодическая очистка устаревших записей на клиенте (в рамках SPA-сессии).
// На сервере не запускаем таймер (чтобы не удерживать процесс): там достаточно
// sweep при каждой записи + сброс кэша при рестарте/деплое.
if (import.meta.client) {
  setInterval(sweepCache, SWEEP_INTERVAL)
}

type CachedAsyncDataOptions = {
  ttl?: number          // время жизни кэша, мс (по умолчанию 5 мин)
  server?: boolean      // выполнять ли хендлер на сервере (SSR)
  immediate?: boolean   // выполнять ли сразу при setup
  lazy?: boolean        // не блокировать навигацию (данные после mount)
  watch?: MultiWatchSources
}

export const useCachedAsyncData = <T>(
  key: MaybeRefOrGetter<string>,
  handler: () => Promise<T>,
  opts: CachedAsyncDataOptions = {}
) => {
  const ttl = opts.ttl ?? 300_000

  // ШТАМП ВЕРСИИ СБОРКИ в ключе. После деплоя buildId меняется → ключи новые →
  // старые закэшированные данные (и SSR-payload прошлой сборки) физически
  // недостижимы: «старьё» не залипает ни в сессии клиента, ни в кэше сервера.
  const buildId = String(useRuntimeConfig().app?.buildId ?? '')
  const stampedKey = computed(() => `${buildId}:${toValue(key)}`)

  return useAsyncData<T>(
    stampedKey,
    async () => {
      // Ключ ФИКСИРУЕМ ДО запроса. Иначе после await toValue(key) вернёт УЖЕ
      // изменённый ключ (фильтр успели переключить) — и ответ старого запроса
      // закэшируется под НОВЫМ ключом. Тогда getCachedData отдаёт устаревшие
      // (часто пустые) данные для текущего фильтра и «залипает» до конца TTL.
      const cacheKey = stampedKey.value
      const data = await handler()
      cache.set(cacheKey, { data, expiresAt: Date.now() + ttl })
      sweepCache()
      return data
    },
    {
      server: opts.server,
      immediate: opts.immediate,
      lazy: opts.lazy,
      watch: opts.watch,
      getCachedData: (k: string) => {
        const entry = cache.get(k)
        if (entry && Date.now() < entry.expiresAt) {
          return entry.data as T
        }
        // На клиенте при первом рендере (fresh load) модульный кэш пуст,
        // но данные SSR лежат в payload — возвращаем их, чтобы сервер и
        // клиент отрендерили страницу одинаково (иначе hydration mismatch).
        const nuxt = useNuxtApp()
        if (import.meta.client && nuxt.payload?.data?.[k] != null) {
          return nuxt.payload.data[k] as T
        }
        return undefined
      },
    }
  )
}
