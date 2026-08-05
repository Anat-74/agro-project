import { toValue } from 'vue'
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

  return useAsyncData<T>(
    key,
    async () => {
      const data = await handler()
      cache.set(toValue(key), { data, expiresAt: Date.now() + ttl })
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
        return entry && Date.now() < entry.expiresAt ? entry.data as T : undefined
      },
    }
  )
}
