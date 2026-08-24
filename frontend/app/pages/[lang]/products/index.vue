<script setup lang="ts">
import { shopFiltersTranslations } from '~/locales/shopFilters'
import ShowShopFilter from '~/components/show-modal/ShowShopFilter.vue'

const { find } = useStrapi();
const { currentLocale } = useLocale();
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
            populate: ["baseBgImageWebp", "retinaBgImageAvif"],
          },
        },
      },
    },
  } as any),
  { ttl: 600_000 },
)

const breadcrumbsBackground = computed(() => {
  const bc = (globalData.value?.data?.[0] as any)?.breadcrumbs
  return bc?.background ?? null
})

// ===== Количество результатов =====
const { data: productsMeta } = useCachedAsyncData(
  `shop-total-${currentLocale.value}`,
  () => find("products", {
    filters: { locale: { $eq: currentLocale.value } },
    fields: ["id"],
    pagination: { page: 1, pageSize: 1 },
  } as any),
  { ttl: 600_000 },
)

const resultsCount = computed(() => productsMeta.value?.meta?.pagination?.total ?? 0)

// SEO
useSeoMeta({
  title: "All Products",
  description: "All products",
});

// watchEffect(() => {
//   if (subcategory.value) {
//     useSeoMeta({
//       title:
//         subcategory.value.seo?.metaTitle ||
//         subcategory.value.seoTitle ||
//         subcategory.value.name,
//       description:
//         subcategory.value.seo?.metaDescription ||
//         subcategory.value.seoDescription ||
//         subcategory.value.name,
//       ogTitle:
//         subcategory.value.seo?.metaTitle ||
//         subcategory.value.seoTitle ||
//         subcategory.value.name,
//       ogDescription:
//         subcategory.value.seo?.metaDescription ||
//         subcategory.value.seoDescription ||
//         subcategory.value.name,
//       ogImage: subcategory.value.seoImage?.[0]?.url
//         ? `${config.public.strapi.url}${subcategory.value.seoImage[0].url}`
//         : subcategory.value.image?.url
//           ? `${config.public.strapi.url}${subcategory.value.image.url}`
//           : `${config.public.siteUrl}/default-subcategory-image.jpg`,
//       ogUrl: `${config.public.siteUrl}${route.fullPath}`,
//     });

//     // Добавляем structured data в useHead
//     useHead({
//       script: subcategory.value?.seo?.structuredData
//         ? [
//             {
//               type: "application/ld+json",
//               innerHTML: JSON.stringify(subcategory.value.seo.structuredData),
//             },
//           ]
//         : [],
//     });
//   }
// });
</script>

<template>
  <div class="products-page">
    <!-- Хлебные крошки: переиспользуемый компонент, фон из Strapi (webp + avif) -->
    <UBreadcrumbs
      :items="[{ label: t.breadcrumbsCurrent }]"
      :background="breadcrumbsBackground"
    />

    <!-- Верхний блок: кнопка-диалог + сортировка + количество -->
    <div class="top-bar">
      <div class="top-bar__container">
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
            <label class="visually-hidden" for="top-bar-sort">
              {{ t.sortLabel }}
            </label>
            <select id="top-bar-sort" v-model="sort" class="top-bar__select">
              <option value="name:asc">{{ t.sortName }}</option>
              <option value="price:asc">{{ t.sortPriceAsc }}</option>
              <option value="price:desc">{{ t.sortPriceDesc }}</option>
            </select>
          </div>
          <span class="top-bar__results">
            {{ t.resultsCount.replace("{count}", String(resultsCount)) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Основной контент: сайдбар + сетка товаров -->
    <div class="products-page__container">
      <div class="products-page__body">
        <!-- Сайдбар фильтров: диалог изначально открыт, кнопка «Фильтр» в top-bar -->
        <ShowShopFilter
          ref="shopFilter"
          :category="category"
          :sort="sort"
          :price-min="priceMin"
          :price-max="priceMax"
          :tags="tags"
          @update:category="category = $event"
          @update:sort="sort = $event"
          @update:price-min="priceMin = $event"
          @update:price-max="priceMax = $event"
          @update:tags="tags = $event"
        />

        <!-- TODO: сетка товаров (ProductCard + пагинация) -->
        <section class="products-page__content" aria-label="Products">
          <span class="visually-hidden">Products grid</span>
        </section>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.products-page {
  &__body {
    display: flex;
    gap: toRem(30);
    align-items: flex-start;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }
}

// ===== Хлебные крошки =====
// (стили вынесены в переиспользуемый компонент Breadcrumbs.vue)

// ===== Верхний блок (top-bar) =====
.top-bar {
  padding-block-end: toRem(18);
  border-bottom: toRem(1) solid var(--border-color);
  margin-block-end: toRem(24);

  &__container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: toRem(12);
  }

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

  &__select {
    appearance: none;
    background-color: transparent;
    border: none;
    padding: toRem(4) toRem(24) toRem(4) toRem(8);
    font-size: toEm(14);
    font-weight: 500;
    color: var(--color);
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right toRem(4) center;
    background-size: toRem(12) toRem(8);
    outline: none;
    min-width: toRem(80);

    @include hover {
      color: var(--success-color);
    }

    &:focus {
      color: var(--success-color);
    }

    option {
      font-weight: 400;
      color: var(--color);
    }
  }

  &__results {
    font-size: toEm(14);
    color: var(--gray-color);
    white-space: nowrap;
  }

  // ==== Адаптив ====
  @media (max-width: $mobile) {
    &__container {
      flex-direction: column;
      align-items: flex-start;
      gap: toRem(12);
    }

    &__right {
      flex-wrap: wrap;
      gap: toRem(12);
      width: 100%;
    }

    &__sort {
      flex: 1;
      min-width: toRem(150);
    }

    &__select {
      width: 100%;
      padding-block: toRem(6);
    }

    &__results {
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
      flex-direction: row;
      align-items: center;
      width: 100%;
    }

    &__select {
      flex: 1;
    }

    &__results {
      text-align: end;
    }
  }
}
</style>
