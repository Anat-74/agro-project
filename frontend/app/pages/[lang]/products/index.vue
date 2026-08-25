<script setup lang="ts">
import { shopFiltersTranslations } from '~/locales/shopFilters'
import ShowShopFilter from '~/components/show-modal/ShowShopFilter.vue'

const { find } = useStrapi();
const { currentLocale } = useLocale();
const route = useRoute();
const t = computed(() => shopFiltersTranslations[currentLocale.value])

const shopFilterRef = useTemplateRef<InstanceType<typeof ShowShopFilter>>("shopFilter")

// ===== Состояние фильтров (сайдбар + сортировка) =====
const category = ref("");
const sort = ref("name:asc");
const priceMin = ref(0);
const priceMax = ref(2000);
const tags = ref<string[]>([]);

// ===== Хлебные крошки: фон из global.breadcrumbs (background.background-image) =====
const { data: globalData } = useCachedAsyncData(
  `shop-global-breadcrumbs-${currentLocale.value}`,
  () => find("global", {
    filters: { locale: { $eq: currentLocale.value } },
    fields: ["id"],
    populate: {
      breadcrumbs: {
        populate: {
          background: {
            populate: {
              baseBgImageWebp: { fields: ["url"] },
              retinaBgImageAvif: { fields: ["url"] },
            },
          },
        },
      },
    },
  } as any),
  { ttl: 600_000 },
)

const breadcrumbsBackground = computed(() => {
  // global — single type: Content API возвращает data как объект (не массив)
  const g = globalData.value?.data as any
  const bc = Array.isArray(g) ? g[0]?.breadcrumbs : g?.breadcrumbs
  return bc?.background ?? null
})

// ===== Товары: все продукты с фильтрами/сортировкой/пагинацией =====
const page = ref(route.query.page ? +route.query.page : 1);
const PAGE_SIZE = 12;

const productsKey = () =>
  `shop-products-${currentLocale.value}-${category.value}-${sort.value}-${priceMin.value}-${priceMax.value}-${tags.value.join(",")}-${page.value}`

const { data: productsData, pending, refresh } = useCachedAsyncData(
  productsKey,
  async () => {
    const filters: any = { locale: { $eq: currentLocale.value } }
    if (category.value) filters.category = { slug: { $eq: category.value } }
    if (priceMin.value > 0 || priceMax.value < 2000) {
      filters.price = {}
      if (priceMin.value > 0) filters.price.$gte = priceMin.value
      if (priceMax.value < 2000) filters.price.$lte = priceMax.value
    }
    return find("products", {
      filters,
      populate: { image: { fields: ["alternativeText", "url"] } },
      sort: [sort.value],
      pagination: { page: page.value, pageSize: PAGE_SIZE },
    } as any) as Promise<ProductsResponse>
  },
  { ttl: 600_000 },
)

const products = computed(() => productsData.value?.data ?? [])
const pageCount = computed(() => productsData.value?.meta?.pagination?.pageCount || 1)
const resultsCount = computed(() => productsData.value?.meta?.pagination?.total ?? 0)

// Смена фильтров/сортировки — сброс на первую страницу и перезагрузка
watch([category, sort, priceMin, priceMax, tags], () => {
  page.value = 1
  refresh()
})

// Пагинация из query-параметра
watch(
  () => route.query.page,
  (newPage) => {
    page.value = newPage ? +newPage : 1
    refresh()
  },
)

// SEO — страница «все товары» не имеет контент-типа в Strapi, поэтому мета
// статическая локализованная (паттерн подкатегории адаптирован). ogImage — фон
// breadcrumbs из Strapi. StructuredData не добавляем (нет источника данных).
const config = useRuntimeConfig();

const seoTitle = computed(() => t.value.seoTitle)
const seoDescription = computed(() => t.value.seoDescription)
const seoImage = computed(() => {
  const webp = breadcrumbsBackground.value?.baseBgImageWebp?.url
  const avif = breadcrumbsBackground.value?.retinaBgImageAvif?.url
  const url = webp || avif
  return url ? `${config.public.strapi.url}${url}` : null
})

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: seoImage,
  ogUrl: computed(() => `${config.public.siteUrl}${route.fullPath}`),
});
</script>

<template>
  <section class="products-page" aria-labelledby="products-page-title">
    <!-- Скрытый H1: на странице нет видимого главного заголовка,
         но у section обязан быть заголовок (паттерн страниц каталога) -->
    <h1 id="products-page-title" class="visually-hidden">
      {{ t.seoTitle }}
    </h1>

    <!-- Хлебные крошки: переиспользуемый компонент, фон из Strapi (webp + avif) -->
    <UBreadcrumbs
      :items="[{ label: t.breadcrumbsCurrent }]"
      :background="breadcrumbsBackground"
    />

    <!-- Основной контейнер: top-bar + контент -->
    <div class="products-page__container">
      <!-- Верхний блок: кнопка-диалог + сортировка + количество -->
      <div class="top-bar">
        <div class="top-bar__left">
          <UButton
            class="top-bar__filter-btn"
            variant="plain"
            :aria-label="t.filterTitle"
            :aria-expanded="shopFilterRef?.isOpen"
            @click="shopFilterRef?.toggle()"
          >
            <Icon name="mingcute:filter-line" />
            <span>{{ t.filterTitle }}</span>
          </UButton>
        </div>

        <div class="top-bar__right">
          <div class="top-bar__sort">
            <USelect
              v-model="sort"
              class="top-bar__select"
              :label="t.sortLabel"
              :options="[
                { value: 'name:asc', label: t.sortName },
                { value: 'price:asc', label: t.sortPriceAsc },
                { value: 'price:desc', label: t.sortPriceDesc },
              ]"
            />
          </div>
          <span class="top-bar__results">
            {{ t.resultsCount.replace("{count}", String(resultsCount)) }}
          </span>
        </div>
      </div>

      <div class="products-page__body">
        <!-- Сайдбар фильтров: диалог изначально открыт, кнопка «Фильтр» в top-bar -->
        <ShowShopFilter
          ref="shopFilter"
          :category="category"
          :price-min="priceMin"
          :price-max="priceMax"
          :tags="tags"
          @update:category="category = $event"
          @update:price-min="priceMin = $event"
          @update:price-max="priceMax = $event"
          @update:tags="tags = $event"
        />

        <!-- Список карточек товаров + пагинация -->
        <section class="products-page__content" aria-label="Products">
          <ULoader v-show="pending" class="products-page__loader loader" />
          <ul v-if="products.length" class="products-page__card-list">
            <ProductCard
              v-for="(prod, index) in products"
              :key="prod.documentId"
              class="products-page__item"
              :product="prod"
              :index="index"
            />
          </ul>
          <div v-else-if="!pending" class="products-page__empty">
            {{ t.noResults }}
          </div>

          <UPagination
            v-if="pageCount > 1"
            class="products-page__pagination"
            :page="page"
            :page-count="pageCount"
            :route-name="route.name?.toString() || ''"
          />
        </section>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.products-page {
  &__body {
    display: flex;
    gap: toRem(30);
    align-items: stretch;

    @media (max-width: $mobile) {
      flex-direction: column;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
    // Блок карточек — контейнер: сетка адаптируется к ширине самого блока
    // (закрыт диалог / мобильный), а не к вьюпорту
    @include containerParent(cards, inline-size);
  }

  &__card-list {
    display: grid;
    justify-items: center;
    row-gap: toEm(24);
    @include gridCards(fit, toRem(180), 1fr);
    @include adaptiveValue("column-gap", 40, 5);
  }

  &__item {
    @include adaptiveValue("height", 280, 220);
  }

  &__pagination {
    justify-self: end;
    margin-block-start: toRem(24);
  }

  &__empty {
    text-align: center;
    padding: toEm(20);
    font-size: toEm(18);
    color: var(--gray-color);
  }

  &__loader {
    translate: 0;
  }
}

// Узкий блок карточек (мобильный / при закрытом диалоге) — 2 карточки в ряд
@container cards (max-width: 34.375rem) {
  .products-page__card-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

// ===== Хлебные крошки =====
// (стили вынесены в переиспользуемый компонент Breadcrumbs.vue)

// ===== Верхний блок (top-bar) =====
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: toRem(12);
  padding-block-end: toRem(18);
  border-bottom: toRem(1) solid var(--border-color);
  margin-block-end: toRem(24);

  &__left {
    display: flex;
    align-items: center;
  }

  &__filter-btn {
    display: inline-flex;
    align-items: center;
    gap: toRem(8);
    background: none;
    border: none;
    cursor: pointer;
    padding: toRem(8) toRem(12);
    border-radius: toRem(8);
    font-size: toEm(16);
    font-weight: 500;
    color: var(--color);
    transition: background-color var(--transition-duration);

    svg {
      color: var(--color);
      flex-shrink: 0;
      width: toRem(20);
      height: toRem(20);
    }

    @include hover {
      background-color: var(--whitesmoke-color);
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: toRem(24);
  }

  &__sort {
    display: flex;
    align-items: center;
    gap: toRem(8);
  }

  &__results {
    font-size: toEm(14);
    color: var(--gray-color);
    white-space: nowrap;
  }

  // ==== Адаптив ====
  @media (max-width: $mobile) {
    // Кнопка + select в одну строку (space-between), количество — отдельной строкой
    &__right {
      flex: 1;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: toRem(12);
    }

    &__sort {
      flex: 0 1 auto;
      min-width: 0;
    }

    &__results {
      flex-basis: 100%;
      text-align: end;
      font-size: toEm(13);
    }

    &__filter-btn {
      font-size: toEm(15);
    }
  }

  @media (max-width: $mobileSmall) {
    &__right {
      flex-direction: column;
      align-items: stretch;
      gap: toRem(8);
    }

    &__sort {
      width: 100%;
    }

    &__results {
      text-align: end;
    }
  }
}
</style>
