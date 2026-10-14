import { ref, watch } from "vue"
import type { Ref } from "vue"
import type { RouteLocationNormalizedLoaded, Router } from "vue-router"

export interface ProductsFiltersState {
  category: Ref<string>
  sort: Ref<string>
  priceMin: Ref<number>
  priceMax: Ref<number>
  tags: Ref<string[]>
  page: Ref<number>
}

const DEFAULT_SORT = "name:asc"
const PRICE_MAX = 2000
const SORT_WHITELIST = ["name:asc", "price:asc", "price:desc"]

const toInt = (v: unknown, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(1, Math.round(n)) : d
}
const toPrice = (v: unknown, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(PRICE_MAX, Math.max(0, Math.round(n))) : d
}
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

// Ключи фильтров в URL — для сравнения «собираемый query vs текущий URL»
const FILTER_KEYS = ["category", "sort", "priceMin", "priceMax", "tags", "page"] as const

// Каноничное строковое представление значения query (массивы сортируем, чтобы
// порядок тегов не давал ложных различий)
const normParam = (v: unknown): string => {
  if (v === undefined || v === null || v === "") return ""
  const arr = Array.isArray(v) ? v.map(String).filter(Boolean).sort() : [String(v)]
  return arr.join(",")
}

// Совпадают ли фильтры собираемого query и текущего URL (посторонние парам, вроде
// utm, не учитываем)
const sameFilters = (a: Record<string, unknown>, b: Record<string, unknown>) =>
  FILTER_KEYS.every((k) => normParam(a[k]) === normParam(b[k]))

// Единый источник истины — URL query. Родитель (products/index.vue) получает
// реактивные refs и пишет их вниз (ShowShopFilter) / в productsKey. Смена
// фильтра → router.replace (page сброс в 1), пагинация → router.replace (page),
// back/forward → refs перечитываются из query. SSR: инициализация из query на
// сервере (applyQuery вызывается в setup до рендера).
export const useProductsFilters = (
  route: RouteLocationNormalizedLoaded,
  router: Router,
): ProductsFiltersState => {
  const category = ref("")
  const sort = ref(DEFAULT_SORT)
  const priceMin = ref(0)
  const priceMax = ref(PRICE_MAX)
  const tags = ref<string[]>([])
  const page = ref(1)

  const buildQuery = (): Record<string, string | string[]> => {
    const q: Record<string, string | string[]> = {}
    if (category.value) q.category = category.value
    if (sort.value !== DEFAULT_SORT) q.sort = sort.value
    if (priceMin.value !== 0) q.priceMin = String(priceMin.value)
    if (priceMax.value !== PRICE_MAX) q.priceMax = String(priceMax.value)
    if (tags.value.length) q.tags = [...tags.value]
    if (page.value > 1) q.page = String(page.value)
    return q
  }

  const applyQuery = (q: RouteLocationNormalizedLoaded["query"]) => {
    const c = typeof q.category === "string" ? q.category : ""
    const s =
      typeof q.sort === "string" && SORT_WHITELIST.includes(q.sort)
        ? q.sort
        : DEFAULT_SORT
    let mn = toPrice(q.priceMin, 0)
    const mx = toPrice(q.priceMax, PRICE_MAX)
    if (mn > mx) mn = mx
    const tg = Array.isArray(q.tags)
      ? q.tags.filter((v): v is string => typeof v === "string" && !!v)
      : typeof q.tags === "string"
        ? [q.tags]
        : []
    const pg = toInt(q.page, 1)

    if (category.value !== c) category.value = c
    if (sort.value !== s) sort.value = s
    if (priceMin.value !== mn) priceMin.value = mn
    if (priceMax.value !== mx) priceMax.value = mx
    if (!eq(tags.value, tg)) tags.value = tg
    if (page.value !== pg) page.value = pg
  }

  // Пуш только если фильтры реально отличаются от текущего URL. Раньше здесь стоял
  // флаг `applyingUrl`, который ГЛОТАЛ пользовательское изменение в момент
  // синхронизации URL→refs (быстрые клики/навигация): тогда `page` не сбрасывался
  // → запрос уходил на пустую страницу → «Товары не найдены».
  const pushQuery = () => {
    if (!import.meta.client) return
    const q = buildQuery()
    if (sameFilters(q, route.query)) return
    router.replace({ query: q })
  }

  // Смена фильтра → ВСЕГДА сброс на 1-ю страницу + запись в URL (без гейта по флагу)
  watch([category, sort, priceMin, priceMax, tags], () => {
    if (!import.meta.client) return
    if (page.value !== 1) page.value = 1
    pushQuery()
  })

  // Смена страницы (пагинация / сброс фильтра) → URL + скролл к верху
  watch(page, () => {
    if (!import.meta.client) return
    // Скролл — ВСЕГДА; pushQuery — только если URL реально другой (иначе эхо)
    pushQuery()
    window.scrollTo({ top: 0, behavior: "smooth" })
  })

  // Внешние изменения (back/forward, прямой переход по ссылке) — перечитать refs
  watch(
    () => route.query,
    () => {
      if (!import.meta.client) return
      applyQuery(route.query)
    },
    { deep: true },
  )

  // SSR + первая гидратация: инициализируем из query синхронно (до рендера),
  // чтобы SSR-рендер сразу видел фильтры (без лишнего запроса/hydration-мисматча)
  applyQuery(route.query)

  return { category, sort, priceMin, priceMax, tags, page }
}
