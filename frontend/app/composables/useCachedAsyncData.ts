import { toValue } from 'vue'
import type { MaybeRefOrGetter, MultiWatchSources } from 'vue'

// Общий TTL-кэш для useAsyncData.
// - На сервере Map общий между запросами (в рамках процесса) → меньше обращений к Strapi.
// - На клиенте Map живёт в рамках SPA-сессии → повторные навигации/переоткрытия из кэша.
// Свежесть регулируется TTL; при истечении — снова запрос к Strapi.
const cache = new Map<string, { data: unknown; expiresAt: number }>()

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
