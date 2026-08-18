<script setup lang="ts">
import { productFilterTranslations } from "~/locales/productFilter";
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden";
import { buttonTranslations } from "~/locales/button";

const { find } = useStrapi();
const route = useRoute();
const { categorySlug } = route.params as { categorySlug: string };
const { currentLocale } = useLocale();
const productFilterT = computed(() => productFilterTranslations[currentLocale.value])
const visuallyHiddenT = computed(() => visuallyHiddenTranslations[currentLocale.value])
const buttonT = computed(() => buttonTranslations[currentLocale.value])
const { goBack, goForward } = useGoToForwardOrBack();

const sortOption = ref<string>("name:asc");
const page = ref(route.query.page ? +route.query.page : 1); // Текущая страница из query-параметра
const pageSize = 12; // Количество товаров на странице

// Загрузка категории и продуктов напрямую
const { data, pending, error, refresh } = useCachedAsyncData(
  `category-products-${currentLocale.value}-${categorySlug}-${page.value}-${sortOption.value}`,
  async () => {
    // Параллельная загрузка данных
    const [categoryRes, productsRes] = await Promise.all([
      // Запрос категории
      find("categories", {
        filters: {
          slug: { $eq: categorySlug },
          locale: { $eq: currentLocale.value },
        },
        fields: ["id", "name"],
      } as any),

      // Запрос продуктов с фильтрацией по slug категории
      find("products", {
        filters: {
          category: { slug: { $eq: categorySlug } },
          locale: { $eq: currentLocale.value },
        },
        populate: {
          image: {
            fields: ["alternativeText", "url"],
          },
        },
        sort: sortOption.value,
        pagination: {
          page: page.value,
          pageSize: pageSize,
        },
      } as any),

      // Запрос продуктов с фильтрацией по slug категории
      find("products", {
        filters: {
          category: { slug: { $eq: categorySlug } },
          locale: currentLocale.value,
        },
        populate: {
          image: {
            fields: ["alternativeText", "url"],
          },
        },
        sort: sortOption.value,
        pagination: {
          page: page.value,
          pageSize: pageSize,
        },
      } as any),
    ]);

    // Обработка ошибок категории
    if (!categoryRes.data || categoryRes.data.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category Not Found",
      });
    }

    return {
      category: categoryRes.data[0] as Category,
      products: productsRes as ProductsResponse,
    };
  },
  { ttl: 600_000 },
 );

// Разделение данных
const category = computed(() => data.value?.category);
const products = computed(() => data.value?.products);

// Флаг загрузки
const isLoading = ref(pending);

// Количество страниц
const pageCount = computed(() => {
  return products.value?.meta?.pagination?.pageCount || 1;
});

// Обработчик изменения страницы
watch(
  () => route.query.page,
  (newPage) => {
    page.value = newPage ? +newPage : 1;
    refresh(); // Перезагружаем данные
  },
);

// Обработчик сортировки
watch(sortOption, () => {
  refresh(); // Перезагружаем данные
});

console.debug(products.value)

// SEO
watchEffect(() => {
  if (category.value) {
    useSeoMeta({
      title: category.value.name,
      description: category.value.name,
    });
  }
});
</script>

<template>
  <div>
  <ULoader v-show="isLoading" class="loader" />
  <section
    v-show="!isLoading"
    class="products-section"
    aria-labelledby="products-section"
  >
    <div class="products-section__container">
      <div class="products-section__row-top">
        <UButton
          icon="material-symbols:arrow-back"
          :aria-label="buttonT.ariaLabelGoBack"
          @click="goBack"
        />
        <UButton
          icon="material-symbols:arrow-forward"
          :aria-label="buttonT.ariaLabelGoForward"
          @click="goForward"
        />
        <div class="products-section__select-wrapper select-wrapper">
          <label class="visually-hidden" for="sort-product">
            {{ productFilterT.labelSelect }}
          </label>
          <select
            id="sort-product"
            v-model="sortOption"
            class="products-section__select select"
          >
            <option value="name:asc">
              {{ productFilterT.optionName }}
            </option>
            <option value="price:asc">
              {{ productFilterT.optionPrice }}
            </option>
            <option value="price:desc">
              {{ productFilterT.optionPriceDesc }}
            </option>
          </select>
        </div>
      </div>
      <h2 class="visually-hidden">
        {{ visuallyHiddenT.sectionSubcategorySlugList }}
      </h2>
        {{ productFilterT.noResults }}
      </div>
      <UPagination
        v-if="pageCount > 1"
        class="products-section__pagination"
        :page="page"
        :page-count="pageCount"
        :route-name="route.name?.toString() || ''"
      />
  </section>

  <span v-if="error" class="error">
    {{ error.message }}
  </span>
  </div>
</template>

<style lang="scss" scoped>
.products-section {
  padding-block: toEm(12);

  &__row-top {
    display: grid;
    grid-template-columns: repeat(2, auto) 1fr;
    align-items: center;
    column-gap: toRem(7);
    margin-block-end: toEm(12);
  }

  &__select-wrapper {
    justify-self: end;
    display: flex;
    height: 100%;
  }

  &__category-title {
    color: var(--warning-color);
    margin-block-end: toEm(12);
  }

  &__card-list {
   position: relative;
   justify-items: center;
   row-gap: toEm(32);
   @include gridCards;
   @include adaptiveValue("column-gap", 64, 5);

   //  @media (max-width: toEm(588)) {
   //    grid-template-columns: repeat(2, 1fr);
   //  }

   //  @media (max-width:$mobileSmall){
   //     grid-template-columns: 1fr; 
   //  }
  }

  &__item {
      @include adaptiveValue("height", 395, 320);
  }

  &__pagination {
    justify-self: end;
  }

  &__empty {
    text-align: center;
    padding: toEm(20);
    font-size: toEm(18);
    color: var(--text-color);
  }
}
</style>
