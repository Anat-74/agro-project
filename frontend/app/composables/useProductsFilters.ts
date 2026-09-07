import { ref, watch, nextTick } from "vue"
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

  let applyingUrl = false

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

  const pushQuery = () => {
    if (!import.meta.client) return
    router.replace({ query: buildQuery() })
  }

  // Пользователь меняет фильтр (не из URL) → сброс на 1-ю страницу + запись в URL
  watch([category, sort, priceMin, priceMax, tags], () => {
    if (!import.meta.client || applyingUrl) return
    page.value = 1
    pushQuery()
  })

  // Смена страницы (пагинация / сброс фильтра) → URL + скролл к верху
  watch(page, () => {
    if (!import.meta.client) return
    // Скролл — ВСЕГДА (и при пагинации через URL-навигацию, и при сбросе фильтра).
    // pushQuery — только если изменение не пришло из URL (иначе эхо-loop).
    if (!applyingUrl) pushQuery()
    window.scrollTo({ top: 0, behavior: "instant" })
  })

  // Внешние изменения (back/forward, прямой переход по ссылке) — перечитать refs
  watch(
    () => route.query,
    () => {
      if (!import.meta.client) return
      applyingUrl = true
      applyQuery(route.query)
      nextTick(() => {
        applyingUrl = false
      })
    },
    { deep: true },
  )

  // SSR + первая гидратация: инициализируем из query синхронно (до рендера),
  // чтобы SSR-рендер сразу видел фильтры (без лишнего запроса/hydration-мисматча)
  applyQuery(route.query)

  return { category, sort, priceMin, priceMax, tags, page }
}
